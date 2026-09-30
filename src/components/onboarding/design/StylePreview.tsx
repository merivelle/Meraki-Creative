"use client";

/**
 * Twenty miniature websites, one per design direction. Each is its own composition (grid,
 * alignment, scale, density, borders, crop), not a recolour of a shared template.
 * Colours and fonts come from the direction's first suggested palette and pairing, set as
 * CSS variables on the preview root, so nothing leaks into the form.
 */
import type { CSSProperties } from "react";
import { styleById } from "@/content/design/styles";
import { paletteById, type Palette } from "@/content/design/palettes";
import { pairingById } from "@/content/design/typography";
import { FONT, FontshareSatoshi } from "./fonts";
import type { Sample } from "./sample";
import { Collage, Doodle, Dusk, FilmFrame, Geometry, Organic, Painting, Pixels, Portrait, Poster, WindowLight } from "./Scenes";
import css from "./preview.module.css";

export type Variant = "card" | "desktop" | "mobile";
type C = { s: Sample; p: Palette };

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const Nav = ({ s, style }: { s: Sample; style?: CSSProperties }) => (
  <div className={css.nav} style={style}>{s.nav.map((n) => <span key={n}>{n}</span>)}</div>
);

/* ---------------------------------------------------------------- Quiet */

function Minimal({ s, p }: C) {
  return (
    <div style={{ padding: "2.6em 3.2em", height: "100%", display: "flex", flexDirection: "column" }}>
      <div className={css.row} style={{ fontSize: "0.9em" }}>
        <span style={{ fontWeight: 600 }}>{s.brand}</span>
        <Nav s={s} style={{ color: p.muted }} /><span className={css.burger} />
      </div>
      <div className={cx(css.g2)} style={{ gridTemplateColumns: "1.25fr 1fr", gap: "3em", marginTop: "5em", alignItems: "end" }}>
        <div>
          <p className={css.hd} style={{ fontSize: "2.5em", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{s.headline}</p>
          <p className={css.muted} style={{ marginTop: "1.2em", maxWidth: "26em" }}>{s.deck}</p>
          <p style={{ marginTop: "1.6em" }}><span className={css.link}>{s.cta}</span> →</p>
        </div>
        <div className={css.img} style={{ aspectRatio: "4 / 5" }}><Dusk a={p.surface} b={p.bg} c={p.muted} d={p.bg} /></div>
      </div>
      <div style={{ marginTop: "auto", borderTop: `1px solid ${p.border}`, paddingTop: "1em" }} className={css.row}>
        <span className={css.muted} style={{ fontSize: "0.8em" }}>{s.section}</span>
        <span style={{ fontSize: "0.8em" }} className={css.dk}>{s.items.join("  ·  ")}</span>
      </div>
    </div>
  );
}

function Swiss({ s, p }: C) {
  return (
    <div style={{ padding: "1.8em 2.2em", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", inset: "0 2.2em", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "0.8em", pointerEvents: "none" }} className={css.dk}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ borderLeft: `1px solid ${p.border}`, borderRight: `1px solid ${p.border}`, opacity: 0.7 }} />)}
      </div>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "0.8em", fontSize: "0.82em" }}>
        <span style={{ gridColumn: "span 3", fontWeight: 700 }}>{s.brand}</span>
        <span style={{ gridColumn: "span 3" }} className={css.dk}>{s.role}</span>
        <span style={{ gridColumn: "7 / span 6", display: "flex", gap: "1.6em" }} className={css.dk}>{s.nav.map((n) => <span key={n}>{n}</span>)}</span>
      </div>
      <div style={{ position: "relative", borderTop: `2px solid ${p.text}`, marginTop: "1em" }} />
      <p className={css.hd} style={{ position: "relative", fontSize: "5.4em", fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.86, marginTop: "0.25em", maxWidth: "9em" }}>
        {s.short}.
      </p>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "0.8em", marginTop: "2em", fontSize: "0.85em" }}>
        <span style={{ gridColumn: "span 2", fontWeight: 700 }}>01</span>
        <p style={{ gridColumn: "3 / span 4" }}>{s.deck}</p>
        <p style={{ gridColumn: "8 / span 4" }} className={css.dk}>{s.body}</p>
      </div>
      <div style={{ position: "absolute", right: "2.2em", bottom: "2em", width: "6em", height: "6em", background: p.accent }} />
      <div style={{ position: "absolute", left: "2.2em", right: "10em", bottom: "2em", borderTop: `1px solid ${p.text}`, paddingTop: "0.6em", fontSize: "0.8em", display: "flex", gap: "2em" }}>
        <span style={{ fontWeight: 700 }}>02 {s.section}</span><span className={css.dk}>{s.items[0]}</span>
      </div>
    </div>
  );
}

function Gallery({ s, p }: C) {
  return (
    <div style={{ padding: "1.8em 2.4em", height: "100%", display: "grid", gridTemplateRows: "auto 1fr auto" }}>
      <div className={css.row} style={{ fontSize: "0.78em" }}><span>{s.brand}</span><span className={css.muted}>Index · Info</span></div>
      <div className={css.g2} style={{ gridTemplateColumns: "1fr 13em", gap: "3em", alignItems: "center", padding: "2em 0 1em" }}>
        <figure>
          <div className={css.img} style={{ aspectRatio: "4 / 3", width: "82%", margin: "0 auto", boxShadow: `0 0 0 1px ${p.border}` }}>
            <Painting a={p.surface} b={p.accent} c={p.text} d={p.bg} />
          </div>
          <figcaption style={{ fontSize: "0.72em", marginTop: "1em", marginLeft: "9%" }}>
            <strong style={{ fontWeight: 600 }}>{s.items[0]}</strong>, {s.year}<br /><span className={css.muted}>{s.itemMeta[0]}</span>
          </figcaption>
        </figure>
        <ol style={{ listStyle: "none", fontSize: "0.8em" }} className={css.dk}>
          {s.items.map((it, i) => (
            <li key={it} style={{ display: "flex", gap: "1.2em", padding: "0.7em 0", borderBottom: `1px solid ${p.border}`, color: i ? p.muted : p.text }}>
              <span>{String(i + 1).padStart(2, "0")}</span><span>{it}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className={css.muted} style={{ fontSize: "0.72em" }}>{s.section} — {s.items.length} works</p>
    </div>
  );
}

/* ---------------------------------------------------------------- Editorial */

function Editorial({ s, p }: C) {
  return (
    <div style={{ padding: "1.4em 2.4em" }}>
      <div style={{ borderTop: `3px solid ${p.text}`, borderBottom: `1px solid ${p.text}`, padding: "0.5em 0", textAlign: "center" }}>
        <span className={css.hd} style={{ fontSize: "1.9em", letterSpacing: "-0.01em" }}>{s.brand}</span>
      </div>
      <div className={css.row} style={{ fontSize: "0.68em", padding: "0.4em 0", borderBottom: `1px solid ${p.border}` }}>
        <span className={css.cap}>Issue 04 · {s.year}</span><span className={cx(css.cap, css.dk)}>{s.nav.join("   ")}</span>
      </div>
      <div className={css.g2} style={{ gridTemplateColumns: "1.35fr 1fr", gap: "2em", marginTop: "1.4em" }}>
        <div>
          <p className={css.cap} style={{ color: p.accentText, fontWeight: 600 }}>Feature</p>
          <p className={css.hd} style={{ fontSize: "3.1em", lineHeight: 1.02, marginTop: "0.2em", letterSpacing: "-0.01em" }}>{s.headline}</p>
          <p style={{ fontSize: "1.05em", marginTop: "0.8em", fontStyle: "italic" }} className={css.hd}>{s.deck}</p>
          <div className={css.g2} style={{ gap: "1.4em", marginTop: "1em", fontSize: "0.75em", lineHeight: 1.5 }}>
            <p><span className={css.hd} style={{ float: "left", fontSize: "3.2em", lineHeight: 0.8, marginRight: "0.08em", color: p.accentText }}>{s.body[0]}</span>{s.body.slice(1)}</p>
            <p className={css.dk}>{s.itemMeta.join(". ")}. By Staff Writer.</p>
          </div>
        </div>
        <figure>
          <div className={css.img} style={{ aspectRatio: "3 / 4" }}><WindowLight a={p.text} b={p.surface} c={p.accent} d={p.bg} /></div>
          <figcaption className={css.muted} style={{ fontSize: "0.68em", marginTop: "0.5em", fontStyle: "italic" }}>{s.items[0]}, photographed for this issue.</figcaption>
        </figure>
      </div>
    </div>
  );
}

function Luxury({ s, p }: C) {
  return (
    <div className={css.g2} style={{ height: "100%", gridTemplateColumns: "0.9fr 1.1fr" }}>
      <div className={css.img} style={{ minHeight: "18em" }}><Portrait a={p.text} b={p.surface} c={p.muted} d={p.bg} /></div>
      <div style={{ padding: "2em 2.6em", display: "flex", flexDirection: "column" }}>
        <div className={css.row} style={{ fontSize: "0.66em", letterSpacing: "0.3em", textTransform: "uppercase" }}>
          <span>{s.brand}</span><span className={css.dk}>Menu</span><span className={css.burger} />
        </div>
        <div style={{ margin: "auto 0" }}>
          <p style={{ fontSize: "0.66em", letterSpacing: "0.34em", textTransform: "uppercase" }} className={css.muted}>{s.role}</p>
          <p className={css.hd} style={{ fontSize: "3.3em", fontWeight: 400, lineHeight: 1, marginTop: "0.4em", letterSpacing: "-0.01em" }}>
            {s.short}<br /><em style={{ fontStyle: "italic" }}>{s.year}</em>
          </p>
          <div style={{ width: "4em", borderTop: `1px solid ${p.text}`, margin: "1.4em 0" }} />
          <p style={{ fontSize: "0.82em", maxWidth: "22em" }} className={css.muted}>{s.deck}</p>
          <p style={{ fontSize: "0.66em", letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "1.6em", borderBottom: `1px solid ${p.text}`, display: "inline-block", paddingBottom: "0.3em" }}>{s.cta}</p>
        </div>
        <div className={css.row} style={{ fontSize: "0.66em", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          <span className={css.muted}>{s.section}</span><span>01 / 03</span>
        </div>
      </div>
    </div>
  );
}

function Cinematic({ s, p }: C) {
  return (
    <div style={{ height: "100%", position: "relative", background: "#000" }}>
      <div className={css.img} style={{ position: "absolute", inset: "11% 0 11% 0" }}>
        <FilmFrame a={p.bg} b={p.surface} c={p.accent} d={p.text} />
      </div>
      <div className={css.row} style={{ position: "absolute", top: "1.2em", left: "2em", right: "2em", color: "#fff", fontSize: "0.72em", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        <span>{s.brand}</span><span className={cx(css.nav, css.dk)} style={{ gap: "2em" }}>{s.nav.map((n) => <span key={n}>{n}</span>)}</span><span className={css.burger} />
      </div>
      <div style={{ position: "absolute", inset: "11% 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: p.text, textAlign: "center", padding: "0 2em" }}>
        <p style={{ fontSize: "0.72em", letterSpacing: "0.4em", textTransform: "uppercase" }}>{s.role}</p>
        <p className={css.hd} style={{ fontSize: "5em", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 0.95, marginTop: "0.15em" }}>{s.short}</p>
        <p style={{ marginTop: "1.2em", display: "flex", alignItems: "center", gap: "0.7em", fontSize: "0.85em" }}>
          <span style={{ width: "2.2em", height: "2.2em", borderRadius: "50%", border: `1.5px solid ${p.text}`, display: "inline-grid", placeItems: "center" }}>▶</span>{s.cta}
        </p>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "0.9em", display: "flex", justifyContent: "center", gap: "2.4em", color: "#bbb", fontSize: "0.62em", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        {s.itemMeta.map((m, i) => <span key={m} className={i ? css.dk : undefined}>{m}</span>)}
      </div>
    </div>
  );
}

function Romantic({ s, p }: C) {
  return (
    <div style={{ padding: "1.8em 3em", height: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: "0.7em", letterSpacing: "0.3em", textTransform: "uppercase", display: "flex", gap: "2.4em" }} className={css.muted}>
        <span className={css.dk}>{s.nav[0]}</span><span className={css.hd} style={{ fontSize: "1.9em", letterSpacing: "0.02em", textTransform: "none", fontStyle: "italic", color: p.text }}>{s.brand}</span><span className={css.dk}>{s.nav[2]}</span>
      </div>
      <div style={{ width: "100%", borderTop: `1px solid ${p.border}`, margin: "1em 0 2em" }} />
      <div className={css.g2} style={{ gridTemplateColumns: "1fr 1.2fr", gap: "3em", alignItems: "center", width: "100%", textAlign: "left" }}>
        <div className={css.img} style={{ aspectRatio: "3 / 4", borderRadius: "50% 50% 0 0 / 30% 30% 0 0" }}>
          <Organic a={p.surface} b={p.accent} c={p.muted} d={p.bg} />
        </div>
        <div>
          <p className={css.hd} style={{ fontStyle: "italic", color: p.accentText }}>— {s.role} —</p>
          <p className={css.hd} style={{ fontSize: "2.8em", fontWeight: 400, lineHeight: 1.08, marginTop: "0.3em" }}>
            {s.headline.split(" ").slice(0, 3).join(" ")} <em>{s.headline.split(" ").slice(3).join(" ")}</em>
          </p>
          <p className={css.muted} style={{ marginTop: "1em", fontSize: "0.85em", maxWidth: "24em" }}>{s.deck}</p>
          <p style={{ marginTop: "1.4em", fontSize: "0.75em", letterSpacing: "0.2em", textTransform: "uppercase" }}>{s.cta} <span style={{ color: p.accentText }}>✦</span></p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Bold */

function Brutalist({ s }: C) {
  const line = "1px solid #000";
  return (
    <div style={{ fontFamily: "var(--hd)", background: "#fff", color: "#000", height: "100%", fontSize: "0.9em" }}>
      <div style={{ display: "flex", borderBottom: line }}>
        <span style={{ padding: "0.6em 0.8em", borderRight: line, fontWeight: 700 }}>{s.brand.toUpperCase()}</span>
        {s.nav.map((n) => <span key={n} className={css.dk} style={{ padding: "0.6em 0.8em", borderRight: line, color: "#0000EE", textDecoration: "underline" }}>{n}</span>)}
        <span style={{ marginLeft: "auto", padding: "0.6em 0.8em" }}>{s.year}</span>
      </div>
      <p style={{ fontSize: "3.4em", fontWeight: 500, lineHeight: 1, padding: "0.35em 0.25em", borderBottom: line, letterSpacing: "-0.03em" }}>{s.headline}</p>
      <div className={css.g2} style={{ gridTemplateColumns: "1fr 1fr" }}>
        <p style={{ padding: "0.8em", borderRight: line }}>{s.body}</p>
        <div>
          {s.items.map((it, i) => (
            <p key={it} style={{ padding: "0.45em 0.8em", borderBottom: line, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#0000EE", textDecoration: "underline" }}>{it}</span><span>[{s.itemMeta[i].split(" ·")[0]}]</span>
            </p>
          ))}
          <p style={{ padding: "0.45em 0.8em" }}>→ {s.cta.toUpperCase()}</p>
        </div>
      </div>
      <div style={{ borderTop: line, display: "grid", gridTemplateColumns: "auto 1fr", fontSize: "0.85em" }}>
        <span style={{ padding: "0.5em 0.8em", borderRight: line, fontWeight: 700 }}>INDEX</span>
        <span style={{ padding: "0.5em 0.8em" }}>{s.section.toUpperCase()} / {s.items.length} ENTRIES / LAST UPDATED {s.year}-09-30</span>
      </div>
      <p style={{ borderTop: line, fontSize: "4.6em", fontWeight: 700, lineHeight: 0.9, padding: "0.1em 0.12em", letterSpacing: "-0.04em" }}>{s.brand.toUpperCase()}</p>
    </div>
  );
}

function Neobrutalist({ s, p }: C) {
  return (
    <div style={{ padding: "1.6em 2em", height: "100%", background: p.surface }}>
      <div className={cx(css.row, css.nb)} style={{ background: p.bg, padding: "0.6em 1em", borderRadius: "0.5em", fontWeight: 700 }}>
        <span className={css.hd}>{s.brand}</span>
        <Nav s={s} style={{ fontSize: "0.85em" }} /><span className={css.burger} />
      </div>
      <div className={css.g2} style={{ gridTemplateColumns: "1.3fr 1fr", gap: "1.6em", marginTop: "1.8em" }}>
        <div>
          <p className={css.hd} style={{ fontSize: "3.3em", lineHeight: 0.98, letterSpacing: "-0.02em" }}>{s.headline}</p>
          <p style={{ marginTop: "1em", fontSize: "0.9em", maxWidth: "24em" }}>{s.deck}</p>
          <span className={cx(css.btn, css.nb)} style={{ marginTop: "1.4em", borderRadius: "0.5em" }}>{s.cta} →</span>
        </div>
        <div style={{ position: "relative" }}>
          <div className={cx(css.img, css.nb)} style={{ aspectRatio: "1", borderRadius: "0.8em", background: p.bg }}>
            <Geometry a={p.bg} b={p.accent} c={p.surface} d={p.text} />
          </div>
          <span className={css.nb} style={{ position: "absolute", top: "-0.8em", right: "-0.6em", background: p.accent, color: p.buttonText, padding: "0.4em 0.8em", fontWeight: 800, fontSize: "0.8em", transform: "rotate(6deg)", borderRadius: "0.4em" }}>NEW</span>
        </div>
      </div>
      <div className={css.g3} style={{ gap: "1em", marginTop: "1.8em" }}>
        {s.items.map((it, i) => (
          <div key={it} className={cx(css.nb, i > 0 && css.dk)} style={{ background: p.bg, padding: "0.6em 0.8em", borderRadius: "0.5em", fontSize: "0.8em", fontWeight: 700 }}>{it}</div>
        ))}
      </div>
    </div>
  );
}

function Bauhaus({ s, p }: C) {
  return (
    <div className={css.g2} style={{ height: "100%", gridTemplateColumns: "1fr 1fr" }}>
      <div className={css.img} style={{ minHeight: "14em" }}><Geometry a={p.bg} b={"#C8352A"} c={p.surface} d={p.text} /></div>
      <div style={{ padding: "2em 2.2em", display: "flex", flexDirection: "column", borderLeft: `0.6em solid ${p.text}` }}>
        <div className={css.row} style={{ fontSize: "0.8em", fontWeight: 700 }}><span>{s.brand}</span><Nav s={s} /><span className={css.burger} /></div>
        <p className={css.hd} style={{ fontSize: "3.6em", fontWeight: 800, lineHeight: 0.92, marginTop: "auto", letterSpacing: "-0.03em" }}>
          {s.short.split(" ").map((w, i) => <span key={i} style={{ display: "block", color: i === 1 ? p.accentText : undefined }}>{w}</span>)}
        </p>
        <p style={{ marginTop: "1em", fontSize: "0.85em" }}>{s.deck}</p>
        <div style={{ display: "flex", gap: "0.6em", marginTop: "1.4em", alignItems: "center" }}>
          <span style={{ width: "1.4em", height: "1.4em", borderRadius: "50%", background: "#C8352A" }} />
          <span style={{ width: "1.4em", height: "1.4em", background: p.surface }} />
          <span style={{ width: 0, height: 0, borderLeft: "0.8em solid transparent", borderRight: "0.8em solid transparent", borderBottom: `1.4em solid ${p.accent}` }} />
          <span style={{ fontWeight: 700, fontSize: "0.85em", marginLeft: "0.6em" }}>{s.cta}</span>
        </div>
      </div>
    </div>
  );
}

function Maximalist({ s, p }: C) {
  return (
    <div style={{ height: "100%", position: "relative", background: p.bg }}>
      <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(90deg, ${p.surface} 0 2em, transparent 2em 4em)`, opacity: 0.55 }} />
      <div className={css.row} style={{ position: "relative", padding: "1.2em 2em", fontWeight: 700, fontSize: "0.85em" }}>
        <span className={css.hd}>{s.brand}</span><Nav s={s} /><span className={css.burger} />
      </div>
      <div className={css.g2} style={{ position: "relative", gridTemplateColumns: "1.1fr 1fr", gap: "0", padding: "0 2em" }}>
        <div className={css.img} style={{ aspectRatio: "4 / 5", border: `0.3em solid ${p.text}` }}><Collage a={p.accent} b={p.surface} c={p.text} d={p.bg} /></div>
        <div style={{ background: p.text, color: p.bg, padding: "1.6em", position: "relative" }}>
          <p className={css.cap} style={{ color: p.surface }}>{s.role}</p>
          <p className={css.hd} style={{ fontSize: "3.4em", lineHeight: 0.9, marginTop: "0.3em", marginLeft: "-1.6em", color: p.bg, textShadow: `0.06em 0.06em 0 ${p.accent}` }}>{s.headline}</p>
          <p style={{ marginTop: "1em", fontSize: "0.8em" }}>{s.deck}</p>
          <span className={css.btn} style={{ marginTop: "1em", background: p.surface, color: p.text }}>{s.cta} ✺</span>
        </div>
      </div>
      <div className={cx(css.row, css.dk)} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: p.accent, color: p.buttonText, padding: "0.5em 2em", fontWeight: 800, fontSize: "0.8em", whiteSpace: "nowrap", overflow: "hidden" }}>
        {[...s.items, ...s.items].map((it, i) => <span key={i}>{it} ✺</span>)}
      </div>
    </div>
  );
}

function Experimental({ s, p }: C) {
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <div className={css.row} style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "0.8em 1.6em", borderBottom: `1px solid ${p.border}`, fontSize: "0.8em", zIndex: 2, background: p.bg }}>
        <span style={{ fontWeight: 700 }}>{s.brand}</span><Nav s={s} /><span className={css.burger} />
      </div>
      <p className={css.hd} style={{ position: "absolute", left: "-0.1em", top: "1.7em", fontSize: "7.4em", lineHeight: 0.8, fontWeight: 800, color: p.accent, writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "-0.04em" }} aria-hidden="true">{s.short.split(" ")[0]}</p>
      <div style={{ position: "absolute", right: "8%", top: "22%", width: "15em", height: "15em", borderRadius: "50%", border: `1px solid ${p.text}` }} className={css.dk} />
      <div style={{ position: "absolute", right: "18%", top: "38%", width: "8em", height: "8em", borderRadius: "50%", background: p.accent, mixBlendMode: "difference" }} className={css.dk} />
      <div style={{ position: "absolute", left: "36%", right: "6%", top: "30%" }}>
        <p className={css.hd} style={{ fontSize: "2.4em", lineHeight: 1.05, fontWeight: 700, transform: "skewY(-4deg)" }}>{s.headline}</p>
        <p style={{ marginTop: "1.4em", fontSize: "0.85em", maxWidth: "20em" }}>{s.deck}</p>
        <p style={{ marginTop: "1em", fontSize: "0.8em" }}><span className={css.link}>{s.cta}</span> ↗</p>
      </div>
      <p style={{ position: "absolute", right: "1.6em", bottom: "1em", fontSize: "0.7em", fontFamily: "var(--hd)" }} className={css.muted}>{s.section} (3)</p>
    </div>
  );
}

/* ---------------------------------------------------------------- Textured */

function Organic_({ s, p }: C) {
  return (
    <div className={css.grain} style={{ height: "100%", padding: "1.8em 2.4em", position: "relative" }}>
      <div className={css.row} style={{ fontSize: "0.85em" }}>
        <span className={css.hd} style={{ fontSize: "1.3em", fontWeight: 600 }}>{s.brand}</span><Nav s={s} /><span className={css.burger} />
      </div>
      <div className={css.g2} style={{ gridTemplateColumns: "1fr 1fr", gap: "2.6em", alignItems: "center", marginTop: "2em" }}>
        <div>
          <p className={css.hd} style={{ fontSize: "2.9em", lineHeight: 1.05, fontWeight: 600 }}>{s.headline}</p>
          <p className={css.muted} style={{ marginTop: "1em", fontSize: "0.9em" }}>{s.deck}</p>
          <span className={css.btn} style={{ marginTop: "1.4em", borderRadius: "3em", padding: "0.8em 1.5em" }}>{s.cta}</span>
        </div>
        <div className={css.img} style={{ aspectRatio: "1", borderRadius: "46% 54% 42% 58% / 55% 45% 55% 45%" }}>
          <Organic a={p.surface} b={p.accent} c={p.muted} d={p.bg} />
        </div>
      </div>
      <div className={cx(css.row, css.dk)} style={{ position: "absolute", left: "2.4em", right: "2.4em", bottom: "1.6em", fontSize: "0.8em" }}>
        {s.items.map((it) => <span key={it} style={{ background: p.surface, padding: "0.4em 1em", borderRadius: "2em" }}>{it}</span>)}
      </div>
    </div>
  );
}

function Grunge({ s, p }: C) {
  return (
    <div style={{ height: "100%", position: "relative", background: p.bg }}>
      <div className={css.img} style={{ position: "absolute", inset: 0 }}><Poster a={p.bg} b={p.surface} c={p.accent} /></div>
      <div className={css.row} style={{ position: "relative", padding: "1em 1.6em", fontSize: "0.8em", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        <span style={{ fontWeight: 700 }}>{s.brand}</span><Nav s={s} /><span className={css.burger} />
      </div>
      <div style={{ position: "relative", padding: "1em 1.6em" }}>
        <p className={css.hd} style={{ fontSize: "6em", lineHeight: 0.85, textTransform: "uppercase", transform: "rotate(-3deg)", transformOrigin: "left", maxWidth: "7em" }}>{s.short}</p>
        <span style={{ display: "inline-block", marginTop: "1.4em", background: p.accent, color: p.buttonText, padding: "0.25em 0.6em", transform: "rotate(-1.5deg)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.9em" }}>{s.cta} ↓</span>
        <p style={{ marginTop: "1.2em", maxWidth: "22em", fontSize: "0.85em" }}>{s.deck}</p>
      </div>
      <span className={css.dk} style={{ position: "absolute", right: "2em", bottom: "2em", border: `0.2em solid ${p.accent}`, color: p.accentText, padding: "0.4em 0.8em", transform: "rotate(-12deg)", fontWeight: 800, textTransform: "uppercase", fontSize: "0.9em", letterSpacing: "0.1em" }}>{s.section}</span>
    </div>
  );
}

function CollageStyle({ s, p }: C) {
  return (
    <div className={css.grain} style={{ height: "100%", position: "relative", padding: "1.4em 2em" }}>
      <div className={css.row} style={{ fontSize: "0.8em", fontFamily: "var(--bf)" }}><span style={{ fontWeight: 700 }}>{s.brand}</span><Nav s={s} /><span className={css.burger} /></div>
      <div className={css.img} style={{ position: "absolute", left: "8%", top: "20%", width: "44%", aspectRatio: "4 / 3", transform: "rotate(-3deg)", boxShadow: "0.3em 0.4em 0 rgba(0,0,0,.12)" }}>
        <Collage a={p.surface} b={p.accent} c={p.text} d={p.bg} />
      </div>
      <div style={{ position: "absolute", left: "56%", top: "22%", right: "6%", background: p.bg, padding: "1em", transform: "rotate(2deg)", boxShadow: "0.2em 0.3em 0 rgba(0,0,0,.1)" }}>
        <p className={css.hd} style={{ fontSize: "2.7em", lineHeight: 1, fontWeight: 700 }}>{s.short}</p>
        <p style={{ fontSize: "0.8em", marginTop: "0.6em" }}>{s.deck}</p>
      </div>
      <span className={css.hd} style={{ position: "absolute", left: "12%", bottom: "12%", fontSize: "1.5em", color: p.accentText, transform: "rotate(-4deg)" }}>↖ {s.cta.toLowerCase()}!</span>
      <span style={{ position: "absolute", right: "10%", bottom: "12%", background: p.surface, padding: "0.4em 0.8em", fontSize: "0.75em", transform: "rotate(-2deg)", fontFamily: "monospace" }}>{s.section.toUpperCase()}</span>
      <span style={{ position: "absolute", left: "52%", top: "18%", width: "4em", height: "1.1em", background: p.surface, opacity: 0.8, transform: "rotate(-20deg)" }} />
    </div>
  );
}

/* ---------------------------------------------------------------- Playful */

function Retro({ s, p }: C) {
  const arcs = [p.accent, "#D9822B", "#E8B04A", p.surface];
  return (
    <div style={{ height: "100%", position: "relative", padding: "1.6em 2.4em", overflow: "hidden" }}>
      <svg className={css.dk} viewBox="0 0 200 100" style={{ position: "absolute", right: "-4em", bottom: "-1em", width: "30em" }} aria-hidden="true">
        {arcs.map((c, i) => <path key={i} d={`M${20 + i * 14} 100 A${80 - i * 14} ${80 - i * 14} 0 0 1 ${180 - i * 14} 100`} stroke={c} strokeWidth="13" fill="none" />)}
      </svg>
      <div className={css.row} style={{ position: "relative", fontSize: "0.85em" }}>
        <span className={css.hd} style={{ fontWeight: 800, fontSize: "1.3em" }}>{s.brand}</span><Nav s={s} /><span className={css.burger} />
      </div>
      <div style={{ position: "relative", maxWidth: "30em", marginTop: "2.4em" }}>
        <span style={{ display: "inline-block", background: p.text, color: p.bg, borderRadius: "2em", padding: "0.3em 0.9em", fontSize: "0.75em", fontWeight: 700 }}>✿ {s.role}</span>
        <p className={css.hd} style={{ fontSize: "3.4em", lineHeight: 0.98, fontWeight: 800, marginTop: "0.4em", letterSpacing: "-0.02em" }}>{s.headline}</p>
        <span className={css.btn} style={{ marginTop: "1.2em", borderRadius: "2em" }}>{s.cta}</span>
      </div>
    </div>
  );
}

function Y2K({ s, p }: C) {
  return (
    <div style={{ height: "100%", padding: "1.4em 2em", background: `linear-gradient(160deg, ${p.bg}, ${p.surface})` }}>
      <div style={{ border: `2px solid ${p.text}`, borderRadius: "0.6em", overflow: "hidden", background: p.bg, height: "100%", display: "flex", flexDirection: "column" }}>
        <div className={css.row} style={{ background: `linear-gradient(${p.surface}, ${p.bg})`, borderBottom: `2px solid ${p.text}`, padding: "0.4em 0.8em", fontFamily: "var(--hd)", fontSize: "0.75em" }}>
          <span>★ {s.brand.toLowerCase().replace(/\s/g, "_")}.exe</span>
          <span style={{ display: "flex", gap: "0.4em" }}>{["_", "□", "×"].map((b) => <span key={b} style={{ border: `1.5px solid ${p.text}`, width: "1.3em", textAlign: "center", borderRadius: "0.2em", background: p.bg }}>{b}</span>)}</span>
        </div>
        <div className={css.g2} style={{ gridTemplateColumns: "1fr 1fr", flex: 1, alignItems: "center", padding: "1em 1.6em", gap: "1.6em" }}>
          <div>
            <p className={css.hd} style={{ fontSize: "2.5em", lineHeight: 1, fontWeight: 700 }}>{s.headline}</p>
            <span style={{ display: "inline-block", marginTop: "1.2em", padding: "0.6em 1.4em", borderRadius: "2em", border: `2px solid ${p.text}`, background: `linear-gradient(${p.bg}, ${p.accent})`, fontWeight: 700, fontSize: "0.85em", boxShadow: `inset 0 0.2em 0 rgba(255,255,255,.7)` }}>{s.cta} ✦</span>
          </div>
          <div className={css.img} style={{ aspectRatio: "1" }}><Pixels a={p.bg} b={p.text} c={p.surface} d="#ffffff" /></div>
        </div>
        <div style={{ borderTop: `2px solid ${p.text}`, background: p.accent, color: p.buttonText, fontFamily: "var(--hd)", fontSize: "0.75em", padding: "0.3em 0.8em", whiteSpace: "nowrap", overflow: "hidden" }}>
          ✦ {s.section} ✦ {s.items.join(" ✦ ")} ✦
        </div>
      </div>
    </div>
  );
}

function Playful({ s, p }: C) {
  return (
    <div style={{ height: "100%", padding: "1.6em 2.2em", position: "relative" }}>
      <div className={css.row} style={{ fontSize: "0.85em", fontWeight: 700 }}>
        <span className={css.hd} style={{ fontSize: "1.3em" }}>{s.brand} ☺</span><Nav s={s} /><span className={css.burger} />
      </div>
      <div className={css.g2} style={{ gridTemplateColumns: "1.1fr 1fr", gap: "2em", alignItems: "center", marginTop: "1.6em" }}>
        <div>
          <p className={css.hd} style={{ fontSize: "3em", lineHeight: 1, fontWeight: 800 }}>{s.headline}</p>
          <p style={{ marginTop: "0.8em", fontSize: "0.9em" }}>{s.deck}</p>
          <span className={css.btn} style={{ marginTop: "1.2em", borderRadius: "1em", transform: "rotate(-2deg)" }}>{s.cta} ✌</span>
        </div>
        <div className={css.img} style={{ aspectRatio: "5 / 4", borderRadius: "1.6em", border: `3px solid ${p.text}` }}><Doodle a={p.surface} b={p.bg} c={p.accent} d={p.text} /></div>
      </div>
      <svg className={css.dk} viewBox="0 0 400 20" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: "3.4em", width: "100%", height: "1.2em" }} aria-hidden="true">
        <path d="M0 10 Q 10 0 20 10 T 40 10 T 60 10 T 80 10 T 100 10 T 120 10 T 140 10 T 160 10 T 180 10 T 200 10 T 220 10 T 240 10 T 260 10 T 280 10 T 300 10 T 320 10 T 340 10 T 360 10 T 380 10 T 400 10" stroke={p.accent} strokeWidth="3" fill="none" />
      </svg>
      <p className={css.dk} style={{ position: "absolute", left: "2.2em", bottom: "1.4em", fontWeight: 700, fontSize: "0.85em" }}>{s.section} →</p>
    </div>
  );
}

/* ---------------------------------------------------------------- Technical */

function Technical({ s, p }: C) {
  const mono = { fontFamily: "var(--hd)" };
  return (
    <div style={{ height: "100%", padding: "1.2em 1.8em", ...mono, fontSize: "0.9em" }}>
      <div className={css.row} style={{ borderBottom: `1px solid ${p.border}`, paddingBottom: "0.5em", fontSize: "0.8em" }}>
        <span>[{s.brand.toUpperCase()}]</span><span className={css.dk}>34.0522° N, 118.2437° W</span><span>V.{s.year}</span>
      </div>
      <div className={css.g2} style={{ gridTemplateColumns: "1.2fr 1fr", gap: "1.6em", marginTop: "1.2em" }}>
        <div>
          <p style={{ color: p.accentText, fontSize: "0.8em" }}>{"// 001 — "}{s.role.toUpperCase()}</p>
          <p style={{ fontFamily: "var(--bf)", fontSize: "2.5em", lineHeight: 1.02, fontWeight: 600, marginTop: "0.3em" }}>{s.headline}</p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1.2em", fontSize: "0.75em" }}>
            <tbody>
              {s.items.map((it, i) => (
                <tr key={it} style={{ borderTop: `1px solid ${p.border}` }}>
                  <td style={{ padding: "0.4em 0", color: p.muted }}>{String(i + 1).padStart(3, "0")}</td><td>{it}</td><td className={css.dk} style={{ textAlign: "right", color: p.muted }}>{s.itemMeta[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ position: "relative", border: `1px solid ${p.border}` }}>
          <div className={css.img} style={{ position: "absolute", inset: "0.8em" }}><FilmFrame a={p.bg} b={p.surface} c={p.accent} d={p.text} /></div>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, borderLeft: `1px dashed ${p.accent}` }} />
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: `1px dashed ${p.accent}` }} />
          <span style={{ position: "absolute", left: "0.4em", bottom: "0.3em", fontSize: "0.65em", background: p.bg, padding: "0 0.3em" }}>FIG. A — 2.39:1</span>
        </div>
      </div>
      <p style={{ marginTop: "1em", fontSize: "0.8em" }}><span style={{ background: p.accent, color: p.buttonText, padding: "0.2em 0.6em" }}>→ {s.cta.toUpperCase()}</span></p>
      <div className={css.g3} style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: "1.6em", borderTop: `1px solid ${p.border}`, fontSize: "0.72em" }}>
        {[["002", "Format", "2.39:1"], ["003", "Runtime", "14 min"], ["004", "Sound", "5.1 mix"], ["005", "Status", "Released"]].map(([n, k, v], i) => (
          <div key={n} className={i > 1 ? css.dk : undefined} style={{ padding: "0.7em 0.8em 0 0", borderRight: i < 3 ? `1px solid ${p.border}` : undefined, paddingLeft: i ? "0.8em" : 0 }}>
            <span style={{ color: p.muted }}>{n} / {k.toUpperCase()}</span><br /><span style={{ fontSize: "1.6em" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Product({ s, p }: C) {
  return (
    <div style={{ height: "100%", padding: "1.2em 2em", background: p.bg }}>
      <div className={css.row} style={{ fontSize: "0.85em" }}>
        <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5em" }}><span style={{ width: "1.2em", height: "1.2em", borderRadius: "0.35em", background: p.accent }} />{s.brand}</span>
        <Nav s={s} style={{ color: p.muted }} />
        <span className={cx(css.btn, css.dk)} style={{ borderRadius: "0.6em", padding: "0.5em 1em" }}>{s.cta}</span><span className={css.burger} />
      </div>
      <div style={{ textAlign: "center", marginTop: "2.2em" }}>
        <span style={{ display: "inline-block", border: `1px solid ${p.border}`, borderRadius: "2em", padding: "0.25em 0.8em", fontSize: "0.72em" }} className={css.muted}>● {s.role}</span>
        <p className={css.hd} style={{ fontSize: "2.8em", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: "0.4em", maxWidth: "15em", marginInline: "auto" }}>{s.headline}</p>
        <div style={{ display: "flex", gap: "0.6em", justifyContent: "center", marginTop: "1.2em" }} className={css.stack}>
          <span className={css.btn} style={{ borderRadius: "0.6em" }}>{s.cta}</span>
          <span className={css.btn} style={{ borderRadius: "0.6em", background: p.surface, color: p.text }}>Learn more</span>
        </div>
      </div>
      <div className={css.g3} style={{ gap: "0.8em", marginTop: "2em" }}>
        {s.items.map((it, i) => (
          <div key={it} className={i ? css.dk : undefined} style={{ background: p.surface, borderRadius: "0.8em", padding: "0.6em", fontSize: "0.8em" }}>
            <div className={css.img} style={{ aspectRatio: "16 / 9", borderRadius: "0.5em", marginBottom: "0.6em" }}>
              {i === 0 ? <Dusk a={p.accent} b={p.surface} c={p.text} d={p.bg} /> : i === 1 ? <Geometry a={p.bg} b={p.accent} c={p.surface} d={p.text} /> : <Painting a={p.surface} b={p.accent} c={p.text} d={p.bg} />}
            </div>
            <strong>{it}</strong><br /><span className={css.muted}>{s.itemMeta[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPOSITIONS: Record<string, (c: C) => React.ReactNode> = {
  minimal: Minimal, swiss: Swiss, editorial: Editorial, luxury: Luxury, gallery: Gallery, cinematic: Cinematic,
  brutalist: Brutalist, neobrutalist: Neobrutalist, bauhaus: Bauhaus, organic: Organic_, romantic: Romantic, retro: Retro,
  y2k: Y2K, grunge: Grunge, collage: CollageStyle, maximalist: Maximalist, playful: Playful, technical: Technical,
  product: Product, experimental: Experimental,
};

export function StylePreview({ id, sample, variant = "card" }: { id: string; sample: Sample; variant?: Variant }) {
  const style = styleById(id);
  const Comp = COMPOSITIONS[id];
  if (!style || !Comp) return null;
  const pal = paletteById(style.palettes[0])!;
  const pair = pairingById(style.pairings[0])!;
  const vars = {
    "--bg": pal.bg, "--tx": pal.text, "--sf": pal.surface, "--ac": pal.accent, "--mu": pal.muted, "--bd": pal.border,
    "--bt": pal.buttonText, "--at": pal.accentText, "--hd": FONT[pair.heading], "--bf": FONT[pair.body],
  } as CSSProperties;
  const satoshi = pair.heading === "satoshi" || pair.body === "satoshi";
  return (
    <div className={css.sp} data-v={variant} style={vars} aria-hidden="true">
      {satoshi && <FontshareSatoshi />}
      <div className={css.page}><Comp s={sample} p={pal} /></div>
    </div>
  );
}
