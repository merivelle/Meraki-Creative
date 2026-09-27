"use client";

/**
 * Small wrapper for forms backed by a server action returning {ok, error?, message?}.
 * Shows the result inline and resets the form on success.
 */
import { useActionState, useEffect, useRef } from "react";

type Result = { ok: true; message?: string } | { ok: false; error: string } | null;

export function ActionForm({ action, children, className, resetOnSuccess = true, submitLabel, pendingLabel, inline }: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className ?? (inline ? "inline-form" : undefined)}>
      {state && !state.ok && <p className="form-error" role="alert">{state.error}</p>}
      {state?.ok && state.message && <p className="notice" role="status">{state.message}</p>}
      {children}
      {submitLabel && (
        <button type="submit" className="btn btn-primary btn-small" disabled={pending}>
          {pending ? pendingLabel ?? "Saving…" : submitLabel}
        </button>
      )}
    </form>
  );
}
