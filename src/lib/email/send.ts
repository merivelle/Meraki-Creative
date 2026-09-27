import "server-only";
import { serverEnv } from "@/lib/server-env";

export type SendResult =
  | { status: "sent"; providerId: string }
  | { status: "failed"; error: string }
  | { status: "dev_skipped" };

/**
 * Send one email through Resend's REST API. The Idempotency-Key header makes a retried
 * request for the same notification a no-op on Resend's side, so retries can't double-send.
 * Without RESEND_API_KEY this logs the message and reports `dev_skipped` — it is never
 * reported as sent.
 */
export async function sendEmail(msg: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
  idempotencyKey: string;
}): Promise<SendResult> {
  if (serverEnv.emailForceFail) return { status: "failed", error: "EMAIL_FORCE_FAIL is set (test mode)" };

  if (!serverEnv.resendApiKey || !serverEnv.emailFrom) {
    console.info(`[DEV EMAIL — not sent] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
    return { status: "dev_skipped" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": msg.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({
        from: serverEnv.emailFrom,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok || !body.id) {
      return { status: "failed", error: `Resend ${res.status}: ${body.message ?? body.name ?? "unknown error"}` };
    }
    return { status: "sent", providerId: body.id };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}
