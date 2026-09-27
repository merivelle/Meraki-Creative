import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guards";
import { safeNext } from "@/lib/labels";
import { supabaseConfigured } from "@/lib/env";
import { SignInForm } from "../AuthForms";

export const metadata = { title: "Client login | Meraki Creative" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (!supabaseConfigured()) {
    return (
      <>
        <h1>Client login</h1>
        <p className="notice">The client portal isn&apos;t connected yet (Supabase is not configured in this environment).</p>
      </>
    );
  }
  const session = await getSession();
  if (session) redirect(session.isStaff && !next ? "/admin" : safeNext(next));
  return (
    <>
      <h1>Client login</h1>
      <p className="app-sub">For clients with an active project. Accounts are created by invitation, so there&apos;s no sign-up here. New project? <a href="/start" className="txt-link">Start with an inquiry</a>.</p>
      {error === "link" && <p className="form-error">That link has expired or was already used. Sign in, or ask for a new link.</p>}
      <SignInForm next={safeNext(next, "")} />
    </>
  );
}
