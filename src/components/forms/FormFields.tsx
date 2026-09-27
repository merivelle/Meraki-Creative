"use client";

/**
 * Renders a FormDefinition as plain HTML inputs (named per src/lib/forms/formdata.ts), so
 * forms submit and validate server-side even without JavaScript. With JS, questions that
 * don't apply are hidden as answers change. Styling uses the existing `.field` /
 * `.form-row` classes; no new visual decisions.
 */
import { useEffect, useRef, useState } from "react";
import { evaluate } from "@/lib/forms/engine";
import { formDataToAnswers } from "@/lib/forms/formdata";
import { UNKNOWN, type Answers, type FormContext, type FormDefinition, type Question } from "@/lib/forms/types";

type Props = {
  def: FormDefinition;
  initial?: Answers;
  errors?: Record<string, string>;
  ctx?: FormContext;
  /** Called with current answers whenever an input changes (used for autosave). */
  onAnswersChange?: (answers: Answers) => void;
  readOnly?: boolean;
};

export function FormFields({ def, initial = {}, errors = {}, ctx = {}, onAnswersChange, readOnly }: Props) {
  const [answers, setAnswers] = useState<Answers>(initial);
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleChange = () => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const next = formDataToAnswers(def, new FormData(form));
    setAnswers(next);
    onAnswersChange?.(next);
  };

  // Server render shows every question (the no-JS fallback; the server ignores answers to
  // questions that don't apply). Once hydrated, conditions hide what doesn't apply.
  useEffect(() => setHydrated(true), []);
  const visible = (cond: Question["showIf"]) => !hydrated || evaluate(cond, answers, ctx);

  return (
    <div ref={ref} onChange={handleChange} onInput={handleChange}>
      {def.sections.map((s) => (
        <fieldset
          key={s.id}
          className="form-section"
          hidden={!visible(s.showIf) || undefined}
          disabled={readOnly || !visible(s.showIf) || undefined}
          style={{ border: 0, marginBottom: "2rem" }}
        >
          <legend className="slate-tag" style={{ marginBottom: "1.2rem" }}>{s.title}</legend>
          {s.intro && <p className="body-2" style={{ marginBottom: "1.4rem" }}>{s.intro}</p>}
          {s.questions.map((q) => (
            <QuestionField
              key={q.id}
              q={q}
              initial={initial[q.id]}
              error={errors[q.id]}
              hidden={!visible(q.showIf)}
              readOnly={readOnly}
              onStructureChange={handleChange}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function QuestionField({ q, initial, error, hidden, readOnly, onStructureChange }: {
  q: Question;
  initial: Answers[string];
  error?: string;
  hidden: boolean;
  readOnly?: boolean;
  onStructureChange: () => void;
}) {
  const id = `f-${q.id}`;
  const errId = error ? `${id}-err` : undefined;
  const helpId = q.help ? `${id}-help` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(" ") || undefined;
  const isUnknown = initial === UNKNOWN;
  const [unknown, setUnknown] = useState(isUnknown);
  const common = {
    id,
    name: q.id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    disabled: readOnly || unknown || undefined,
  } as const;

  if (q.type === "note") {
    return <p className="body-2" hidden={hidden || undefined} style={{ marginBottom: "1.4rem" }}>{q.label}</p>;
  }

  let control: React.ReactNode;
  const str = typeof initial === "string" && !isUnknown ? initial : "";

  switch (q.type) {
    case "text":
    case "email":
    case "url":
      control = (
        <input
          {...common}
          type={q.type === "text" ? "text" : q.type}
          defaultValue={str}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
          autoComplete={q.id === "name" ? "name" : q.type === "email" ? "email" : undefined}
          required={q.required && !hidden && !unknown}
        />
      );
      break;
    case "textarea":
      control = <textarea {...common} rows={5} defaultValue={str} placeholder={q.placeholder} maxLength={q.maxLength} required={q.required && !hidden && !unknown} />;
      break;
    case "url_list":
      control = (
        <textarea
          {...common}
          rows={3}
          defaultValue={Array.isArray(initial) ? (initial as string[]).join("\n") : ""}
          placeholder={q.placeholder ?? "https://"}
        />
      );
      break;
    case "date":
      control = <input {...common} type="date" defaultValue={str} required={q.required && !hidden && !unknown} />;
      break;
    case "number":
      control = <input {...common} type="number" inputMode="decimal" min={q.min} max={q.max} defaultValue={typeof initial === "number" ? initial : ""} />;
      break;
    case "select":
      control = (
        <select {...common} defaultValue={str} required={q.required && !hidden && !unknown}>
          <option value="">Select one</option>
          {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    case "radio":
    case "yes_no_unsure": {
      const opts = q.type === "radio" ? q.options : [
        { value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" },
      ];
      control = (
        <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="choice-list">
          {opts.map((o) => (
            <label key={o.value} className="choice">
              <input type="radio" name={q.id} value={o.value} defaultChecked={str === o.value} disabled={readOnly || unknown || undefined} /> {o.label}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "multiselect": {
      const vals = Array.isArray(initial) ? (initial as string[]) : [];
      control = (
        <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="choice-list">
          {q.options.map((o) => (
            <label key={o.value} className="choice">
              <input type="checkbox" name={q.id} value={o.value} defaultChecked={vals.includes(o.value)} disabled={readOnly || undefined} /> {o.label}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "reference_list":
      control = (
        <Rows
          name={q.id}
          fields={[
            { id: "url", label: "Link", type: "url" },
            { id: "note", label: q.noteLabel ?? "What you like about it", type: "textarea" },
          ]}
          initial={Array.isArray(initial) ? (initial as Record<string, unknown>[]) : []}
          max={q.maxItems ?? 10}
          itemLabel="reference"
          readOnly={readOnly}
          onStructureChange={onStructureChange}
        />
      );
      break;
    case "repeatable_group":
      control = (
        <Rows
          name={q.id}
          fields={q.fields.map((f) => ({ id: f.id, label: f.label, type: f.type === "textarea" ? "textarea" : f.type === "url" ? "url" : "text" }))}
          initial={Array.isArray(initial) ? (initial as Record<string, unknown>[]) : []}
          max={q.maxItems ?? 25}
          itemLabel={q.itemLabel ?? "entry"}
          readOnly={readOnly}
          onStructureChange={onStructureChange}
        />
      );
      break;
    case "preference_cards":
      // Visual preference cards are planned but not designed yet.
      control = <p className="field-note">This part isn&apos;t ready yet. You can skip it.</p>;
      break;
  }

  const groupLike = ["radio", "yes_no_unsure", "multiselect", "reference_list", "repeatable_group"].includes(q.type);

  return (
    <div className="field" hidden={hidden || undefined} data-flag={q.flag}>
      {groupLike ? (
        <span id={`${id}-label`} className="field-label">{q.label}{q.required ? " *" : ""}</span>
      ) : (
        <label id={`${id}-label`} htmlFor={id}>{q.label}{q.required ? " *" : ""}</label>
      )}
      {q.help && <p id={helpId} className="field-note" style={{ marginBottom: "0.6rem" }}>{q.help}</p>}
      {control}
      {q.allowUnknown && (
        <label className="choice" style={{ marginTop: "0.5rem" }}>
          <input
            type="checkbox"
            name={`${q.id}__unknown`}
            value="1"
            defaultChecked={isUnknown}
            disabled={readOnly || undefined}
            onChange={(e) => setUnknown(e.currentTarget.checked)}
          /> I don&apos;t know
        </label>
      )}
      {error && <p id={errId} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function Rows({ name, fields, initial, max, itemLabel, readOnly, onStructureChange }: {
  name: string;
  fields: { id: string; label: string; type: "text" | "url" | "textarea" }[];
  initial: Record<string, unknown>[];
  max: number;
  itemLabel: string;
  readOnly?: boolean;
  onStructureChange: () => void;
}) {
  // Without JS there are always at least 3 rows available.
  const [count, setCount] = useState(Math.min(max, Math.max(initial.length + 1, 3)));
  return (
    <div className="rows">
      {Array.from({ length: count }, (_, i) => (
        <div className="form-row" key={i} style={{ marginBottom: "0.8rem" }}>
          {fields.map((f) => {
            const fid = `f-${name}-${i}-${f.id}`;
            const v = initial[i]?.[f.id];
            return (
              <div className="field" key={f.id} style={{ marginBottom: 0 }}>
                <label htmlFor={fid}>{f.label} {i + 1}</label>
                {f.type === "textarea" ? (
                  <textarea id={fid} name={`${name}.${i}.${f.id}`} rows={2} defaultValue={typeof v === "string" ? v : ""} disabled={readOnly || undefined} />
                ) : (
                  <input id={fid} name={`${name}.${i}.${f.id}`} type={f.type} defaultValue={typeof v === "string" ? v : ""} disabled={readOnly || undefined} />
                )}
              </div>
            );
          })}
        </div>
      ))}
      {!readOnly && count < max && (
        <button type="button" className="txt-link" onClick={() => { setCount((c) => c + 1); setTimeout(onStructureChange, 0); }}>
          Add another {itemLabel}
        </button>
      )}
    </div>
  );
}
