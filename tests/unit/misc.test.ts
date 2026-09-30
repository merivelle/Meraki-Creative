import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { legacyRedirects } from "@/lib/redirects";
import { seedPackages } from "@/content/seed";
import { ADDON_GROUPS, ADDONS, WEB_SERVICES } from "@/content/web-design";
import { POST_SERVICES } from "@/content/post-production";
import { parseTimecode, formatTimecode } from "@/lib/timecode";
import { inquiryDefinition, preselect } from "@/lib/inquiry/definition";
import { answerLines, answerSections } from "@/lib/inquiry/summary";
import { inquiryStudioEmail } from "@/lib/email/inquiry-email";
import { checkFormToken, issueFormToken } from "@/lib/security/abuse";

describe("legacy redirects", () => {
  it("covers every page of the old static site", () => {
    const sources = legacyRedirects.map((r) => r.source);
    for (const page of ["index", "services", "packages", "portfolio", "about", "contact", "thanks", "website-design", "post-production"]) {
      expect(sources).toContain(`/${page}.html`);
    }
  });
});

describe("package prices", () => {
  // Website and editing packages were repriced in Sep 2026 (one starting price per service),
  // so only the (retired, admin-only) bundles still carry the legacy prices verbatim.
  it("match legacy/packages.html exactly (bundles)", () => {
    const html = readFileSync("legacy/packages.html", "utf8");
    for (const p of seedPackages.filter((x) => x.categoryId === "bundles")) {
      const block = html.split(`id="${p.slug}"`)[1]?.split("</article>")[0];
      expect(block, `anchor #${p.slug} exists in legacy page`).toBeDefined();
      expect(block).toContain(`<h3>${p.name}</h3>`);
      expect(block).toContain(`<p class="price"><b>${p.priceDisplay}</b></p>`);
    }
    expect(seedPackages).toHaveLength(14); // 6 editing + 6 website + 2 bundles
  });

  it("website packages come straight from the Web Design source", () => {
    const web = seedPackages.filter((p) => p.categoryId === "web-design");
    expect(web).toHaveLength(6);
    expect(web.map((p) => p.slug)).toEqual(WEB_SERVICES.map((s) => s.pkg));
    for (const p of web) {
      const svc = WEB_SERVICES.find((s) => s.pkg === p.slug)!;
      expect(p.priceDisplay).toBe(svc.price);
      expect(p.priceDisplay).toMatch(/^From \$[\d,]+$/);
      expect(p.label).not.toMatch(/most booked/i);
    }
  });

  it("editing packages come straight from the Post-Production source", () => {
    const post = seedPackages.filter((p) => p.categoryId === "post-production");
    expect(post.map((p) => p.slug)).toEqual(POST_SERVICES.map((s) => s.pkg));
    for (const p of post) {
      const svc = POST_SERVICES.find((s) => s.pkg === p.slug)!;
      expect(p.priceDisplay).toBe(svc.price);
      expect(p.priceDisplay).toMatch(/^(From \$[\d,]+( per clip)?|Quote on request)$/);
      expect(p.name).toBe(svc.pkgName);
    }
  });
});

describe("post-production services", () => {
  it.each(POST_SERVICES.map((s) => [s.name, s] as const))("%s has a complete, consistent entry", (_, s) => {
    expect(s.highlights.length).toBeGreaterThanOrEqual(4);
    expect(s.highlights.length).toBeLessThanOrEqual(5);
    expect(s.faqs.length).toBeGreaterThanOrEqual(3);
    expect(s.faqs.length).toBeLessThanOrEqual(4);
    expect(s.addonGroups.length).toBeGreaterThan(0);
    expect(existsSync(`public${s.art}`), s.art).toBe(true);
  });
  it("uses unique paths and package slugs", () => {
    expect(new Set(POST_SERVICES.map((s) => s.path)).size).toBe(POST_SERVICES.length);
    expect(new Set(POST_SERVICES.map((s) => s.pkg)).size).toBe(POST_SERVICES.length);
  });
  it("never offers color grading as a service, only as an add-on", () => {
    for (const s of POST_SERVICES) {
      expect(s.name.toLowerCase()).not.toContain("color");
      for (const sec of s.sections) for (const i of sec.items) expect(i.toLowerCase()).not.toContain("grade");
    }
  });
});

describe("web design services", () => {
  it.each(WEB_SERVICES.map((s) => [s.name, s] as const))("%s has a complete, consistent entry", (_, s) => {
    expect(s.highlights.length).toBeGreaterThanOrEqual(4);
    expect(s.highlights.length).toBeLessThanOrEqual(5);
    expect(s.faqs.length).toBeGreaterThanOrEqual(3);
    expect(s.faqs.length).toBeLessThanOrEqual(4);
    for (const k of s.addons) expect(ADDONS[k], `add-on ${k}`).toBeDefined();
    expect(existsSync(`public${s.art}`), s.art).toBe(true);
    for (const k of s.addons) expect(ADDON_GROUPS.some((g) => g.keys.includes(k)), `add-on ${k} is grouped`).toBe(true);
    expect(s.path).toMatch(/^[a-z-]+-websites$/);
  });

  it("uses unique paths and package slugs", () => {
    expect(new Set(WEB_SERVICES.map((s) => s.path)).size).toBe(WEB_SERVICES.length);
    expect(new Set(WEB_SERVICES.map((s) => s.pkg)).size).toBe(WEB_SERVICES.length);
  });
});

describe("timecodes", () => {
  it.each([
    ["45", 45000],
    ["1:05", 65000],
    ["01:02:03", 3723000],
    ["00:00:01:12", 1500],
    ["1:05.5", 65500],
  ])("parses %s", (input, ms) => expect(parseTimecode(input)).toBe(ms));

  it.each(["", "abc", "1:75", "00:00:01:30", "1::2"])("rejects %s", (input) => expect(parseTimecode(input)).toBeNull());

  it("formats back", () => {
    expect(formatTimecode(65000)).toBe("01:05");
    expect(formatTimecode(3723000)).toBe("1:02:03");
  });
});

describe("inquiry preselection", () => {
  it("accepts the original ?package=<name> links", () => {
    expect(preselect(seedPackages, { package: "Demo Reel Edit" })).toEqual({ package: "demo-reel", services: ["post-production"] });
    expect(preselect(seedPackages, { package: "Trailer Edit" })).toEqual({ package: "trailer", services: ["post-production"] });
  });
  it("accepts ?service=", () => {
    expect(preselect(seedPackages, { service: "web-design" })).toEqual({ services: ["web-design"] });
  });
  it("ignores unknown values", () => {
    expect(preselect(seedPackages, { service: "<script>", package: "nope" })).toEqual({});
  });
  it("retired deck and lookbook links preselect nothing", () => {
    expect(preselect(seedPackages, { service: "creative-materials" })).toEqual({});
    expect(preselect(seedPackages, { package: "Pitch Deck Package" })).toEqual({});
  });
  it("retired tiers and bundles preselect nothing on the public site", () => {
    const live = seedPackages.filter((p) => p.categoryId !== "bundles");
    expect(preselect(live, { package: "acting-package" })).toEqual({});
    expect(preselect(live, { package: "Demo Reel Refresh" })).toEqual({});
  });
});

describe("email-only inquiry summary", () => {
  it("spells out every answer with its question and option labels", () => {
    const def = inquiryDefinition(seedPackages);
    const lines = answerLines(def, { name: "Ada", email: "ada@example.test", services: ["post-production"], package: "demo-reel", description: "A reel from three scenes." });
    expect(lines.some((l) => l.endsWith(": Demo Reel Edit"))).toBe(true); // package slug shown by name
    expect(lines.some((l) => l.endsWith("A reel from three scenes."))).toBe(true);
    expect(lines.join("\n")).not.toContain("post-production"); // option value replaced by its label
    expect(lines.some((l) => l.includes("Ada"))).toBe(true);
  });
});

describe("studio inquiry email", () => {
  const def = inquiryDefinition(seedPackages);
  const e = inquiryStudioEmail({
    sections: answerSections(def, {
      name: "Ada <script>", email: "ada@example.test", client_type: "actor", services: ["post-production"],
      package: "demo-reel", goal: "A reel for reps", description: "Three scenes.", post_type: ["demo-reel"], budget: "500-1000",
    }),
  });
  it("groups the answers under their form sections", () => {
    expect(e.subject).toBe("New inquiry: Ada <script> · Post-production and editing");
    expect(e.text).toContain("( 01 ) EDITING SCOPE");
    expect(e.text).toContain("( 02 ) TIMING AND BUDGET");
    expect(e.text).toContain("Budget range: $500 to $1,000");
    expect(e.html).toContain("Demo Reel Edit");
  });
  it("escapes what visitors type", () => {
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("Ada &lt;script&gt;");
  });
});

describe("form timing token", () => {
  it("rejects instant submissions and tampering", () => {
    const now = Date.now();
    const t = issueFormToken(now);
    expect(checkFormToken(t, now + 500)).toBe("too_fast");
    expect(checkFormToken(t, now + 10_000)).toBe("ok");
    expect(checkFormToken(t.replace(/.$/, (c) => (c === "a" ? "b" : "a")), now + 10_000)).toBe("invalid");
    expect(checkFormToken(null)).toBe("invalid");
  });
});
