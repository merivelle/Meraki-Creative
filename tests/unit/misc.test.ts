import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { legacyRedirects } from "@/lib/redirects";
import { seedPackages } from "@/content/seed";
import { ADDON_GROUPS, ADDONS, WEB_SERVICES } from "@/content/web-design";
import { parseTimecode, formatTimecode } from "@/lib/timecode";
import { preselect } from "@/lib/inquiry/definition";
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
  // Website packages were repriced in Sep 2026 (introductory starting prices), so only the
  // other packages still carry the legacy prices verbatim.
  it("match legacy/packages.html exactly (non-web packages)", () => {
    const html = readFileSync("legacy/packages.html", "utf8");
    for (const p of seedPackages.filter((x) => x.categoryId !== "web-design")) {
      const block = html.split(`id="${p.slug}"`)[1]?.split("</article>")[0];
      expect(block, `anchor #${p.slug} exists in legacy page`).toBeDefined();
      expect(block).toContain(`<h3>${p.name}</h3>`);
      expect(block).toContain(`<p class="price"><b>${p.priceDisplay}</b></p>`);
    }
    expect(seedPackages).toHaveLength(15); // 9 legacy (post + bundles) + 6 website packages
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
    expect(preselect(seedPackages, { package: "Demo Reel Refresh" })).toEqual({ package: "reel-refresh", services: ["post-production"] });
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
  it("bundles preselect the package but no single service", () => {
    expect(preselect(seedPackages, { package: "acting-package" })).toEqual({ package: "acting-package" });
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
