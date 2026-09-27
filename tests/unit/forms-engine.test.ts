import { describe, expect, it } from "vitest";
import { evaluate, validate, validateDefinition, visibleQuestions } from "@/lib/forms/engine";
import { formDataToAnswers } from "@/lib/forms/formdata";
import { UNKNOWN, type FormDefinition } from "@/lib/forms/types";
import { websiteDiscovery } from "@/content/forms/website-discovery";
import { postProductionDiscovery } from "@/content/forms/post-production-discovery";

const def: FormDefinition = {
  key: "t",
  version: 1,
  title: "Test",
  sections: [
    {
      id: "a",
      title: "A",
      questions: [
        { id: "kind", type: "select", label: "Kind", required: true, options: [{ value: "web", label: "Web" }, { value: "edit", label: "Edit" }] },
        { id: "pages", type: "text", label: "Pages", required: true, showIf: { key: "kind", op: "equals", value: "web" } },
        { id: "runtime", type: "text", label: "Runtime", required: true, allowUnknown: true, showIf: { key: "kind", op: "equals", value: "edit" } },
        { id: "site", type: "url", label: "Site" },
      ],
    },
    {
      id: "actor",
      title: "Actor only",
      showIf: { source: "context", key: "clientType", op: "equals", value: "actor" },
      questions: [{ id: "headshots", type: "yes_no_unsure", label: "Headshots?", required: true }],
    },
  ],
};

describe("conditional visibility", () => {
  it("shows only questions whose conditions hold", () => {
    const ids = visibleQuestions(def, { kind: "web" }).map((q) => q.id);
    expect(ids).toEqual(["kind", "pages", "site"]);
  });

  it("uses context (client type) for section branching", () => {
    expect(visibleQuestions(def, { kind: "web" }, { clientType: "actor" }).map((q) => q.id)).toContain("headshots");
    expect(visibleQuestions(def, { kind: "web" }, { clientType: "director" }).map((q) => q.id)).not.toContain("headshots");
  });

  it("supports all / any / not", () => {
    expect(evaluate({ all: [{ key: "a", op: "equals", value: "1" }, { key: "b", op: "answered" }] }, { a: "1", b: "x" })).toBe(true);
    expect(evaluate({ any: [{ key: "a", op: "equals", value: "2" }, { key: "b", op: "unanswered" }] }, { a: "1" })).toBe(true);
    expect(evaluate({ not: { key: "list", op: "includes", value: "x" } }, { list: ["x"] })).toBe(false);
  });
});

describe("validate — submit mode", () => {
  it("requires only applicable questions", () => {
    const r = validate(def, { kind: "web", pages: "5" }, { clientType: "director" }, "submit");
    expect(r.ok).toBe(true);
  });

  it("flags a missing required question that applies", () => {
    const r = validate(def, { kind: "edit" }, {}, "submit");
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors)).toEqual(["runtime"]);
  });

  it("does not require a hidden required question", () => {
    // `pages` is required but hidden when kind=edit
    const r = validate(def, { kind: "edit", runtime: "90s" }, {}, "submit");
    expect(r.ok).toBe(true);
    expect(r.errors.pages).toBeUndefined();
  });

  it("strips answers to hidden questions", () => {
    const r = validate(def, { kind: "edit", runtime: "90s", pages: "left over" }, {}, "submit");
    expect(r.cleaned).toEqual({ kind: "edit", runtime: "90s" });
  });

  it("ignores invalid values on hidden questions", () => {
    const r = validate(def, { kind: "edit", runtime: "90s", pages: 42 as unknown as string }, {}, "submit");
    expect(r.ok).toBe(true);
  });

  it("accepts “I don't know” for a required question that allows it", () => {
    const r = validate(def, { kind: "edit", runtime: UNKNOWN }, {}, "submit");
    expect(r.ok).toBe(true);
    expect(r.cleaned.runtime).toBe(UNKNOWN);
  });

  it("enforces context-branched required questions", () => {
    const r = validate(def, { kind: "web", pages: "3" }, { clientType: "actor" }, "submit");
    expect(r.errors.headshots).toBeDefined();
  });

  it("normalizes and validates URLs", () => {
    expect(validate(def, { kind: "web", pages: "1", site: "example.com" }).cleaned.site).toBe("https://example.com");
    expect(validate(def, { kind: "web", pages: "1", site: "javascript:alert(1)" }).errors.site).toBeDefined();
  });

  it("rejects options that aren't in the list", () => {
    expect(validate(def, { kind: "hack" }).errors.kind).toBeDefined();
  });

  it("refuses answers that look like credentials", () => {
    const r = validate(def, { kind: "web", pages: "password: hunter2" });
    expect(r.errors.pages).toMatch(/password/i);
  });
});

describe("validate — draft mode", () => {
  it("does not require anything and keeps hidden answers", () => {
    const r = validate(def, { kind: "edit", pages: "kept for later" }, {}, "draft");
    expect(r.ok).toBe(true);
    expect(r.cleaned.pages).toBe("kept for later");
  });

  it("still rejects malformed values", () => {
    expect(validate(def, { site: "not a url at all" }, {}, "draft").ok).toBe(false);
  });
});

describe("formDataToAnswers", () => {
  it("reads multiselects, url lists, indexed rows and I-don't-know boxes", () => {
    const d: FormDefinition = {
      key: "f", version: 1, title: "F",
      sections: [{ id: "s", title: "S", questions: [
        { id: "m", type: "multiselect", label: "M", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
        { id: "links", type: "url_list", label: "L" },
        { id: "refs", type: "reference_list", label: "R" },
        { id: "rt", type: "text", label: "RT", allowUnknown: true },
      ] }],
    };
    const fd = new FormData();
    fd.append("m", "a"); fd.append("m", "b");
    fd.append("links", "a.com\nb.com");
    fd.append("refs.1.url", "x.com"); fd.append("refs.1.note", "nice"); fd.append("refs.0.url", "y.com");
    fd.append("rt", "ignored"); fd.append("rt__unknown", "1");
    expect(formDataToAnswers(d, fd)).toEqual({
      m: ["a", "b"],
      links: ["a.com", "b.com"],
      refs: [{ url: "y.com" }, { url: "x.com", note: "nice" }],
      rt: UNKNOWN,
    });
  });
});

describe("shipped questionnaires", () => {
  it.each([websiteDiscovery, postProductionDiscovery])("$key is a valid definition", (d) => {
    expect(validateDefinition(d)).toEqual([]);
  });

  it("never asks for passwords or keys", () => {
    for (const d of [websiteDiscovery, postProductionDiscovery]) {
      for (const s of d.sections) for (const q of s.questions) {
        expect(q.label.toLowerCase()).not.toMatch(/\b(password|api key|secret)\b/);
      }
    }
  });
});
