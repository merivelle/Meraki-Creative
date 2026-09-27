import { UNKNOWN, type Answers, type FormDefinition, type Question } from "./types";
import { allQuestions } from "./engine";

/**
 * Convert a submitted HTML form into answers, so every form works without JavaScript.
 * Field naming conventions (used by the renderer):
 *   text-like / select / radio / date / number:  name="<id>"
 *   multiselect:                                  name="<id>" (repeated)
 *   url_list:                                     name="<id>" textarea, one link per line
 *   reference_list:                               name="<id>.<i>.url" / "<id>.<i>.note"
 *   repeatable_group:                             name="<id>.<i>.<fieldId>"
 *   "I don't know" checkbox:                      name="<id>__unknown" value="1"
 */
export function formDataToAnswers(def: FormDefinition, fd: FormData): Answers {
  const out: Answers = {};
  for (const q of allQuestions(def)) {
    if (fd.get(`${q.id}__unknown`) === "1" && q.allowUnknown) {
      out[q.id] = UNKNOWN;
      continue;
    }
    const v = readQuestion(q, fd);
    if (v !== undefined) out[q.id] = v;
  }
  return out;
}

function readQuestion(q: Question, fd: FormData): Answers[string] {
  switch (q.type) {
    case "note":
      return undefined;
    case "multiselect":
    case "preference_cards":
      return fd.getAll(q.id).map(String).filter(Boolean);
    case "url_list": {
      const raw = fd.get(q.id);
      return typeof raw === "string" ? raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : undefined;
    }
    case "reference_list":
      return readIndexed(fd, q.id, ["url", "note"]) as { url: string; note?: string }[];
    case "repeatable_group":
      return readIndexed(fd, q.id, q.fields.map((f) => f.id));
    default: {
      const raw = fd.get(q.id);
      return typeof raw === "string" ? raw : undefined;
    }
  }
}

function readIndexed(fd: FormData, id: string, fields: string[]): Record<string, unknown>[] {
  const rows = new Map<number, Record<string, unknown>>();
  for (const [key, val] of fd.entries()) {
    if (!key.startsWith(id + ".")) continue;
    const [, idx, field] = key.split(".");
    const i = Number(idx);
    if (!Number.isInteger(i) || i < 0 || i > 100 || !fields.includes(field)) continue;
    const row = rows.get(i) ?? {};
    row[field] = typeof val === "string" ? val : "";
    rows.set(i, row);
  }
  return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}
