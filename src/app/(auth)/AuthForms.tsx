"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, setPassword, signIn, type AuthState } from "./actions";
import { FlashMessage } from "@/components/app/AppShell";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action}>
      <FlashMessage error={state.error} />
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="muted-note" style={{ marginTop: "1.2rem" }}><Link href="/forgot-password" className="txt-link">Forgot your password?</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={action}>
      <FlashMessage error={state.error} message={state.message} />
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <button className="btn btn-primary" disabled={pending}>Send reset link</button>
    </form>
  );
}

export function SetPasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(setPassword, {});
  return (
    <form action={action}>
      <FlashMessage error={state.error} />
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="field"><label htmlFor="confirm">Repeat it</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required /></div>
      <p className="field-note">At least 10 characters, with upper and lower case letters and a number.</p>
      <button className="btn btn-primary" disabled={pending}>Save password</button>
    </form>
  );
}
