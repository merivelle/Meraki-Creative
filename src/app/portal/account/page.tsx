import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { ActionForm } from "@/components/app/ActionForm";
import { updateProfileName } from "@/app/portal/actions";

export default async function AccountPage() {
  const { supabase, user } = await requireUser("/portal/account");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  return (
    <>
      <h1>Account</h1>
      <p className="app-sub">Signed in as {user.email}.</p>
      <ActionForm action={updateProfileName} resetOnSuccess={false} submitLabel="Save">
        <div className="field"><label htmlFor="full_name">Your name</label><input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} maxLength={200} /></div>
      </ActionForm>
      <h2>Password</h2>
      <p><Link href="/account/set-password?next=/portal/account" className="txt-link">Change your password</Link></p>
      <p className="muted-note" style={{ marginTop: "1rem" }}>To change the email on your account, message the studio from any project.</p>
    </>
  );
}
