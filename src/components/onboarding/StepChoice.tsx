"use client";

import { ILLUSTRATIONS } from "@/lib/inquiry/steps";
import { UNKNOWN, type Option, type Question } from "@/lib/forms/types";

export const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type ChoiceQuestion = Extract<Question, { type: "select" | "radio" | "multiselect" | "yes_no_unsure" }>;

/** Options for a choice question, including yes/no/not sure and "I don't know" where allowed. */
export function choiceOptions(q: Question): Option[] {
  let opts: Option[] = [];
  if (q.type === "yes_no_unsure") {
    opts = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }];
  } else if ("options" in q) {
    opts = q.options;
  }
  return q.allowUnknown ? [...opts, { value: UNKNOWN, label: "I don't know" }] : opts;
}

export const isMulti = (q: Question) => q.type === "multiselect";

/**
 * Cards (with optional engraved illustration) or chips. Real radio/checkbox inputs,
 * visually restyled, so it works with the keyboard, screen readers, and without JS.
 */
export function StepChoice({ q, display, value, onChange, labelledBy, sample }: {
  q: Question;
  display: "cards" | "chips";
  value: unknown;
  onChange: (v: string | string[]) => void;
  labelledBy: string;
  /** Design brief cards: a live preview (type, palette, mood) drawn above the label. */
  sample?: (value: string) => React.ReactNode;
}) {
  const opts = choiceOptions(q);
  const multi = isMulti(q);
  const selected = new Set(multi ? ((value as string[] | undefined) ?? []) : value ? [String(value)] : []);

  return (
    <div className={`${display === "cards" ? "ob-cards" : "ob-chips"}${sample ? " ob-cards-sample" : ""}`} role={multi ? "group" : "radiogroup"} aria-labelledby={labelledBy}>
      {opts.map((o, i) => {
        const art = display === "cards" ? ILLUSTRATIONS[`${q.id}:${o.value}`] : undefined;
        const checked = selected.has(o.value);
        return (
          <label key={o.value} className={`ob-option${checked ? " is-selected" : ""}${art ? " has-art" : ""}${sample ? " has-sample" : ""}`}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={q.id}
              value={o.value}
              checked={checked}
              onChange={(e) => {
                if (multi) {
                  const next = new Set(selected);
                  if (e.currentTarget.checked) next.add(o.value);
                  else next.delete(o.value);
                  onChange(opts.map((x) => x.value).filter((v) => next.has(v)));
                } else {
                  onChange(o.value);
                }
              }}
              className="visually-hidden"
            />
            <span className="ob-key" aria-hidden="true">{KEYS[i]}</span>
            {art && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ob-art" src={art} alt="" width={220} height={220} loading="lazy" decoding="async" />
            )}
            {sample?.(o.value)}
            <span className="ob-option-label">{o.label}</span>
            {multi && <span className="ob-tick" aria-hidden="true" />}
          </label>
        );
      })}
    </div>
  );
}
