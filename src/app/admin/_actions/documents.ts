"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaff, isUuid } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { notifyProjectMembers } from "@/lib/notify";
import { getPaymentProvider } from "@/lib/payments/provider";
import { ok, fail, str, optStr, optDate, optUrl, lines, cents, type Result } from "./shared";

const rp = (projectId: string) => revalidatePath(`/admin/projects/${projectId}`, "layout");

// ---------------------------------------------------------------------------
// Proposals (structure only; no legal language is generated)
// ---------------------------------------------------------------------------
function parseMilestones(raw: string): { label: string; amount_cents: number; due?: string }[] | null {
  const out: { label: string; amount_cents: number; due?: string }[] = [];
  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    // "Deposit | 500 | on booking"
    const [label, amount, due] = line.split("|").map((s) => s.trim());
    const n = Number((amount ?? "").replace(/[$,]/g, ""));
    if (!label || !Number.isFinite(n) || n < 0) return null;
    out.push({ label, amount_cents: Math.round(n * 100), ...(due ? { due } : {}) });
  }
  return out;
}

export async function saveProposal(projectId: string, proposalId: string | null, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const milestones = parseMilestones(str(fd, "payment_milestones", 5000));
  if (milestones === null) return fail("Payment schedule lines look like: Deposit | 500 | on booking");
  const rounds = str(fd, "revision_rounds", 3);
  const row = {
    project_id: projectId,
    title: str(fd, "title", 200) || "Proposal",
    scope: optStr(fd, "scope", 20000),
    deliverables: lines(fd, "deliverables"),
    exclusions: lines(fd, "exclusions"),
    timeline_assumptions: optStr(fd, "timeline_assumptions", 5000),
    revision_rounds: rounds ? Number(rounds) : null,
    price_cents: cents(fd, "price"),
    payment_milestones: milestones,
    expires_at: optDate(fd, "expires_at"),
  };
  if (proposalId) {
    const { data: cur } = await supabase.from("proposals").select("status").eq("id", proposalId).single();
    if (cur?.status !== "draft") return fail("Only draft proposals can be edited. Create a new one to revise a sent proposal.");
    const { error } = await supabase.from("proposals").update(row).eq("id", proposalId);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase.from("proposals").insert({ ...row, created_by: user.id });
    if (error) return fail(error.message);
  }
  rp(projectId);
  return ok("Proposal saved as a draft.");
}

export async function sendProposal(projectId: string, proposalId: string): Promise<Result> {
  const { supabase, user } = await requireStaff();
  // Sending a new proposal supersedes any earlier open one.
  await supabase.from("proposals").update({ status: "superseded" }).eq("project_id", projectId).eq("status", "sent");
  const { data, error } = await supabase.from("proposals").update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposalId).eq("status", "draft").select("title").single();
  if (error || !data) return fail("Only a draft proposal can be sent.");
  await audit({ actorId: user.id, action: "proposal.sent", entityType: "proposal", entityId: proposalId, projectId, source: "manual" });
  after(() => notifyProjectMembers({ key: `proposal:${proposalId}`, type: "proposal.sent", projectId,
    headline: `Your proposal is ready: ${data.title}`, path: `/portal/projects/${projectId}/documents` }));
  rp(projectId);
  return ok("Sent to the client.");
}

// ---------------------------------------------------------------------------
// Agreements (external signing link; status set manually, with a logged reason)
// ---------------------------------------------------------------------------
export async function saveAgreement(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const title = str(fd, "title", 200) || "Agreement";
  const signing = optUrl(fd, "signing_url");
  if (signing === "invalid") return fail("The signing link isn't a valid URL.");
  const fileId = str(fd, "file_id", 40);
  const proposalId = str(fd, "proposal_id", 40);
  const { error } = await supabase.from("agreements").insert({
    project_id: projectId, title, signing_url: signing, file_id: isUuid(fileId) ? fileId : null,
    proposal_id: isUuid(proposalId) ? proposalId : null, created_by: user.id,
  });
  if (error) return fail(error.message);
  rp(projectId);
  return ok("Agreement saved as a draft.");
}

export async function sendAgreement(projectId: string, agreementId: string): Promise<Result> {
  const { user } = await requireStaff();
  const admin = createAdminClient();
  const { data: a } = await admin.from("agreements").select("title, status, file_id, signing_url").eq("id", agreementId).eq("project_id", projectId).single();
  if (!a || a.status !== "draft") return fail("Only a draft agreement can be sent.");
  if (!a.signing_url && !a.file_id) return fail("Add the agreement file or a signing link first.");
  if (a.file_id) await admin.from("files").update({ visibility: "project" }).eq("id", a.file_id).eq("project_id", projectId);
  await admin.from("agreements").update({ status: "sent" }).eq("id", agreementId);
  await audit({ actorId: user.id, action: "agreement.sent", entityType: "agreement", entityId: agreementId, projectId, source: "manual" });
  after(() => notifyProjectMembers({ key: `agreement:${agreementId}`, type: "agreement.sent", projectId,
    headline: `Agreement ready to sign: ${a.title}`, path: `/portal/projects/${projectId}/documents` }));
  rp(projectId);
  return ok("Sent to the client.");
}

/** Manual status change. Requires a reason; recorded as manual in the audit log. */
export async function setAgreementStatusManually(projectId: string, agreementId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { user } = await requireStaff();
  const status = str(fd, "status", 20);
  const reason = str(fd, "reason", 1000);
  if (!["signed", "declined", "void"].includes(status)) return fail("Unknown status.");
  if (reason.length < 5) return fail("Record how you confirmed this (e.g. “signed copy received from Dropbox Sign”).");
  const admin = createAdminClient();
  const { data: before } = await admin.from("agreements").select("status").eq("id", agreementId).eq("project_id", projectId).single();
  if (!before) return fail("Not found.");
  const signedFile = str(fd, "signed_file_id", 40);
  if (isUuid(signedFile)) await admin.from("files").update({ visibility: "project" }).eq("id", signedFile).eq("project_id", projectId);
  await admin.from("agreements").update({
    status, status_source: "manual",
    signed_at: status === "signed" ? new Date().toISOString() : null,
    ...(isUuid(signedFile) ? { signed_file_id: signedFile } : {}),
  }).eq("id", agreementId);
  await audit({ actorId: user.id, action: `agreement.${status}`, entityType: "agreement", entityId: agreementId, projectId,
    before, after: { status }, reason, source: "manual" });
  rp(projectId);
  return ok("Recorded as a manual change.");
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
export async function createInvoice(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const amount = cents(fd, "amount");
  if (!amount) return fail("Enter an amount.");
  const number = str(fd, "number", 40);
  if (!number) return fail("Enter an invoice number.");
  const paymentUrl = optUrl(fd, "payment_url");
  if (paymentUrl === "invalid") return fail("The payment link isn't a valid URL.");
  const { error } = await supabase.from("invoices").insert({
    project_id: projectId, number, description: optStr(fd, "description", 500), amount_cents: amount,
    due_date: optDate(fd, "due_date"), payment_url: paymentUrl, provider: "external", created_by: user.id,
    proposal_id: isUuid(str(fd, "proposal_id", 40)) ? str(fd, "proposal_id", 40) : null,
  });
  if (error) return fail(error.code === "23505" ? "That invoice number is already used." : error.message);
  rp(projectId);
  return ok("Invoice saved as a draft.");
}

/** Optional: turn a draft into a hosted Stripe invoice (only when Stripe is configured). */
export async function createStripeInvoice(projectId: string, invoiceId: string): Promise<Result> {
  const { user } = await requireStaff();
  const provider = await getPaymentProvider();
  if (!provider?.isConfigured()) return fail("Stripe isn't configured yet. Use an external payment link instead.");
  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("*, projects(title, clients(display_name, primary_email))")
    .eq("id", invoiceId).eq("project_id", projectId).single();
  if (!inv || inv.status !== "draft") return fail("Only draft invoices can be sent through Stripe.");
  const client = (inv.projects as { clients: { display_name: string; primary_email: string | null } }).clients;
  if (!client.primary_email) return fail("Add the client's primary email first.");
  try {
    const r = await provider.createHostedInvoice({
      invoiceId: inv.id, number: inv.number, amountCents: inv.amount_cents, currency: inv.currency,
      description: inv.description ?? (inv.projects as { title: string }).title,
      customerEmail: client.primary_email, customerName: client.display_name, dueDate: inv.due_date,
    });
    await admin.from("invoices").update({ provider: "stripe", provider_invoice_id: r.providerInvoiceId, payment_url: r.paymentUrl }).eq("id", inv.id);
    await audit({ actorId: user.id, action: "invoice.stripe_created", entityType: "invoice", entityId: inv.id, projectId, after: { provider_invoice_id: r.providerInvoiceId }, source: "manual" });
    rp(projectId);
    return ok("Stripe invoice created. Send it to the client when ready.");
  } catch (e) {
    return fail(`Stripe: ${e instanceof Error ? e.message : "error"}`);
  }
}

export async function sendInvoice(projectId: string, invoiceId: string): Promise<Result> {
  const { user } = await requireStaff();
  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("number, status, payment_url").eq("id", invoiceId).eq("project_id", projectId).single();
  if (!inv || inv.status !== "draft") return fail("Only a draft invoice can be sent.");
  if (!inv.payment_url) return fail("Add a payment link (or create a Stripe invoice) first.");
  await admin.from("invoices").update({ status: "open" }).eq("id", invoiceId);
  await audit({ actorId: user.id, action: "invoice.sent", entityType: "invoice", entityId: invoiceId, projectId, source: "manual" });
  after(() => notifyProjectMembers({ key: `invoice:${invoiceId}`, type: "invoice.sent", projectId,
    headline: `Invoice ${inv.number} is ready`, path: `/portal/projects/${projectId}/documents` }));
  rp(projectId);
  return ok("Sent to the client.");
}

/**
 * Manual payment status (e.g. paid by bank transfer). Never automatic, always logged with
 * who, when, and why, and shown as a manual change everywhere it appears.
 */
export async function setInvoiceStatusManually(projectId: string, invoiceId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { user } = await requireStaff();
  const status = str(fd, "status", 20);
  const reason = str(fd, "reason", 1000);
  if (!["paid", "void", "uncollectible", "open"].includes(status)) return fail("Unknown status.");
  if (reason.length < 5) return fail("Record how you confirmed this (e.g. “bank transfer received Sep 30”).");
  const admin = createAdminClient();
  const { data: before } = await admin.from("invoices").select("status, provider").eq("id", invoiceId).eq("project_id", projectId).single();
  if (!before) return fail("Not found.");
  await admin.from("invoices").update({
    status, status_source: "manual", paid_at: status === "paid" ? new Date().toISOString() : null,
  }).eq("id", invoiceId);
  await audit({ actorId: user.id, action: `invoice.${status}`, entityType: "invoice", entityId: invoiceId, projectId,
    before, after: { status }, reason, source: "manual" });
  rp(projectId);
  return ok("Recorded as a manual change.");
}
