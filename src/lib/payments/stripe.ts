import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/server-env";
import type { PaymentProvider } from "./provider";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!serverEnv.stripeSecretKey) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  client ??= new Stripe(serverEnv.stripeSecretKey);
  return client;
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  isConfigured: () => Boolean(serverEnv.stripeSecretKey && serverEnv.stripeWebhookSecret),
  async createHostedInvoice(input) {
    const s = stripe();
    const existing = await s.customers.list({ email: input.customerEmail, limit: 1 });
    const customer = existing.data[0] ?? (await s.customers.create({ email: input.customerEmail, name: input.customerName }));
    const daysUntilDue = input.dueDate
      ? Math.max(1, Math.ceil((new Date(input.dueDate + "T23:59:59").getTime() - Date.now()) / 86400000))
      : 14;
    const inv = await s.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      currency: input.currency,
      description: input.description,
      metadata: { meraki_invoice_id: input.invoiceId, meraki_invoice_number: input.number },
      auto_advance: false,
    }, { idempotencyKey: `meraki-invoice-${input.invoiceId}` });
    await s.invoiceItems.create({
      customer: customer.id, invoice: inv.id, amount: input.amountCents, currency: input.currency, description: input.description,
    }, { idempotencyKey: `meraki-invoice-item-${input.invoiceId}` });
    const finalized = await s.invoices.finalizeInvoice(inv.id!);
    if (!finalized.hosted_invoice_url) throw new Error("Stripe did not return a hosted invoice URL.");
    return { providerInvoiceId: finalized.id!, paymentUrl: finalized.hosted_invoice_url };
  },
};
