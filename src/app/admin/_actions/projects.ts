"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff, isUuid } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { notifyProjectMembers } from "@/lib/notify";
import { copyMilestones } from "@/lib/projects";
import { prepareUpload, completeUpload, type FilePurpose } from "@/lib/files/storage";
import { FILE_TYPE_GROUPS } from "@/lib/files/policy";
import { STAGES, STATES } from "@/lib/labels";
import { ok, fail, str, optStr, optDate, optUrl, type Result } from "./shared";

const CATEGORIES = ["web_design", "post_production", "creative_materials", "bundle"];
const rp = (projectId: string) => revalidatePath(`/admin/projects/${projectId}`, "layout");

export async function createProject(_p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const clientId = str(fd, "client_id", 40);
  const title = str(fd, "title", 200);
  const category = str(fd, "service_category", 40);
  if (!isUuid(clientId)) return fail("Choose a client.");
  if (!title) return fail("Give the project a title.");
  if (!CATEGORIES.includes(category)) return fail("Choose a service category.");
  const { data, error } = await supabase.from("projects").insert({
    client_id: clientId, title, service_category: category, stage: "scoping", created_by: user.id,
    due_date: optDate(fd, "due_date"),
  }).select("id").single();
  if (error || !data) return fail(error?.message ?? "Couldn't create the project.");
  await copyMilestones(data.id, category);
  await audit({ actorId: user.id, action: "project.created", entityType: "project", entityId: data.id, projectId: data.id, source: "manual" });
  redirect(`/admin/projects/${data.id}`);
}

/**
 * Stage and state are production lifecycle only. Agreement and payment status are separate
 * records (see documents actions) and are never implied by the stage.
 */
export async function updateProject(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const stage = str(fd, "stage", 40);
  const state = str(fd, "state", 40);
  if (!(STAGES as readonly string[]).includes(stage) || !(STATES as readonly string[]).includes(state)) return fail("Unknown stage or state.");
  const { data: before } = await supabase.from("projects").select("stage, state").eq("id", projectId).single();
  const { error } = await supabase.from("projects").update({
    title: str(fd, "title", 200), stage, state,
    client_summary: optStr(fd, "client_summary"), scope_notes: optStr(fd, "scope_notes"),
    handoff_instructions: optStr(fd, "handoff_instructions", 20000),
    start_date: optDate(fd, "start_date"), due_date: optDate(fd, "due_date"),
  }).eq("id", projectId);
  if (error) return fail(error.message);
  if (before && (before.stage !== stage || before.state !== state)) {
    await audit({ actorId: user.id, action: "project.stage", entityType: "project", entityId: projectId, projectId, before, after: { stage, state }, source: "manual" });
  }
  rp(projectId);
  return ok("Saved.");
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------
export async function addMilestone(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireStaff();
  const title = str(fd, "title", 200);
  if (!title) return fail("Title required.");
  const { data: last } = await supabase.from("milestones").select("sort").eq("project_id", projectId).order("sort", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("milestones").insert({
    project_id: projectId, title, due_date: optDate(fd, "due_date"), requires_approval: fd.get("requires_approval") === "on",
    client_visible: fd.get("internal") !== "on", sort: (last?.sort ?? 0) + 10,
  });
  if (error) return fail(error.message);
  rp(projectId);
  return ok();
}

export async function updateMilestone(projectId: string, milestoneId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireStaff();
  const status = str(fd, "status", 20);
  if (!["upcoming", "in_progress", "done", "skipped"].includes(status)) return fail("Unknown status.");
  const { error } = await supabase.from("milestones").update({
    title: str(fd, "title", 200), status, due_date: optDate(fd, "due_date"),
    requires_approval: fd.get("requires_approval") === "on", client_visible: fd.get("internal") !== "on",
  }).eq("id", milestoneId).eq("project_id", projectId);
  if (error) return fail(error.message);
  rp(projectId);
  return ok("Saved.");
}

export async function deleteMilestone(projectId: string, milestoneId: string): Promise<Result> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId).eq("project_id", projectId);
  if (error) return fail(error.message);
  rp(projectId);
  return ok();
}

// ---------------------------------------------------------------------------
// Messages and updates
// ---------------------------------------------------------------------------
export async function postStudioMessage(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const body = str(fd, "body", 10000);
  const kind = fd.get("kind") === "update" ? "update" : "message";
  if (!body) return fail("Write the message first.");
  const { data, error } = await supabase.from("project_messages").insert({ project_id: projectId, author_id: user.id, body, kind }).select("id").single();
  if (error || !data) return fail(error?.message ?? "Couldn't send.");
  after(() => notifyProjectMembers({
    key: `message:${data.id}`, type: kind === "update" ? "project.update" : "message.new", projectId,
    headline: kind === "update" ? "New project update" : "New message from the studio", detail: body.slice(0, 600),
    path: `/portal/projects/${projectId}/messages`,
  }));
  rp(projectId);
  return ok("Sent to the client.");
}

// ---------------------------------------------------------------------------
// Questionnaires
// ---------------------------------------------------------------------------
export async function assignForm(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const versionId = str(fd, "template_version_id", 40);
  const { data: version } = await supabase.from("form_template_versions")
    .select("id, published_at, form_templates(title)").eq("id", versionId).maybeSingle();
  if (!version?.published_at) return fail("Choose a published questionnaire version.");
  const { data: project } = await supabase.from("projects").select("clients(client_type)").eq("id", projectId).single();
  const clientType = str(fd, "client_type", 40) || (project?.clients as unknown as { client_type: string } | null)?.client_type || "other";
  const title = str(fd, "title", 200) || (version.form_templates as unknown as { title: string }).title;
  const { data, error } = await supabase.from("form_assignments").insert({
    project_id: projectId, template_version_id: version.id, title, context: { clientType },
    due_date: optDate(fd, "due_date"), assigned_by: user.id,
  }).select("id").single();
  if (error || !data) return fail(error?.message ?? "Couldn't assign.");
  after(() => notifyProjectMembers({
    key: `form-assigned:${data.id}`, type: "form.assigned", projectId, headline: `A questionnaire is ready: ${title}`,
    detail: "Your answers save as you go, so you can finish it in more than one sitting.",
    path: `/portal/projects/${projectId}/forms/${data.id}`,
  }));
  rp(projectId);
  return ok("Assigned. The client has been notified.");
}

export async function reopenAssignment(projectId: string, assignmentId: string): Promise<Result> {
  await requireStaff();
  await createAdminClient().rpc("reopen_form", { p_assignment: assignmentId });
  rp(projectId);
  return ok("Reopened for changes.");
}

// ---------------------------------------------------------------------------
// Asset checklist
// ---------------------------------------------------------------------------
export async function addAssetRequest(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireStaff();
  const title = str(fd, "title", 200);
  if (!title) return fail("Title required.");
  const kind = str(fd, "kind", 10);
  const types = fd.getAll("accepted_types").map(String).filter((t) => t in FILE_TYPE_GROUPS);
  const maxMb = Number(str(fd, "max_mb", 5));
  const { data: last } = await supabase.from("asset_requests").select("sort").eq("project_id", projectId).order("sort", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("asset_requests").insert({
    project_id: projectId, title, description: optStr(fd, "description"),
    kind: ["file", "link", "either"].includes(kind) ? kind : "either", accepted_types: types,
    max_bytes: Number.isFinite(maxMb) && maxMb > 0 ? Math.min(maxMb, 100) * 1024 * 1024 : null,
    due_date: optDate(fd, "due_date"), sort: (last?.sort ?? 0) + 10,
  });
  if (error) return fail(error.message);
  rp(projectId);
  return ok("Added to the checklist.");
}

export async function reviewAssetRequest(projectId: string, requestId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireStaff();
  const status = str(fd, "status", 30);
  if (!["missing", "uploaded", "needs_replacement", "accepted"].includes(status)) return fail("Unknown status.");
  const { data: req } = await supabase.from("asset_requests").update({ status, studio_note: optStr(fd, "studio_note", 2000) })
    .eq("id", requestId).eq("project_id", projectId).select("title").single();
  if (status === "needs_replacement" && req) {
    after(() => notifyProjectMembers({
      key: `asset-replace:${requestId}:${Date.now()}`, type: "asset.needs_replacement", projectId,
      headline: `"${req.title}" needs a replacement`, detail: str(fd, "studio_note", 600) || undefined,
      path: `/portal/projects/${projectId}/assets`,
    }));
  }
  rp(projectId);
  return ok("Updated.");
}

export async function notifyAssetsRequested(projectId: string): Promise<Result> {
  await requireStaff();
  after(() => notifyProjectMembers({
    key: `assets-requested:${projectId}:${new Date().toISOString().slice(0, 13)}`, type: "assets.requested", projectId,
    headline: "Files and links requested", path: `/portal/projects/${projectId}/assets`,
  }));
  return ok("The client has been notified.");
}

// ---------------------------------------------------------------------------
// Studio uploads (review files, deliverables, agreements). Kept staff-only until released.
// ---------------------------------------------------------------------------
export async function prepareStaffUpload(projectId: string, purpose: FilePurpose, meta: { name: string; type: string; size: number }) {
  const { user } = await requireStaff();
  if (!isUuid(projectId)) return { error: "Unknown project." };
  return prepareUpload({
    projectId, name: meta.name, type: meta.type, size: meta.size, purpose, uploadedBy: user.id,
    visibility: "staff", acceptedTypes: ["images", "documents", "audio", "video_short", "archives", "fonts"],
  });
}

export async function completeStaffUpload(fileId: string): Promise<{ ok: true } | { error: string }> {
  const { user } = await requireStaff();
  const r = await completeUpload(fileId, user.id);
  return "error" in r ? r : { ok: true };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export async function createReview(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const title = str(fd, "title", 200);
  const kind = str(fd, "review_kind", 20);
  const milestoneId = str(fd, "milestone_id", 40);
  if (!title) return fail("Title required.");
  const { error } = await supabase.from("reviews").insert({
    project_id: projectId, title, review_kind: ["website", "edit", "document"].includes(kind) ? kind : "website",
    milestone_id: isUuid(milestoneId) ? milestoneId : null, created_by: user.id,
  });
  if (error) return fail(error.message);
  rp(projectId);
  return ok("Review created. Publish the first version when it's ready.");
}

/** Publishes the next version number. Earlier approvals stay with earlier versions. */
export async function publishReviewVersion(projectId: string, reviewId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { user } = await requireStaff();
  const url = optUrl(fd, "preview_url");
  if (url === "invalid") return fail("The preview link isn't a valid URL.");
  const fileId = str(fd, "file_id", 40);
  const admin = createAdminClient();
  if (fileId) {
    const { data: f } = await admin.from("files").select("id").eq("id", fileId).eq("project_id", projectId).eq("upload_status", "complete").maybeSingle();
    if (!f) return fail("That file isn't part of this project.");
  }
  const { data: review } = await admin.from("reviews").select("title").eq("id", reviewId).eq("project_id", projectId).single();
  if (!review) return fail("Review not found.");
  const { data: versionId, error } = await admin.rpc("publish_review_version", {
    p_review: reviewId, p_user: user.id, p_preview_url: url, p_file: isUuid(fileId) ? fileId : null,
    p_instructions: optStr(fd, "instructions", 10000), p_due: optDate(fd, "due_date"),
  });
  if (error) return fail(error.message.includes("preview_required") ? "Add a preview link or a file." : error.message);
  await audit({ actorId: user.id, action: "review.version_published", entityType: "review", entityId: reviewId, projectId, after: { version_id: versionId }, source: "manual" });
  after(() => notifyProjectMembers({
    key: `review-ready:${versionId}`, type: "review.ready", projectId, headline: `Ready for review: ${review.title}`,
    detail: "Collect everyone's notes and send them as one set.", path: `/portal/projects/${projectId}/reviews/${versionId}`,
  }));
  rp(projectId);
  return ok("Published. The client has been notified.");
}

export async function resolveFeedbackItem(projectId: string, itemId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase } = await requireStaff();
  const status = str(fd, "resolution_status", 20);
  if (!["open", "in_progress", "resolved", "wont_change"].includes(status)) return fail("Unknown status.");
  const { error } = await supabase.from("feedback_items").update({
    resolution_status: status, resolution_note: optStr(fd, "resolution_note", 2000),
    resolved_at: status === "resolved" || status === "wont_change" ? new Date().toISOString() : null,
  }).eq("id", itemId).eq("project_id", projectId);
  if (error) return fail(error.message);
  rp(projectId);
  return ok("Saved.");
}

// ---------------------------------------------------------------------------
// Deliverables and handoff
// ---------------------------------------------------------------------------
export async function addDeliverable(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const title = str(fd, "title", 200);
  const url = optUrl(fd, "url");
  const fileId = str(fd, "file_id", 40);
  if (!title) return fail("Title required.");
  if (url === "invalid") return fail("That link isn't a valid URL.");
  if (!url && !isUuid(fileId)) return fail("Add a link or upload a file.");
  const { error } = await supabase.from("deliverables").insert({
    project_id: projectId, title, description: optStr(fd, "description"), url, file_id: isUuid(fileId) ? fileId : null, created_by: user.id,
  });
  if (error) return fail(error.message);
  rp(projectId);
  return ok("Added as a draft. Publish it when it's ready for the client.");
}

export async function publishDeliverables(projectId: string): Promise<Result> {
  const { user } = await requireStaff();
  const admin = createAdminClient();
  const { data: drafts } = await admin.from("deliverables").select("id, file_id").eq("project_id", projectId).eq("status", "draft");
  if (!drafts?.length) return fail("There are no draft deliverables to publish.");
  const fileIds = drafts.map((d) => d.file_id).filter(Boolean) as string[];
  if (fileIds.length) await admin.from("files").update({ visibility: "project" }).in("id", fileIds).eq("project_id", projectId);
  const now = new Date().toISOString();
  await admin.from("deliverables").update({ status: "published", published_at: now }).in("id", drafts.map((d) => d.id));
  await audit({ actorId: user.id, action: "deliverables.published", entityType: "project", entityId: projectId, projectId, after: { count: drafts.length }, source: "manual" });
  after(() => notifyProjectMembers({
    key: `deliverables:${projectId}:${now}`, type: "deliverables.available", projectId,
    headline: "Your deliverables are ready", path: `/portal/projects/${projectId}/deliverables`,
  }));
  rp(projectId);
  return ok("Published. The client has been notified.");
}
