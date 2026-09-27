import { describe, expect, it, vi } from "vitest";
import { admin, configured, RUN } from "./helpers";

/**
 * An inquiry must stay saved when email delivery fails, and the failure must be visible.
 * Mirrors processInquiry's order: insert the inquiry, then queue + deliver notifications.
 */
describe.skipIf(!configured)("email failure", () => {
  it("keeps the inquiry and records the failed delivery", async () => {
    vi.stubEnv("EMAIL_FORCE_FAIL", "1");
    vi.stubEnv("RESEND_API_KEY", "re_test_dummy");
    vi.stubEnv("EMAIL_FROM", "Test <test@example.test>");
    vi.resetModules();
    const { queueNotifications, deliver } = await import("@/lib/email/outbox");

    const db = admin();
    const { data: inq, error } = await db.from("inquiries").insert({
      name: `[TEST] ${RUN}`, email: `inq-${RUN}@example.test`, client_type: "actor", description: "email failure test",
    }).select("id").single();
    expect(error).toBeNull();

    const ids = await queueNotifications([{
      dedupeKey: `inquiry:${inq!.id}:receipt`, type: "inquiry.receipt", audience: "visitor", title: "Receipt",
      recipientEmail: `inq-${RUN}@example.test`, payload: { inquiryId: inq!.id },
      email: { template: "inquiry_receipt", subject: "s", text: "t", html: "<p>t</p>" },
    }]);
    await expect(deliver(ids)).resolves.toBeUndefined(); // never throws

    const { data: still } = await db.from("inquiries").select("id").eq("id", inq!.id).single();
    expect(still?.id).toBe(inq!.id);
    const { data: d } = await db.from("email_deliveries").select("status, attempts, last_error").eq("id", ids[0]).single();
    expect(d).toMatchObject({ status: "failed", attempts: 1 });
    expect(d?.last_error).toContain("EMAIL_FORCE_FAIL");

    // The same event can't be queued twice (no duplicate emails).
    const again = await queueNotifications([{
      dedupeKey: `inquiry:${inq!.id}:receipt`, type: "inquiry.receipt", audience: "visitor", title: "Receipt",
      recipientEmail: `inq-${RUN}@example.test`, email: { template: "inquiry_receipt", subject: "s", text: "t", html: "t" },
    }]);
    expect(again).toEqual([]);
    vi.unstubAllEnvs();
  });
});
