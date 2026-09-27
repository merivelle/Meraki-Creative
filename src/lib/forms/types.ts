/**
 * Form definition DSL shared by the public inquiry and the client questionnaires.
 * A definition is plain JSON, so it can be stored as a versioned snapshot in
 * form_template_versions.schema and rendered/validated identically on client and server.
 */

/** Sentinel stored when a client picks "I don't know" on a question that allows it. */
export const UNKNOWN = "__unknown__";

export type Condition =
  | { source?: "answer" | "context"; key: string; op: "equals" | "notEquals"; value: string | number | boolean }
  | { source?: "answer" | "context"; key: string; op: "in" | "notIn"; value: string[] }
  | { source?: "answer" | "context"; key: string; op: "includes"; value: string }
  | { source?: "answer" | "context"; key: string; op: "answered" | "unanswered" }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export type Option = { value: string; label: string; hint?: string };

type Base = {
  id: string;
  label: string;
  help?: string;
  required?: boolean;
  /** Adds an "I don't know" choice; counts as an answer for required questions. */
  allowUnknown?: boolean;
  showIf?: Condition;
  /** Free-form marker for admin review, e.g. 'additional_scope'. Shown to the studio only. */
  flag?: string;
  placeholder?: string;
};

export type Question =
  | (Base & { type: "text" | "textarea" | "email" | "url"; maxLength?: number })
  | (Base & { type: "url_list"; maxItems?: number })
  | (Base & { type: "reference_list"; maxItems?: number; noteLabel?: string })
  | (Base & { type: "select" | "radio"; options: Option[] })
  | (Base & { type: "multiselect"; options: Option[]; maxItems?: number })
  | (Base & { type: "yes_no_unsure" })
  | (Base & { type: "date" })
  | (Base & { type: "number"; min?: number; max?: number })
  | (Base & { type: "repeatable_group"; fields: Question[]; maxItems?: number; itemLabel?: string })
  /** Reserved for future visual preference cards. Renders a "not available yet" state. */
  | (Base & { type: "preference_cards"; cardSetKey: string })
  /** Static text between questions. Holds no answer. */
  | (Base & { type: "note" });

export type Section = {
  id: string;
  title: string;
  intro?: string;
  showIf?: Condition;
  questions: Question[];
};

export type FormDefinition = {
  key: string;
  version: number;
  title: string;
  intro?: string;
  sections: Section[];
};

export type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | { url: string; note?: string }[]
  | Record<string, unknown>[]
  | null;

export type Answers = Record<string, AnswerValue | undefined>;
export type FormContext = Record<string, string | string[] | undefined>;

export type ValidationMode = "draft" | "submit";

export type ValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  /** Submit mode: only visible, known questions. Draft mode: all known questions. */
  cleaned: Answers;
};
