import "server-only";

/** Server-only secrets. Importing this from a client component fails the build. */
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  studioNotifyEmail: process.env.STUDIO_NOTIFY_EMAIL ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  formSigningSecret: process.env.FORM_SIGNING_SECRET ?? "",
  ipHashSalt: process.env.IP_HASH_SALT ?? "",
  /** Forces email sends to fail — used only by tests to prove inquiries survive email failure. */
  emailForceFail: process.env.EMAIL_FORCE_FAIL === "1",
};

export function integrationStatus() {
  return {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && serverEnv.supabaseServiceRoleKey),
    resend: Boolean(serverEnv.resendApiKey && serverEnv.emailFrom),
    studioNotifyEmail: Boolean(serverEnv.studioNotifyEmail),
    stripe: Boolean(serverEnv.stripeSecretKey && serverEnv.stripeWebhookSecret),
    turnstile: Boolean(serverEnv.turnstileSecretKey && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    signingProvider: false, // external links only; no signing provider integrated yet
    cron: Boolean(serverEnv.cronSecret),
  };
}
