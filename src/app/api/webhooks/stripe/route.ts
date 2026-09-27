import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { serverEnv } from "@/lib/server-env";
import { stripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyStudio } from "@/lib/notify";

/**
 * The ONLY path that marks an invoice paid automatically. The request must carry a valid
 * Stripe signature; events are processed once (unique provider_event_id).
 */
export async function POST(req: NextRequest) {
  if (!serverEnv.stripeSecretKey || !serverEnv.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig ?? "", serverEnv.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const obj = event.data.object as { id?: string; metadata?: Record<string, string>; amount_paid?: number; currency?: string; status?: string };
  const { data: invoice } = obj.id
    ? await admin.from("invoices").select("id, project_id, number, status").eq("provider_invoice_id", obj.id).maybeSingle()
    : { data: null };

  // Record the event (sanitized: ids, amounts, status — nothing else from the payload).
  const { error: dupErr } = await admin.from("payment_events").insert({
    provider: "stripe", provider_event_id: event.id, type: event.type, invoice_id: invoice?.id ?? null, verified: true,
    payload: { object_id: obj.id, amount_paid: obj.amount_paid ?? null, currency: obj.currency ?? null, status: obj.status ?? null, livemode: event.livemode },
  });
  if (dupErr?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (dupErr) return NextResponse.json({ error: "Could not record event" }, { status: 500 });

  if (invoice) {
    const next =
      event.type === "invoice.paid" ? "paid" :
      event.type === "invoice.voided" ? "void" :
      event.type === "invoice.marked_uncollectible" ? "uncollectible" : null;
    if (next && invoice.status !== next) {
      await admin.from("invoices").update({
        status: next, status_source: "provider", paid_at: next === "paid" ? new Date().toISOString() : null,
      }).eq("id", invoice.id);
      await admin.from("audit_log").insert({
        action: `invoice.${next}`, entity_type: "invoice", entity_id: invoice.id, project_id: invoice.project_id,
        before: { status: invoice.status }, after: { status: next, stripe_event: event.id }, source: "provider",
      });
      if (next === "paid") {
        await notifyStudio({ key: `invoice-paid:${invoice.id}`, type: "invoice.paid", projectId: invoice.project_id,
          headline: `Invoice ${invoice.number} paid (confirmed by Stripe)`, path: `/admin/projects/${invoice.project_id}/documents` });
      }
    }
    await admin.from("payment_events").update({ processed_at: new Date().toISOString() }).eq("provider", "stripe").eq("provider_event_id", event.id);
  }
  return NextResponse.json({ received: true });
}
