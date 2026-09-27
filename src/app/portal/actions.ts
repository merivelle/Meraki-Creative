"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { AuthorizationError, requireProjectAccess, requireSignedIn, isUuid } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { validate } from "@/lib/forms/engine";
import type { Answers, FormContext, FormDefinition } from "@/lib/forms/types";
import { prepareUpload, completeUpload } from "@/lib/files/storage";
import { parseTimecode } from "@/lib/timecode";
import { normalizeUrl } from "@/lib/forms/engine";
import { notifyStudio } from "@/lib/notify";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const fail = (error: string): Result => ({ ok: false, error });

async function assignmentFor(assignmentId: string) {
  if (!isUuid(assignmentId)) throw new AuthorizationError();
  const session = await requireSignedIn();
  // Read as the user: RLS returns the row only for project members (or staff).
  const { data: a } = await session.supabase
    .from("form_assignments")
    .select("id, project_id, status, context, title, form_template_versions(schema)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a) throw new AuthorizationError();
  const def = (a.form_template_versions as unknown as { schema: FormDefinition }).schema;
  return { session, a, def, ctx: (a.context ?? {}) as FormContext };
}

// ---------------------------------------------------------------------------
// Questionnaires
// ---------------------------------------------------------------------------

/** Autosave / "Save progress". Lenient validation; stored as the shared working draft. */
export async function saveFormDraft(assignmentId: string, answers: Answers): Promise<Result & { savedAt?: string }> {
  try {
    const { session, a, def } = await assignmentFor(assignmentId);
    if (a.status === "submitted") return fail("This questionnaire is already submitted. Choose “Amend” to change it.");
    const r = validate(def, answers, {}, "draft");
    if (JSON.stringify(r.cleaned).length > 200_000) return fail("That's more than a questionnaire can hold. Please shorten a few answers.");
    const now = new Date().toISOString();
    // Runs as the user through RLS (members may write their project's draft).
    const { error } = await session.supabase.from("form_drafts").upsert({
      assignment_id: a.id, answers: r.cleaned, updated_by: session.user.id, updated_at: now,
    });
    if (error) return fail("Couldn't save just now. Your answers are still on this page; try again in a moment.");
    if (a.status === "assigned") await createAdminClient().from("form_assignments").update({ status: "in_progress" }).eq("id", a.id);
    return { ok: true, savedAt: now };
  } catch (e) {
    if (e instanceof AuthorizationError) return fail("Please sign in again.");
    throw e;
  }
}

export async function submitForm(assignmentId: string, answers: Answers, changeSummary?: string): Promise<Result & { errors?: Record<string, string> }> {
  const { session, a, def, ctx } = await assignmentFor(assignmentId);
  const r = validate(def, answers, ctx, "submit");
  if (!r.ok) return { ok: false, error: "A few answers need another look.", errors: r.errors };

  // Keep the draft in step with what was submitted.
  await session.supabase.from("form_drafts").upsert({ assignment_id: a.id, answers: r.cleaned, updated_by: session.user.id });
  const { error } = await createAdminClient().rpc("submit_form", {
    p_assignment: a.id, p_user: session.user.id, p_answers: r.cleaned, p_change_summary: changeSummary ?? null,
  });
  if (error) {
    if (error.message.includes("amendment_needs_summary")) return fail("Please say briefly what you changed.");
    if (error.message.includes("already_submitted")) return fail("This questionnaire was already submitted.");
    return fail("Couldn't submit just now. Your answers are saved as a draft; try again in a moment.");
  }
  after(() => notifyStudio({
    key: `form:${a.id}:${Date.now()}`, type: "form.submitted", projectId: a.project_id,
    headline: `Questionnaire submitted: ${a.title}`, path: `/admin/projects/${a.project_id}/forms`,
  }));
  revalidatePath(`/portal/projects/${a.project_id}`, "layout");
  return { ok: true, message: "Submitted. Thank you." };
}

/** Clients can reopen their own submitted form to amend it; the original stays on record. */
export async function reopenForm(assignmentId: string): Promise<Result> {
  const { a } = await assignmentFor(assignmentId);
  if (a.status !== "submitted") return { ok: true };
  await createAdminClient().rpc("reopen_form", { p_assignment: a.id });
  revalidatePath(`/portal/projects/${a.project_id}`, "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
async function assetRequestFor(requestId: string) {
  if (!isUuid(requestId)) throw new AuthorizationError();
  const session = await requireSignedIn();
  const { data: req } = await session.supabase
    .from("asset_requests").select("id, project_id, status, kind, accepted_types, max_bytes, title")
    .eq("id", requestId).maybeSingle();
  if (!req) throw new AuthorizationError();
  return { session, req };
}

export async function addAssetLink(requestId: string, _prev: Result | null, fd: FormData): Promise<Result> {
  const { session, req } = await assetRequestFor(requestId);
  if (req.kind === "file") return fail("This item needs a file upload.");
  const url = normalizeUrl(String(fd.get("url") ?? ""));
  const label = String(fd.get("label") ?? "").trim().slice(0, 200) || null;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error();
  } catch {
    return fail("Please paste a full link, starting with https://");
  }
  const { error } = await session.supabase.from("asset_items").insert({
    asset_request_id: req.id, project_id: req.project_id, url, label, added_by: session.user.id,
  });
  if (error) return fail("Couldn't add that link. If this item was already accepted, ask the studio to reopen it.");
  after(() => notifyStudio({
    key: `asset:${req.id}:${Date.now()}`, type: "asset.added", projectId: req.project_id,
    headline: `New link for "${req.title}"`, path: `/admin/projects/${req.project_id}/assets`,
  }));
  revalidatePath(`/portal/projects/${req.project_id}/assets`);
  return { ok: true, message: "Link added." };
}

export async function prepareAssetUpload(requestId: string, meta: { name: string; type: string; size: number }) {
  const { session, req } = await assetRequestFor(requestId);
  if (req.kind === "link") return { error: "This item takes a link rather than a file." };
  if (req.status === "accepted") return { error: "This item is already accepted." };
  return prepareUpload({
    projectId: req.project_id, name: meta.name, type: meta.type, size: meta.size, purpose: "asset",
    uploadedBy: session.user.id, visibility: "project", acceptedTypes: req.accepted_types, maxBytes: req.max_bytes,
  });
}

export async function completeAssetUpload(requestId: string, fileId: string): Promise<{ ok: true } | { error: string }> {
  const { session, req } = await assetRequestFor(requestId);
  const done = await completeUpload(fileId, session.user.id);
  if ("error" in done) return done;
  if (done.projectId !== req.project_id) return { error: "Upload not found." };
  const admin = createAdminClient();
  const { error } = await admin.from("asset_items").insert({
    asset_request_id: req.id, project_id: req.project_id, file_id: fileId, added_by: session.user.id,
  });
  if (error) return { error: "Uploaded, but couldn't attach it to this item. Please tell the studio." };
  after(() => notifyStudio({
    key: `asset-file:${fileId}`, type: "asset.added", projectId: req.project_id,
    headline: `New file for "${req.title}"`, path: `/admin/projects/${req.project_id}/assets`,
  }));
  revalidatePath(`/portal/projects/${req.project_id}/assets`);
  return { ok: true };
}

export async function saveAssetNote(requestId: string, _prev: Result | null, fd: FormData): Promise<Result> {
  const { req } = await assetRequestFor(requestId);
  const note = String(fd.get("client_note") ?? "").slice(0, 2000);
  await createAdminClient().from("asset_requests").update({ client_note: note || null }).eq("id", req.id);
  revalidatePath(`/portal/projects/${req.project_id}/assets`);
  return { ok: true, message: "Note saved." };
}

// ---------------------------------------------------------------------------
// Reviews and feedback
// ---------------------------------------------------------------------------
async function versionFor(versionId: string) {
  if (!isUuid(versionId)) throw new AuthorizationError();
  const session = await requireSignedIn();
  const { data: v } = await session.supabase
    .from("review_version_state").select("id, review_id, project_id, version_no, is_latest, review_kind, title, milestone_id")
    .eq("id", versionId).maybeSingle();
  if (!v) throw new AuthorizationError();
  return { session, v };
}

async function draftSetFor(versionId: string) {
  const { session, v } = await versionFor(versionId);
  if (!v.is_latest) throw new Error("superseded");
  const { data: existing } = await session.supabase.from("feedback_sets").select("id, status").eq("review_version_id", v.id).maybeSingle();
  if (existing) return { session, v, set: existing };
  const { data: created, error } = await session.supabase.from("feedback_sets")
    .insert({ review_version_id: v.id, project_id: v.project_id, last_edited_by: session.user.id })
    .select("id, status").single();
  if (error || !created) throw new Error("could_not_create");
  return { session, v, set: created };
}

export async function addFeedbackItem(versionId: string, _prev: Result | null, fd: FormData): Promise<Result> {
  let ctx;
  try {
    ctx = await draftSetFor(versionId);
  } catch (e) {
    if (e instanceof Error && e.message === "superseded") return fail("A newer version is up. Please leave notes on that one.");
    throw e;
  }
  const { session, v, set } = ctx;
  if (set.status !== "draft") return fail("Notes for this version were already sent.");
  const body = String(fd.get("body") ?? "").trim();
  if (!body) return fail("Write the note first.");
  if (body.length > 4000) return fail("Please keep each note under 4000 characters.");
  const kind = fd.get("kind") === "approved_element" ? "approved_element" : "change";

  let timecode_start_ms: number | null = null;
  let timecode_end_ms: number | null = null;
  const start = String(fd.get("timecode_start") ?? "").trim();
  const end = String(fd.get("timecode_end") ?? "").trim();
  if (start) {
    timecode_start_ms = parseTimecode(start);
    if (timecode_start_ms === null) return fail("Timecodes look like 1:05 or 00:01:05.");
  }
  if (end) {
    timecode_end_ms = parseTimecode(end);
    if (timecode_end_ms === null) return fail("Timecodes look like 1:05 or 00:01:05.");
  }
  const { error } = await session.supabase.from("feedback_items").insert({
    feedback_set_id: set.id, project_id: v.project_id, kind,
    page: String(fd.get("page") ?? "").trim().slice(0, 200) || null,
    section: String(fd.get("section") ?? "").trim().slice(0, 200) || null,
    timecode_start_ms, timecode_end_ms, body, created_by: session.user.id,
  });
  if (error) return fail("Couldn't add that note.");
  await session.supabase.from("feedback_sets").update({ last_edited_by: session.user.id }).eq("id", set.id);
  revalidatePath(`/portal/projects/${v.project_id}/reviews/${v.id}`);
  return { ok: true };
}

export async function removeFeedbackItem(versionId: string, itemId: string): Promise<Result> {
  const { session, v } = await versionFor(versionId);
  if (!isUuid(itemId)) return fail("Not found.");
  const { error } = await session.supabase.from("feedback_items").delete().eq("id", itemId);
  if (error) return fail("Couldn't remove that note.");
  revalidatePath(`/portal/projects/${v.project_id}/reviews/${v.id}`);
  return { ok: true };
}

export async function saveGeneralNotes(versionId: string, _prev: Result | null, fd: FormData): Promise<Result> {
  const { session, v, set } = await draftSetFor(versionId);
  if (set.status !== "draft") return fail("Notes for this version were already sent.");
  const notes = String(fd.get("general_notes") ?? "").slice(0, 10000);
  const { error } = await session.supabase.from("feedback_sets")
    .update({ general_notes: notes || null, last_edited_by: session.user.id }).eq("id", set.id);
  if (error) return fail("Couldn't save.");
  revalidatePath(`/portal/projects/${v.project_id}/reviews/${v.id}`);
  return { ok: true, message: "Draft saved." };
}

/** Send the consolidated notes for this version, optionally approving it. */
export async function submitFeedback(versionId: string, _prev: Result | null, fd: FormData): Promise<Result> {
  const decision = fd.get("decision") === "approve" ? "approve" : "request_changes";
  let ctx;
  try {
    ctx = await draftSetFor(versionId);
  } catch (e) {
    if (e instanceof Error && e.message === "superseded") return fail("A newer version is up, so this one can't be approved.");
    throw e;
  }
  const { session, v, set } = ctx;
  if (decision === "approve" && fd.get("confirm") !== "yes") return fail("Tick the box to confirm the approval.");
  if (decision === "request_changes") {
    const { count } = await session.supabase.from("feedback_items").select("id", { count: "exact", head: true })
      .eq("feedback_set_id", set.id).eq("kind", "change");
    const { data: s } = await session.supabase.from("feedback_sets").select("general_notes").eq("id", set.id).single();
    if (!count && !s?.general_notes) return fail("Add at least one change, or write general notes, before sending.");
  }
  const statement = decision === "approve"
    ? `Approved version ${v.version_no} of "${v.title}".`
    : `Requested changes to version ${v.version_no} of "${v.title}".`;
  const { error } = await createAdminClient().rpc("submit_feedback", {
    p_feedback_set: set.id, p_user: session.user.id, p_decision: decision, p_statement: statement,
  });
  if (error) {
    if (error.message.includes("version_superseded")) return fail("A newer version is up, so this one can't be approved.");
    if (error.message.includes("already_submitted")) return fail("Notes for this version were already sent.");
    return fail("Couldn't send just now. Your notes are saved; try again in a moment.");
  }
  after(() => notifyStudio({
    key: `feedback:${set.id}`, type: decision === "approve" ? "approval.received" : "feedback.received",
    projectId: v.project_id,
    headline: decision === "approve" ? `Approved: ${v.title} v${v.version_no}` : `Notes received: ${v.title} v${v.version_no}`,
    path: `/admin/projects/${v.project_id}/reviews`,
  }));
  revalidatePath(`/portal/projects/${v.project_id}`, "layout");
  return { ok: true, message: decision === "approve" ? "Approved. Thank you." : "Your notes were sent." };
}

// ---------------------------------------------------------------------------
// Messages, proposals, work requests, account
// ---------------------------------------------------------------------------
export async function postMessage(projectId: string, _prev: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireProjectAccess(projectId);
  const body = String(fd.get("body") ?? "").trim();
  if (!body) return fail("Write a message first.");
  if (body.length > 10000) return fail("Please keep messages under 10,000 characters.");
  const parent = String(fd.get("parent_id") ?? "");
  const { data, error } = await supabase.from("project_messages")
    .insert({ project_id: projectId, author_id: user.id, body, kind: "message", parent_id: isUuid(parent) ? parent : null })
    .select("id").single();
  if (error || !data) return fail("Couldn't send the message.");
  after(() => notifyStudio({
    key: `message:${data.id}`, type: "message.new", projectId, headline: "New message from a client",
    detail: body.slice(0, 500), path: `/admin/projects/${projectId}/messages`,
  }));
  revalidatePath(`/portal/projects/${projectId}/messages`);
  return { ok: true };
}

export async function respondToProposal(proposalId: string, response: "accepted" | "declined"): Promise<Result> {
  if (!isUuid(proposalId)) return fail("Not found.");
  const session = await requireSignedIn();
  const { data: p } = await session.supabase.from("proposals").select("id, project_id, status, title, expires_at").eq("id", proposalId).maybeSingle();
  if (!p) return fail("Not found.");
  if (p.status !== "sent") return fail("This proposal isn't open for a response.");
  if (p.expires_at && new Date(p.expires_at + "T23:59:59") < new Date()) return fail("This proposal has expired. Ask the studio for an updated one.");
  const admin = createAdminClient();
  await admin.from("proposals").update({ status: response, responded_at: new Date().toISOString(), responded_by: session.user.id }).eq("id", p.id);
  await admin.from("audit_log").insert({
    actor_id: session.user.id, action: `proposal.${response}`, entity_type: "proposal", entity_id: p.id,
    project_id: p.project_id, source: "client",
  });
  after(() => notifyStudio({
    key: `proposal:${p.id}:${response}`, type: `proposal.${response}`, projectId: p.project_id,
    headline: `Proposal ${response}: ${p.title}`, path: `/admin/projects/${p.project_id}/documents`,
  }));
  revalidatePath(`/portal/projects/${p.project_id}`, "layout");
  return { ok: true, message: response === "accepted" ? "Proposal accepted. The agreement and first invoice come next." : "Thanks for letting me know." };
}

export async function submitWorkRequest(_prev: Result | null, fd: FormData): Promise<Result> {
  const session = await requireSignedIn();
  const clientId = String(fd.get("client_id") ?? "");
  const projectId = String(fd.get("project_id") ?? "");
  const kind = fd.get("kind") === "maintenance" ? "maintenance" : "additional_work";
  const description = String(fd.get("description") ?? "").trim();
  const desired = String(fd.get("desired_date") ?? "");
  if (!isUuid(clientId)) return fail("Choose who this is for.");
  if (!description) return fail("Describe what you need.");
  // RLS checks client + project membership on insert.
  const { data, error } = await session.supabase.from("work_requests").insert({
    client_id: clientId, project_id: isUuid(projectId) ? projectId : null, kind,
    description: description.slice(0, 5000), desired_date: /^\d{4}-\d{2}-\d{2}$/.test(desired) ? desired : null,
    requested_by: session.user.id,
  }).select("id").single();
  if (error || !data) return fail("Couldn't send the request.");
  after(() => notifyStudio({
    key: `work-request:${data.id}`, type: "work_request.new", projectId: isUuid(projectId) ? projectId : null,
    headline: kind === "maintenance" ? "New maintenance request" : "New request for additional work",
    detail: description.slice(0, 500), path: `/admin/requests`,
  }));
  return { ok: true, message: "Request sent. You'll hear back by email." };
}

export async function updateProfileName(_prev: Result | null, fd: FormData): Promise<Result> {
  const session = await requireSignedIn();
  const name = String(fd.get("full_name") ?? "").trim().slice(0, 200);
  // Column grants only allow full_name; roles can't be set from here.
  const { error } = await session.supabase.from("profiles").update({ full_name: name || null }).eq("id", session.user.id);
  if (error) return fail("Couldn't save.");
  revalidatePath("/portal/account");
  return { ok: true, message: "Saved." };
}

export async function markNotificationsRead(): Promise<void> {
  const session = await requireSignedIn();
  await session.supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", session.user.id).is("read_at", null);
  revalidatePath("/portal");
}
