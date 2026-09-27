import {
  UNKNOWN,
  type AnswerValue,
  type Answers,
  type Condition,
  type FormContext,
  type FormDefinition,
  type Question,
  type Section,
  type ValidationMode,
  type ValidationResult,
} from "./types";

const LIMITS = { text: 500, textarea: 5000, url: 2048, listItems: 25 };

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------
export function evaluate(cond: Condition | undefined, answers: Answers, ctx: FormContext = {}): boolean {
  if (!cond) return true;
  if ("all" in cond) return cond.all.every((c) => evaluate(c, answers, ctx));
  if ("any" in cond) return cond.any.some((c) => evaluate(c, answers, ctx));
  if ("not" in cond) return !evaluate(cond.not, answers, ctx);

  const raw = cond.source === "context" ? ctx[cond.key] : answers[cond.key];
  switch (cond.op) {
    case "answered":
      return isAnswered(raw as AnswerValue);
    case "unanswered":
      return !isAnswered(raw as AnswerValue);
    case "equals":
      return raw === cond.value;
    case "notEquals":
      return raw !== cond.value;
    case "in":
      return Array.isArray(raw) ? raw.some((v) => cond.value.includes(String(v))) : cond.value.includes(String(raw));
    case "notIn":
      return Array.isArray(raw) ? !raw.some((v) => cond.value.includes(String(v))) : !cond.value.includes(String(raw));
    case "includes":
      return Array.isArray(raw) ? raw.map(String).includes(cond.value) : raw === cond.value;
  }
}

export function isAnswered(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------
export function visibleSections(def: FormDefinition, answers: Answers, ctx: FormContext = {}): Section[] {
  return def.sections
    .filter((s) => evaluate(s.showIf, answers, ctx))
    .map((s) => ({ ...s, questions: s.questions.filter((q) => evaluate(q.showIf, answers, ctx)) }));
}

export function visibleQuestions(def: FormDefinition, answers: Answers, ctx: FormContext = {}): Question[] {
  return visibleSections(def, answers, ctx).flatMap((s) => s.questions);
}

export function allQuestions(def: FormDefinition): Question[] {
  return def.sections.flatMap((s) => s.questions);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const SECRET_PATTERNS: RegExp[] = [
  /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(password|passwd|pwd|passcode)\s*[:=]\s*\S+/i,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bre_[A-Za-z0-9]{20,}/,
];

/** Rough check for pasted credentials. Clients are asked never to send them through forms. */
export function looksLikeSecret(s: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(s));
}

export const SECRET_MESSAGE =
  "This looks like a password or access key. Please don't share credentials in forms. We'll arrange access separately.";

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Accepts "example.com" by assuming https://. */
export function normalizeUrl(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
}

type Check = { value?: AnswerValue; error?: string };

function checkValue(q: Question, value: AnswerValue | undefined): Check {
  if (value === undefined || value === null) return { value: undefined };
  if (q.allowUnknown && value === UNKNOWN) return { value: UNKNOWN };

  switch (q.type) {
    case "note":
    case "preference_cards":
      // Preference cards are not built yet; accept a small list of card ids for forward compatibility.
      if (q.type === "preference_cards" && Array.isArray(value)) {
        return { value: value.map(String).slice(0, LIMITS.listItems) };
      }
      return { value: undefined };

    case "text":
    case "textarea":
    case "email":
    case "url": {
      if (typeof value !== "string") return { error: "Please enter text." };
      const v = value.trim();
      if (!v) return { value: undefined };
      const max = ("maxLength" in q && q.maxLength) || (q.type === "textarea" ? LIMITS.textarea : q.type === "url" ? LIMITS.url : LIMITS.text);
      if (v.length > max) return { error: `Please keep this under ${max} characters.` };
      if (looksLikeSecret(v)) return { error: SECRET_MESSAGE };
      if (q.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: "Please enter a valid email address." };
      if (q.type === "url") {
        const u = normalizeUrl(v);
        if (!isHttpUrl(u)) return { error: "Please enter a full link, like https://example.com." };
        return { value: u };
      }
      return { value: v };
    }

    case "url_list": {
      if (!Array.isArray(value)) return { error: "Please add links one per line." };
      const items = (value as unknown[]).map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
      const max = q.maxItems ?? LIMITS.listItems;
      if (items.length > max) return { error: `Please add at most ${max} links.` };
      const out: string[] = [];
      for (const it of items) {
        const u = normalizeUrl(it);
        if (u.length > LIMITS.url || !isHttpUrl(u)) return { error: `"${it.slice(0, 60)}" doesn't look like a link.` };
        if (looksLikeSecret(u)) return { error: SECRET_MESSAGE };
        out.push(u);
      }
      return { value: out.length ? out : undefined };
    }

    case "reference_list": {
      if (!Array.isArray(value)) return { error: "Please add references." };
      const max = q.maxItems ?? 10;
      const out: { url: string; note?: string }[] = [];
      for (const raw of value as unknown[]) {
        if (!raw || typeof raw !== "object") continue;
        const r = raw as { url?: unknown; note?: unknown };
        const url = typeof r.url === "string" ? r.url.trim() : "";
        const note = typeof r.note === "string" ? r.note.trim() : "";
        if (!url && !note) continue;
        if (!url) return { error: "Each reference needs a link." };
        const u = normalizeUrl(url);
        if (u.length > LIMITS.url || !isHttpUrl(u)) return { error: `"${url.slice(0, 60)}" doesn't look like a link.` };
        if (note.length > 2000) return { error: "Please keep each note under 2000 characters." };
        if (looksLikeSecret(note)) return { error: SECRET_MESSAGE };
        out.push(note ? { url: u, note } : { url: u });
      }
      if (out.length > max) return { error: `Please add at most ${max} references.` };
      return { value: out.length ? out : undefined };
    }

    case "select":
    case "radio": {
      if (typeof value !== "string") return { error: "Please choose an option." };
      if (!value) return { value: undefined };
      if (!q.options.some((o) => o.value === value)) return { error: "Please choose one of the options." };
      return { value };
    }

    case "multiselect": {
      if (!Array.isArray(value)) return { error: "Please choose options." };
      const vals = (value as unknown[]).map(String);
      if (vals.some((v) => !q.options.some((o) => o.value === v))) return { error: "Please choose from the options." };
      if (q.maxItems && vals.length > q.maxItems) return { error: `Please choose at most ${q.maxItems}.` };
      const unique = Array.from(new Set(vals));
      return { value: unique.length ? unique : undefined };
    }

    case "yes_no_unsure": {
      if (value === "yes" || value === "no" || value === "unsure") return { value };
      if (value === "") return { value: undefined };
      return { error: "Please choose yes, no, or not sure." };
    }

    case "date": {
      if (typeof value !== "string") return { error: "Please enter a date." };
      if (!value) return { value: undefined };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) return { error: "Please enter a valid date." };
      return { value };
    }

    case "number": {
      const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
      if (typeof value === "string" && !value.trim()) return { value: undefined };
      if (!Number.isFinite(n)) return { error: "Please enter a number." };
      if (q.min !== undefined && n < q.min) return { error: `Please enter ${q.min} or more.` };
      if (q.max !== undefined && n > q.max) return { error: `Please enter ${q.max} or less.` };
      return { value: n };
    }

    case "repeatable_group": {
      if (!Array.isArray(value)) return { error: "Please add entries." };
      const max = q.maxItems ?? LIMITS.listItems;
      const rows: Record<string, unknown>[] = [];
      for (const raw of value as unknown[]) {
        if (!raw || typeof raw !== "object") continue;
        const row: Record<string, unknown> = {};
        for (const f of q.fields) {
          const r = checkValue(f, (raw as Record<string, AnswerValue>)[f.id]);
          if (r.error) return { error: `${f.label}: ${r.error}` };
          if (r.value !== undefined) row[f.id] = r.value;
        }
        if (Object.keys(row).length) rows.push(row);
      }
      if (rows.length > max) return { error: `Please add at most ${max} entries.` };
      for (const row of rows) {
        for (const f of q.fields) {
          if (f.required && !isAnswered(row[f.id] as AnswerValue)) return { error: `Each entry needs "${f.label}".` };
        }
      }
      return { value: rows.length ? rows : undefined };
    }
  }
}

/**
 * Validate answers against a definition.
 * - draft: type/size checks only on whatever is present; hidden answers are kept so a
 *   client who toggles a choice back doesn't lose what they typed.
 * - submit: required checks apply ONLY to questions visible for these answers/context,
 *   and answers to hidden questions are stripped from the result.
 */
export function validate(
  def: FormDefinition,
  answers: Answers,
  ctx: FormContext = {},
  mode: ValidationMode = "submit",
): ValidationResult {
  const errors: Record<string, string> = {};
  const cleaned: Answers = {};

  // First pass: normalize every known question so visibility is evaluated on clean values.
  const normalized: Answers = {};
  for (const q of allQuestions(def)) {
    const r = checkValue(q, answers[q.id]);
    if (r.error) errors[q.id] = r.error;
    else if (r.value !== undefined) normalized[q.id] = r.value;
  }

  if (mode === "draft") {
    Object.assign(cleaned, normalized);
    return { ok: Object.keys(errors).length === 0, errors, cleaned };
  }

  const visible = visibleQuestions(def, normalized, ctx);
  const visibleIds = new Set(visible.map((q) => q.id));
  // Errors on hidden questions don't block a submission; their answers are dropped.
  for (const id of Object.keys(errors)) if (!visibleIds.has(id)) delete errors[id];

  for (const q of visible) {
    if (q.type === "note" || q.type === "preference_cards") continue;
    const v = normalized[q.id];
    if (q.required && !isAnswered(v) && !errors[q.id]) {
      errors[q.id] = q.allowUnknown ? "Please answer, or choose “I don’t know”." : "This one is required.";
    }
    if (v !== undefined) cleaned[q.id] = v;
  }
  return { ok: Object.keys(errors).length === 0, errors, cleaned };
}

/** Validates the definition itself (used by the admin form editor before saving a version). */
export function validateDefinition(def: unknown): string[] {
  const problems: string[] = [];
  const d = def as FormDefinition;
  if (!d || typeof d !== "object") return ["Definition must be an object."];
  if (!d.key || typeof d.key !== "string") problems.push("Missing key.");
  if (!d.title) problems.push("Missing title.");
  if (!Array.isArray(d.sections) || d.sections.length === 0) problems.push("Add at least one section.");
  const ids = new Set<string>();
  const types = new Set([
    "text", "textarea", "email", "url", "url_list", "reference_list", "select", "radio", "multiselect",
    "yes_no_unsure", "date", "number", "repeatable_group", "preference_cards", "note",
  ]);
  for (const s of d.sections ?? []) {
    if (!s.id || !s.title) problems.push("Every section needs an id and title.");
    for (const q of s.questions ?? []) {
      if (!q.id || !q.label) problems.push(`A question in "${s.title}" is missing an id or label.`);
      if (ids.has(q.id)) problems.push(`Duplicate question id "${q.id}".`);
      ids.add(q.id);
      if (!types.has(q.type)) problems.push(`Unknown question type "${q.type}" on "${q.id}".`);
      if ((q.type === "select" || q.type === "radio" || q.type === "multiselect") && !q.options?.length) {
        problems.push(`"${q.id}" needs options.`);
      }
    }
  }
  const refs = (c: Condition | undefined): void => {
    if (!c) return;
    if ("all" in c) return c.all.forEach(refs);
    if ("any" in c) return c.any.forEach(refs);
    if ("not" in c) return refs(c.not);
    if ((c.source ?? "answer") === "answer" && !ids.has(c.key)) problems.push(`Condition refers to unknown question "${c.key}".`);
  };
  for (const s of d.sections ?? []) {
    refs(s.showIf);
    for (const q of s.questions ?? []) refs(q.showIf);
  }
  return problems;
}
