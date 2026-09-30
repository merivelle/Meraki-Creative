/**
 * The studio's copy of a new inquiry (email-only mode): on-brand and organized, because until
 * Supabase is connected this email is the only record. Built with tables and inline styles so
 * it holds up in Gmail, Apple Mail, and Outlook. Archivo / JetBrains Mono load where the client
 * allows web fonts and fall back to Helvetica / Menlo elsewhere.
 */
import type { AnswerSection } from "@/lib/inquiry/summary";
import type { EmailContent } from "./templates";

const C = {
  paper: "#F3F2EE", paper2: "#E9E7E0", ink: "#17150F", ink2: "#3A362F", soft: "#6B665C",
  line: "#D9D5CB", accent: "#7B2D26", accentSoft: "#C9897F", night: "#15130E",
};
const SANS = "'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono',Menlo,Consolas,'Courier New',monospace";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const mono = (size = 11, color = C.soft) =>
  `font-family:${MONO};font-size:${size}px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:${color};`;

/** Answers that the header block already shows; the sections below skip them. */
const IN_HEADER = new Set(["name", "email", "client_type", "business_name", "services", "package", "goal", "description", "brief_gate"]);
const SECTION_TITLES: Record<string, string> = { project: "Links" };

const isBrief = (id: string) => id.startsWith("brief_");
// Main answers first, then links, then the design brief (with its own divider).
const rank = (id: string) => (isBrief(id) ? 2 : id === "project" ? 1 : 0);
const HEX = /^#[0-9a-f]{6}$/i;

export function inquiryStudioEmail(p: { sections: AnswerSection[]; received?: Date; kind?: "inquiry" | "brief" }): EmailContent {
  const kind = p.kind ?? "inquiry";
  const all = new Map(p.sections.flatMap((s) => s.rows.map((r) => [r.id, r] as const)));
  const get = (id: string) => all.get(id)?.value ?? "";
  const name = get("name");
  const email = get("email");
  const first = name.split(/\s+/)[0] || "them";
  const tags = [...(all.get("services")?.items ?? []), ...(get("package") ? [get("package")] : [])];
  const who = [get("client_type"), get("business_name")].filter(Boolean).join(" · ");
  const when = (p.received ?? new Date()).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles",
  });
  const reply = `mailto:${email}?subject=${encodeURIComponent("Re: your Meraki Creative inquiry")}`;

  const rest = p.sections
    .map((s) => ({ ...s, title: SECTION_TITLES[s.id] ?? s.title, rows: s.rows.filter((r) => !IN_HEADER.has(r.id)) }))
    .filter((s) => s.rows.length)
    .sort((x, y) => rank(x.id) - rank(y.id));

  const link = (u: string) => {
    const [href, ...note] = u.split(" (");
    const text = note.length ? `${esc(href)}<br><span style="color:${C.ink2};font-size:14px">${esc(note.join(" (").replace(/\)$/, ""))}</span>` : esc(href);
    return `<a href="${esc(href)}" style="color:${C.accent};text-decoration:underline;word-break:break-all">${text}</a>`;
  };
  const value = (r: AnswerSection["rows"][number]) => {
    if (r.items && r.items.every((u) => /^https?:\/\//.test(u))) return r.items.map(link).join(`<div style="height:10px"></div>`);
    if (r.id === "brief_sections" && r.items) {
      return r.items.map((x, i) => `<span style="${mono(10, C.accent)}">${String(i + 1).padStart(2, "0")}</span>&nbsp;&nbsp;${esc(x)}`).join("<br>");
    }
    if (r.id === "brief_hex") {
      return r.value.split(/[\s,]+/).filter((h) => HEX.test(h)).map((h) =>
        `<span style="display:inline-block;margin:0 10px 6px 0;white-space:nowrap"><span style="display:inline-block;width:18px;height:18px;vertical-align:middle;background:${h};border:1px solid ${C.line}"></span>&nbsp;<span style="${mono(10, C.ink)}">${esc(h)}</span></span>`).join("");
    }
    return esc(r.value).replace(/\n/g, "<br>");
  };
  const firstBrief = rest.findIndex((s) => isBrief(s.id));

  const sectionsHtml = rest.map((s, i) => `${i === firstBrief && kind === "inquiry" ? `
    <tr><td style="padding:10px 32px 26px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:${C.night};padding:16px 20px">
          <div style="${mono(10, C.accentSoft)}">Design brief</div>
          <div style="margin-top:6px;font-family:${SANS};font-size:15px;color:${C.paper}">${esc(first)} went deeper on the look, pages, and practicalities.</div>
        </td>
      </tr></table>
    </td></tr>` : ""}
    <tr><td style="padding:0 32px 26px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.ink}">
        <tr><td colspan="2" style="padding:14px 0 6px;${mono(11, C.ink)}">
          <span style="color:${C.accent}">( ${String(i + 1).padStart(2, "0")} )</span>&nbsp;&nbsp;${esc(s.title)}
        </td></tr>
        ${s.rows.map((r) => `
        <tr>
          <td valign="top" width="40%" style="padding:12px 16px 12px 0;border-bottom:1px solid ${C.line};${mono(10, C.soft)}">${esc(r.label)}</td>
          <td valign="top" style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;line-height:1.5;color:${C.ink}">${value(r)}</td>
        </tr>`).join("")}
      </table>
    </td></tr>`).join("");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<title>${kind === "brief" ? "Design brief from" : "New inquiry from"} ${esc(name)}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper2}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc([get("goal"), tags.join(", ")].filter(Boolean).join(" · "))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper2}">
<tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.paper}">

  <tr><td style="background:${C.night};padding:20px 32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${SANS};font-size:18px;font-weight:800;letter-spacing:-0.02em;color:${C.paper}">Meraki Creative<span style="color:${C.accentSoft}">.</span></td>
      <td align="right" style="${mono(10, C.accentSoft)}">${kind === "brief" ? "Design brief" : "New inquiry"}</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:40px 32px 28px">
    <div style="${mono(10, C.soft)}">( Received ) &nbsp;${esc(when)} PT</div>
    <h1 style="margin:14px 0 0;font-family:${SANS};font-size:38px;line-height:1.02;font-weight:800;letter-spacing:-0.035em;color:${C.ink}">${esc(name)}</h1>
    ${who ? `<div style="margin-top:10px;font-family:${SANS};font-size:15px;color:${C.ink2}">${esc(who)}</div>` : ""}
    <div style="margin-top:6px;font-family:${SANS};font-size:15px"><a href="mailto:${esc(email)}" style="color:${C.accent};text-decoration:none">${esc(email)}</a></div>
    ${tags.length ? `<div style="margin-top:18px">${tags.map((t) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:6px 10px;border:1px solid ${C.ink};${mono(10, C.ink)}">${esc(t)}</span>`).join("")}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px"><tr>
      <td style="background:${C.ink}"><a href="${esc(reply)}" style="display:inline-block;padding:13px 20px;${mono(11, C.paper)}text-decoration:none">Reply to ${esc(first)} &rarr;</a></td>
    </tr></table>
  </td></tr>

  ${get("goal") ? `
  <tr><td style="padding:0 32px 26px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="border-left:3px solid ${C.accent};padding:4px 0 4px 18px">
        <div style="${mono(10, C.soft)}">The goal</div>
        <div style="margin-top:8px;font-family:${SANS};font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.015em;color:${C.ink}">${esc(get("goal"))}</div>
      </td>
    </tr></table>
  </td></tr>` : ""}

  ${get("description") ? `
  <tr><td style="padding:0 32px 32px">
    <div style="${mono(10, C.soft)}">The project</div>
    <div style="margin-top:8px;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.ink2}">${esc(get("description")).replace(/\n/g, "<br>")}</div>
  </td></tr>` : ""}

  ${sectionsHtml}

  <tr><td style="background:${C.night};padding:22px 32px">
    <div style="${mono(10, C.accentSoft)}">${kind === "brief" ? "Design brief" : "Start a Project"} · merakicreative.co</div>
    <div style="margin-top:8px;font-family:${SANS};font-size:13px;line-height:1.5;color:#B9B3A6">Replying to this email goes straight to ${esc(name)} at ${esc(email)}.</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `${kind === "brief" ? "DESIGN BRIEF" : "NEW INQUIRY"} · ${when} PT`,
    "",
    name,
    ...(who ? [who] : []),
    email,
    ...(tags.length ? [tags.join(" · ")] : []),
    "",
    ...(get("goal") ? ["THE GOAL", get("goal"), ""] : []),
    ...(get("description") ? ["THE PROJECT", get("description"), ""] : []),
    ...rest.flatMap((s, i) => [
      ...(i === firstBrief && kind === "inquiry" ? ["———— DESIGN BRIEF ————", ""] : []),
      `( ${String(i + 1).padStart(2, "0")} ) ${s.title.toUpperCase()}`, ...s.rows.map((r) => `${r.label}: ${r.value}`), "",
    ]),
    `Reply to this email to answer ${first} directly.`,
  ].join("\n");

  const subject = kind === "brief" ? `Design brief: ${name}` : `New inquiry: ${name}${tags.length ? ` · ${tags[0]}` : ""}`;
  return { subject, text, html };
}
