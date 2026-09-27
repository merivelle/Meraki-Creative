"use client";

import { useActionState } from "react";
import { FormFields } from "@/components/forms/FormFields";
import type { Answers, FormDefinition } from "@/lib/forms/types";
import type { InquiryState } from "@/lib/inquiry/submit";
import { submitInquiry } from "./actions";

export function InquiryForm({ def, initial, token, preselected, turnstileSiteKey }: {
  def: FormDefinition;
  initial: Answers;
  token: string;
  preselected: string;
  turnstileSiteKey: string;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const values = state.values ?? initial;

  return (
    <form action={action} noValidate={false}>
      {state.formError && <p className="form-error" role="alert">{state.formError}</p>}
      <input type="hidden" name="_t" value={token} />
      <input type="hidden" name="_preselected" value={preselected} />
      {/* Honeypot (same name the Web3Forms form used). Hidden from people and screen readers. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="botcheck">Leave this empty</label>
        <input type="text" id="botcheck" name="botcheck" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Re-mount on each server response so returned values/errors repopulate the fields. */}
      <FormFields key={JSON.stringify(state.errors ?? {}) + (state.formError ?? "")} def={def} initial={values} errors={state.errors} />

      {turnstileSiteKey && (
        <>
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} style={{ marginBottom: "1.4rem" }} />
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        </>
      )}

      <p className="field-note">Fields marked * are required. No account needed.</p>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Sending…" : "Start Your Project"}
      </button>
    </form>
  );
}
