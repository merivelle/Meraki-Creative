import { redirect } from "next/navigation";
import { acceptInvitation, lookupInvitation } from "@/lib/invitations";
import { getSession } from "@/lib/auth/guards";

export const metadata = { title: "Your invitation | Meraki Creative" };
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  not_found: "This invitation link isn't valid. Check that the whole link was copied.",
  expired: "This invitation has expired. Ask the studio for a new one.",
  used: "This invitation has already been used. Sign in instead.",
  revoked: "This invitation was replaced by a newer one. Use the most recent email, or ask the studio to resend it.",
};

export default async function InvitePage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const inv = await lookupInvitation(token);

  if (!inv.ok) {
    return (
      <>
        <h1>Invitation</h1>
        <p className="form-error">{REASONS[inv.reason]}</p>
        <p><a href="/login" className="txt-link">Go to sign in</a></p>
      </>
    );
  }

  const session = await getSession();
  const otherUser = session && session.user.email.toLowerCase() !== inv.email.toLowerCase() ? session.user.email : null;

  // Accepting is a POST (a button), so email link scanners that only fetch pages can't use it up.
  async function accept() {
    "use server";
    let dest = "/portal";
    try {
      const r = await acceptInvitation(token);
      const target = r.projectId ? `/portal/projects/${r.projectId}` : "/portal";
      dest = r.needsPassword ? `/account/set-password?next=${encodeURIComponent(target)}` : target;
    } catch {
      dest = `/invite/${token}?error=1`;
    }
    redirect(dest);
  }

  return (
    <>
      <h1>Welcome{inv.clientName ? `, ${inv.clientName}` : ""}.</h1>
      <p className="app-sub">
        {inv.projectTitle
          ? <>You&apos;ve been invited to the project page for <b>{inv.projectTitle}</b>.</>
          : <>You&apos;ve been invited to the Meraki Creative client portal.</>}{" "}
        This invitation is for <b>{inv.email}</b>.
      </p>
      {error && <p className="form-error">Something went wrong accepting the invitation. Try again, or ask the studio for a new link.</p>}
      {otherUser && <p className="notice">You&apos;re currently signed in as {otherUser}. Continuing will sign you in as {inv.email} instead.</p>}
      <form action={accept}>
        <button className="btn btn-primary">Continue</button>
      </form>
      <p className="muted-note" style={{ marginTop: "1rem" }}>If this is your first time here, you&apos;ll choose a password next.</p>
    </>
  );
}
