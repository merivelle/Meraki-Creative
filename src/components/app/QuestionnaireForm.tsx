"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormFields } from "@/components/forms/FormFields";
import { formDataToAnswers } from "@/lib/forms/formdata";
import type { Answers, FormContext, FormDefinition } from "@/lib/forms/types";
import { reopenForm, saveFormDraft, submitForm } from "@/app/portal/actions";

const AUTOSAVE_MS = 1500;

export function QuestionnaireForm({ assignmentId, def, ctx, initial, status, isAmendment, lastSaved }: {
  assignmentId: string;
  def: FormDefinition;
  ctx: FormContext;
  initial: Answers;
  status: string;
  isAmendment: boolean;
  lastSaved: string | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<string>(lastSaved ? "Saved" : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});
  const [pending, start] = useTransition();
  const [renderKey, setRenderKey] = useState(0);
  const locked = status === "submitted";

  const current = () => (formRef.current ? formDataToAnswers(def, new FormData(formRef.current)) : initial);

  const save = async (answers: Answers) => {
    setSaveState("Saving…");
    const r = await saveFormDraft(assignmentId, answers);
    setSaveState(r.ok ? "All changes saved" : r.error);
  };

  // Autosave after typing pauses; flush when the tab is hidden or closed.
  const schedule = (answers: Answers) => {
    if (locked) return;
    setSaveState("Unsaved changes");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(answers), AUTOSAVE_MS);
  };
  useEffect(() => {
    const flush = () => {
      if (timer.current && !locked) {
        clearTimeout(timer.current);
        timer.current = null;
        void saveFormDraft(assignmentId, current());
      }
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    const answers = current();
    const summary = isAmendment ? String(new FormData(formRef.current!).get("_change_summary") ?? "") : undefined;
    start(async () => {
      const r = await submitForm(assignmentId, answers, summary);
      if (r.ok) {
        setErrors({});
        setMessage({ ok: r.message });
        router.refresh();
      } else {
        setErrors(r.errors ?? {});
        setRenderKey((k) => k + 1);
        setMessage({ error: r.error });
        requestAnimationFrame(() => document.querySelector(".field-error, .form-error")?.scrollIntoView({ block: "center" }));
      }
    });
  };

  if (locked) {
    return (
      <>
        {message.ok && <p className="notice" role="status">{message.ok}</p>}
        <form ref={formRef}><FormFields def={def} initial={initial} ctx={ctx} readOnly /></form>
        <button
          className="btn btn-secondary"
          onClick={() => start(async () => { await reopenForm(assignmentId); router.refresh(); })}
          disabled={pending}
        >
          Amend my answers
        </button>
        <p className="muted-note" style={{ marginTop: "0.6rem" }}>Your submitted answers stay on record; changes are saved as a new revision.</p>
      </>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      {message.error && <p className="form-error" role="alert">{message.error}</p>}
      <FormFields key={renderKey} def={def} initial={renderKey ? current() : initial} ctx={ctx} errors={errors} onAnswersChange={schedule} />
      {isAmendment && (
        <div className="field">
          <label htmlFor="_change_summary">What did you change? *</label>
          <input id="_change_summary" name="_change_summary" type="text" maxLength={500} required />
        </div>
      )}
      <div className="btn-group" style={{ alignItems: "center" }}>
        <button type="button" className="btn btn-secondary" onClick={() => save(current())} disabled={pending}>Save progress</button>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Submitting…" : isAmendment ? "Submit changes" : "Submit"}</button>
        <span className="muted-note" role="status" aria-live="polite">{saveState}</span>
      </div>
      <p className="muted-note" style={{ marginTop: "0.8rem" }}>You can leave and come back. Progress is saved to your account, not this browser.</p>
    </form>
  );
}
