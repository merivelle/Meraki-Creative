import type { AnswerValue, Answers, FormDefinition } from "@/lib/forms/types";

// Stored values that aren't listed options (allowUnknown, yes_no_unsure questions).
const WORDS: Record<string, string> = { __unknown__: "I don't know", yes: "Yes", no: "No", unsure: "Not sure" };

/** Every answered question as "Label: value", in form order, with option labels spelled out. */
export function answerLines(def: FormDefinition, a: Answers): string[] {
  const lines: string[] = [];
  const show = (v: AnswerValue | undefined, labelOf: (x: string) => string): string => {
    if (v === undefined || v === null || v === "") return "";
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === "string" ? labelOf(x) : "url" in x ? `${x.url}${x.note ? ` (${x.note})` : ""}` : JSON.stringify(x))).join(", ");
    }
    return typeof v === "string" ? labelOf(v) : String(v);
  };
  for (const section of def.sections) {
    for (const q of section.questions) {
      const options = "options" in q ? q.options : [];
      const text = show(a[q.id], (x) => options.find((o) => o.value === x)?.label ?? WORDS[x] ?? x);
      if (text) lines.push(`${q.label}: ${text}`);
    }
  }
  return lines;
}
