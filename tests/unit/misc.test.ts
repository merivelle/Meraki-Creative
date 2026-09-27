import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { legacyRedirects } from "@/lib/redirects";
import { seedPackages } from "@/content/seed";
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
  it("match legacy/packages.html exactly", () => {
    const html = readFileSync("legacy/packages.html", "utf8");
    for (const p of seedPackages) {
      const block = html.split(`id="${p.slug}"`)[1]?.split("</article>")[0];
      expect(block, `anchor #${p.slug} exists in legacy page`).toBeDefined();
      expect(block).toContain(`<h3>${p.name}</h3>`);
      expect(block).toContain(`<p class="price"><b>${p.priceDisplay}</b></p>`);
    }
    expect(seedPackages).toHaveLength(14);
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
