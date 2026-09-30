import type { AnswerValue, Answers, FormDefinition } from "@/lib/forms/types";
import { describeDesignValue } from "@/content/design/describe";

// Stored values that aren't listed options (allowUnknown, yes_no_unsure questions).
const WORDS: Record<string, string> = { __unknown__: "I don't know", yes: "Yes", no: "No", unsure: "Not sure" };

export type AnswerRow = { id: string; label: string; value: string; items?: string[] };
export type AnswerSection = { id: string; title: string; rows: AnswerRow[] };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const prettyDate = (v: string) =>
  new Date(`${v}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Every answered question, grouped by form section, with option labels spelled out. */
export function answerSections(def: FormDefinition, a: Answers): AnswerSection[] {
  const out: AnswerSection[] = [];
  for (const section of def.sections) {
    const rows: AnswerRow[] = [];
    for (const q of section.questions) {
      const v: AnswerValue | undefined = a[q.id];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
      const options = "options" in q ? q.options : [];
      const labelOf = (x: string) =>
        describeDesignValue(q.id, x) ?? options.find((o) => o.value === x)?.label ?? WORDS[x] ?? (isoDate.test(x) ? prettyDate(x) : x);
      if (Array.isArray(v)) {
        const items = v.map((x) => (typeof x === "string" ? labelOf(x) : "url" in x ? `${x.url}${x.note ? ` (${x.note})` : ""}` : JSON.stringify(x)));
        rows.push({ id: q.id, label: q.label, value: items.join(", "), items });
      } else {
        rows.push({ id: q.id, label: q.label, value: typeof v === "string" ? labelOf(v) : String(v) });
      }
    }
    if (rows.length) out.push({ id: section.id, title: section.title, rows });
  }
  return out;
}

/** Every answered question as "Label: value", in form order. */
export function answerLines(def: FormDefinition, a: Answers): string[] {
  return answerSections(def, a).flatMap((s) => s.rows.map((r) => `${r.label}: ${r.value}`));
}
