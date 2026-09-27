import "server-only";
import { serverEnv } from "@/lib/server-env";

/**
 * Payment provider boundary. The app only ever stores a hosted payment link and provider
 * ids — never card details. Automated "paid" status may only come from a verified provider
 * webhook (see /api/webhooks/stripe). Clicking a pay link or landing on a return URL
 * proves nothing and changes nothing.
 */
export interface PaymentProvider {
  readonly id: "stripe";
  isConfigured(): boolean;
  /** Create and finalize a hosted invoice; returns the provider id and hosted payment URL. */
  createHostedInvoice(input: {
    invoiceId: string;
    number: string;
    amountCents: number;
    currency: string;
    description: string;
    customerEmail: string;
    customerName: string;
    dueDate: string | null;
  }): Promise<{ providerInvoiceId: string; paymentUrl: string }>;
}

export async function getPaymentProvider(): Promise<PaymentProvider | null> {
  if (!serverEnv.stripeSecretKey) return null;
  const { stripeProvider } = await import("./stripe");
  return stripeProvider;
}
