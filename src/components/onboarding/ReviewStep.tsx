"use client";

import { UNKNOWN, type Answers, type Question } from "@/lib/forms/types";
import type { Step } from "@/lib/inquiry/steps";
import { choiceOptions } from "./StepChoice";
import { describeDesignValue } from "@/content/design/describe";

function display(q: Question, v: unknown): string {
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return "";
  if (v === UNKNOWN) return "I don't know";
  const opts = choiceOptions(q);
  const lbl = (x: string) => describeDesignValue(q.id, x) ?? opts.find((o) => o.value === x)?.label ?? x;
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (typeof x === "string") return lbl(x);
        const r = x as { url?: string; note?: string };
        if (!r.url && !r.note) return "";
        return [r.url, r.note].filter(Boolean).join(" — ");
      })
      .filter(Boolean)
      .join(q.type === "reference_list" ? " · " : ", ");
  }
  if (q.type === "date" && typeof v === "string") {
    const d = new Date(v + "T12:00:00");
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  return opts.length ? lbl(String(v)) : String(v);
}

/** Every answered question, grouped by screen, each with a way back to change it. */
export function ReviewStep({ steps, questions, answers, visible, onEdit }: {
  steps: Step[];
  questions: Record<string, Question>;
  answers: Answers;
  visible: Set<string>;
  onEdit: (stepId: string) => void;
}) {
  return (
    <dl className="ob-review">
      {steps.filter((s) => s.kind === "question").map((s) => {
        const rows = s.questions
          .filter((sq) => visible.has(sq.id))
          .map((sq) => ({ q: questions[sq.id], text: display(questions[sq.id], answers[sq.id]) }));
        if (!rows.some((r) => r.text)) {
          if (s.skippable) return null;
        }
        return (
          <div className="ob-review-row" key={s.id}>
            <dt className="slate">{s.title}</dt>
            <dd>
              {rows.map((r) => (
                <p key={r.q.id}>
                  {s.questions.length > 1 && <span className="ob-review-q">{r.q.label}: </span>}
                  {r.text || <span className="muted">Not answered</span>}
                </p>
              ))}
            </dd>
            <button type="button" className="ob-link" onClick={() => onEdit(s.id)} aria-label={`Edit: ${s.title}`}>
              Edit
            </button>
          </div>
        );
      })}
    </dl>
  );
}
