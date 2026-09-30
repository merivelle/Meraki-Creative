import "server-only";
import { after } from "next/server";
import { validate } from "@/lib/forms/engine";
import { formDataToAnswers } from "@/lib/forms/formdata";
import type { Answers, FormDefinition } from "@/lib/forms/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { createHash } from "node:crypto";
import { serverEnv } from "@/lib/server-env";
import { checkFormToken, clientIpHash, rateLimit, userAgent, verifyTurnstile } from "@/lib/security/abuse";
import { deliver, queueNotifications } from "@/lib/email/outbox";
import { templates } from "@/lib/email/templates";
import type { PackageItem } from "@/lib/content/types";
import { SERVICE_OPTIONS, inquiryDefinition } from "./definition";
import { answerLines } from "./summary";

export type InquiryState = {
  status: "idle" | "error" | "saved";
  formError?: string;
  errors?: Record<string, string>;
  values?: Answers;
  inquiryId?: string;
};

type Pkg = Pick<PackageItem, "slug" | "name" | "categoryId">;

/**
 * Validate and save a public inquiry. Order matters:
 *   1. spam checks  2. rate limits  3. validation  4. INSERT (the only step that can fail the request)
 *   5. queue notifications  6. send emails after the response.
 * Nothing after step 4 can roll back or hide a saved inquiry.
 */
export async function processInquiry(fd: FormData, packages: Pkg[]): Promise<InquiryState> {
  const def = inquiryDefinition(packages);
  const values = formDataToAnswers(def, fd);
  // A session saved before Sep 2026 can still carry retired options (package tiers, bundles,
  // color grading). Drop them quietly instead of failing the whole inquiry.
  const livePackages = new Set([...packages.map((p) => p.slug), "single-service"]);
  if (typeof values.package === "string" && !livePackages.has(values.package)) delete values.package;
  if (Array.isArray(values.post_type)) values.post_type = (values.post_type as string[]).filter((v) => v !== "reel-refresh" && v !== "color");

  // Honeypot: real people never fill the hidden field. Pretend success, save nothing.
  if (String(fd.get("botcheck") ?? "") !== "") return { status: "saved" };

  const timing = checkFormToken(String(fd.get("_t") ?? ""));
  if (timing === "too_fast") return { status: "saved" };
  if (timing === "invalid") {
    return { status: "error", values, formError: "This form expired. Please check your answers and send it again." };
  }
  if (!(await verifyTurnstile(String(fd.get("cf-turnstile-response") ?? "") || null))) {
    return { status: "error", values, formError: "We couldn't confirm you're not a bot. Please try again." };
  }

  const ipHash = await clientIpHash();
  const email = String(values.email ?? "").trim().toLowerCase();
  if (!(await rateLimit(`inquiry:ip:${ipHash}`, 3600, 5)) || (email && !(await rateLimit(`inquiry:email:${email}`, 86400, 3)))) {
    return { status: "error", values, formError: "Too many inquiries from here in a short time. Please try again later, or email the studio directly." };
  }

  const result = validate(def, values, {}, "submit");
  if (!result.ok) {
    return { status: "error", values, errors: result.errors, formError: "A few answers need another look." };
  }
  const a = result.cleaned;
  const services = (a.services as string[]) ?? [];

  const scope: Record<string, unknown> = {};
  for (const k of ["web_scope", "web_existing", "web_features", "post_type", "post_runtime", "post_footage_ready", "materials_type", "materials_stage"]) {
    if (a[k] !== undefined) scope[k] = a[k];
  }

  const serviceLabels = services.map((s) => SERVICE_OPTIONS.find((o) => o.value === s)?.label ?? s).join(", ");

  // Email-only mode: until Supabase is connected, the inquiry is emailed to the studio (with
  // every answer, since nothing is stored) and a receipt goes to the visitor, through Resend.
  if (!databaseConfigured()) {
    return emailOnly(def, a, serviceLabels, values);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[inquiry] database not configured:", e);
    return { status: "error", values, formError: "Something went wrong saving your inquiry. Please try again in a moment." };
  }
  const { data: row, error } = await admin
    .from("inquiries")
    .insert({
      name: a.name,
      email: a.email,
      business_name: a.business_name ?? null,
      client_type: a.client_type,
      services,
      package_slug: (a.package as string) ?? null,
      goal: a.goal ?? null,
      description: a.description,
      links: (a.links as string[]) ?? [],
      scope,
      deadline: a.deadline ?? null,
      deadline_fixed: a.deadline_fixed ?? null,
      budget_range: a.budget ?? null,
      notes: a.notes ?? null,
      preselected: String(fd.get("_preselected") ?? "").slice(0, 200) || null,
      ip_hash: ipHash,
      user_agent: await userAgent(),
      source: "web",
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[inquiry] insert failed:", error);
    return { status: "error", values, formError: "Something went wrong saving your inquiry. Please try again in a moment." };
  }

  // --- Saved. Everything below is best-effort and cannot undo the inquiry. ---
  const deliveryIds = await queueNotifications([
    {
      dedupeKey: `inquiry:${row.id}:studio`,
      type: "inquiry.received",
      audience: "studio",
      title: `New inquiry from ${a.name}`,
      body: String(a.goal ?? ""),
      linkPath: `/admin/inquiries/${row.id}`,
      recipientEmail: serverEnv.studioNotifyEmail || null,
      payload: { inquiryId: row.id },
      email: serverEnv.studioNotifyEmail
        ? {
            template: "inquiry_studio_alert",
            replyTo: String(a.email),
            ...templates.inquiryStudioAlert({
              name: String(a.name), email: String(a.email), services: serviceLabels,
              summary: String(a.description).slice(0, 1200), inquiryId: row.id,
            }),
          }
        : null,
    },
    {
      dedupeKey: `inquiry:${row.id}:receipt`,
      type: "inquiry.receipt",
      audience: "visitor",
      title: "Inquiry receipt",
      recipientEmail: String(a.email),
      payload: { inquiryId: row.id },
      email: { template: "inquiry_receipt", ...templates.inquiryReceipt({ name: String(a.name) }) },
    },
  ], admin);

  after(() => deliver(deliveryIds));
  return { status: "saved", inquiryId: row.id };
}

const databaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && serverEnv.supabaseServiceRoleKey);

const SEND_FAILED = "Something went wrong sending your inquiry. Please try again in a moment, or email the studio directly.";

async function emailOnly(def: FormDefinition, a: Answers, serviceLabels: string, values: Answers): Promise<InquiryState> {
  // Missing Resend keys in production must never look like a sent inquiry.
  const live = process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
  if (!serverEnv.studioNotifyEmail && live) {
    console.error("[inquiry] STUDIO_NOTIFY_EMAIL is not set; cannot deliver the inquiry.");
    return { status: "error", values, formError: SEND_FAILED };
  }
  const key = createHash("sha256").update(`${a.email}|${a.name}|${a.description}`).digest("hex").slice(0, 40);
  const studio = templates.inquiryStudioEmailOnly({
    name: String(a.name), email: String(a.email), services: serviceLabels, lines: answerLines(def, a),
  });
  const sent = await sendEmail({
    to: serverEnv.studioNotifyEmail || "studio@localhost",
    replyTo: String(a.email),
    idempotencyKey: `inquiry:${key}:studio`,
    ...studio,
  });
  if (sent.status === "failed" || (sent.status === "dev_skipped" && live)) {
    console.error("[inquiry] studio email not sent:", sent);
    return { status: "error", values, formError: SEND_FAILED };
  }
  // The receipt is best-effort: the studio already has the inquiry.
  after(() => sendEmail({
    to: String(a.email),
    idempotencyKey: `inquiry:${key}:receipt`,
    ...templates.inquiryReceipt({ name: String(a.name) }),
  }).then((r) => { if (r.status === "failed") console.error("[inquiry] receipt not sent:", r); }));
  return { status: "saved" };
}
