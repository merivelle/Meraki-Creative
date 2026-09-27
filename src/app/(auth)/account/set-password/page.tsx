import { requireUser } from "@/lib/auth/guards";
import { safeNext } from "@/lib/labels";
import { SetPasswordForm } from "../../AuthForms";

export const metadata = { title: "Choose a password | Meraki Creative" };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { user } = await requireUser("/account/set-password");
  return (
    <>
      <h1>Choose a password</h1>
      <p className="app-sub">For {user.email}. You&apos;ll use it to sign in to your client portal.</p>
      <SetPasswordForm next={safeNext(next)} />
    </>
  );
}
