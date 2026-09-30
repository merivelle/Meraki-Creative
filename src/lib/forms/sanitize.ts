import { allQuestions } from "./engine";
import { UNKNOWN, type Answers, type FormDefinition } from "./types";

/**
 * Remove choice answers that are no longer offered (a draft saved before the options changed,
 * or a retired option). Keeps everything else untouched, so older drafts and submissions never
 * fail validation because of a choice that has since been renamed or removed.
 */
export function dropUnknownChoices(def: FormDefinition, answers: Answers): Answers {
  const out: Answers = { ...answers };
  for (const q of allQuestions(def)) {
    const v = out[q.id];
    if (v === undefined || v === UNKNOWN) continue;
    let allowed: string[] | null = null;
    if (q.type === "select" || q.type === "radio" || q.type === "multiselect") allowed = q.options.map((o) => o.value);
    else if (q.type === "yes_no_unsure") allowed = ["yes", "no", "unsure"];
    if (!allowed) continue;
    if (Array.isArray(v)) {
      const kept = (v as unknown[]).filter((x) => typeof x === "string" && allowed!.includes(x)) as string[];
      if (kept.length) out[q.id] = kept;
      else delete out[q.id];
    } else if (typeof v === "string" && v !== "" && !allowed.includes(v)) {
      delete out[q.id];
    }
  }
  return out;
}
