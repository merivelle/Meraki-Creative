"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff, isUuid } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvitation } from "@/lib/invitations";
import { audit } from "@/lib/audit";
import { deliver, queueNotifications } from "@/lib/email/outbox";
import { templates } from "@/lib/email/templates";
import { ok, fail, str, optStr, type Result } from "./shared";
import { copyMilestones } from "@/lib/projects";

const INQUIRY_STATUSES = ["new", "reviewing", "clarification_requested", "proposal_sent", "converted", "declined", "spam"];
const CLIENT_TYPES = ["actor", "director", "filmmaker", "photographer", "production_company", "creative_business", "other"];
const CATEGORIES = ["web_design", "post_production", "creative_materials", "bundle"];

// ---------------------------------------------------------------------------
// Internal notes (staff-only table; never shown to clients)
// ---------------------------------------------------------------------------
export async function addInternalNote(entityType: string, entityId: string, projectId: string | null, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  if (!["inquiry", "client", "project", "work_request"].includes(entityType) || !isUuid(entityId)) return fail("Invalid target.");
  const body = str(fd, "body", 10000);
  if (!body) return fail("Write the note first.");
  const { error } = await supabase.from("internal_notes").insert({
    entity_type: entityType, entity_id: entityId, project_id: projectId, body, author_id: user.id,
  });
  if (error) return fail(error.message);
  revalidatePath("/admin", "layout");
  return ok("Note added.");
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------
export async function setInquiryStatus(inquiryId: string, status: string): Promise<Result> {
  const { supabase, user } = await requireStaff();
  if (!INQUIRY_STATUSES.includes(status)) return fail("Unknown status.");
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", inquiryId);
  if (error) return fail(error.message);
  await audit({ actorId: user.id, action: "inquiry.status", entityType: "inquiry", entityId: inquiryId, after: { status }, source: "manual" });
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return ok("Status updated.");
}

/** Sends a written question by email (reply-to the studio) and records it on the inquiry. */
export async function requestClarification(inquiryId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const question = str(fd, "question", 5000);
  if (!question) return fail("Write the question first.");
  const { data: inq } = await supabase.from("inquiries").select("id, name, email").eq("id", inquiryId).single();
  if (!inq) return fail("Inquiry not found.");
  const { data: note } = await supabase.from("internal_notes").insert({
    entity_type: "inquiry", entity_id: inquiryId, body: `Clarification requested by email:\n\n${question}`, author_id: user.id,
  }).select("id").single();
  await supabase.from("inquiries").update({ status: "clarification_requested" }).eq("id", inquiryId);
  const ids = await queueNotifications([{
    dedupeKey: `clarification:${note?.id ?? Date.now()}`,
    type: "inquiry.clarification",
    audience: "visitor",
    title: "Clarification requested",
    recipientEmail: inq.email,
    payload: { inquiryId },
    email: { template: "clarification", replyTo: process.env.STUDIO_NOTIFY_EMAIL || null, ...templates.clarification({ name: inq.name, question }) },
  }]);
  await deliver(ids);
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return ok(ids.length ? "Question sent. Check Settings → Email if it doesn't arrive." : "Recorded, but no email was queued.");
}

/** Create (or reuse) a client + a project from an inquiry, copying the inquiry answers. */
export async function convertInquiry(inquiryId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { user } = await requireStaff();
  const admin = createAdminClient();
  const { data: inq } = await admin.from("inquiries").select("*").eq("id", inquiryId).single();
  if (!inq) return fail("Inquiry not found.");

  let clientId = str(fd, "client_id", 40);
  if (!isUuid(clientId)) {
    const clientType = CLIENT_TYPES.includes(inq.client_type) ? inq.client_type : "other";
    const { data: c, error } = await admin.from("clients").insert({
      display_name: str(fd, "client_name", 200) || inq.business_name || inq.name,
      business_name: inq.business_name, client_type: clientType, primary_email: inq.email,
    }).select("id").single();
    if (error || !c) return fail("Couldn't create the client.");
    clientId = c.id;
  }
  const category = str(fd, "service_category", 40);
  if (!CATEGORIES.includes(category)) return fail("Choose a service category.");
  const title = str(fd, "title", 200);
  if (!title) return fail("Give the project a title.");

  const { data: pkg } = inq.package_slug
    ? await admin.from("packages").select("id").eq("slug", inq.package_slug).maybeSingle()
    : { data: null };
  const { data: project, error: pErr } = await admin.from("projects").insert({
    client_id: clientId, inquiry_id: inq.id, title, service_category: category, package_id: pkg?.id ?? null,
    stage: "scoping", created_by: user.id, due_date: inq.deadline,
  }).select("id").single();
  if (pErr || !project) return fail("Couldn't create the project.");

  await copyMilestones(project.id, category);
  await admin.from("internal_notes").insert({
    entity_type: "project", entity_id: project.id, project_id: project.id, author_id: user.id,
    body: `Created from inquiry of ${new Date(inq.created_at).toDateString()}.\nGoal: ${inq.goal ?? "—"}\nBudget: ${inq.budget_range ?? "—"}\nScope: ${JSON.stringify(inq.scope)}\n\n${inq.description}`,
  });
  await admin.from("inquiries").update({ status: "converted", client_id: clientId }).eq("id", inq.id);
  await audit({ actorId: user.id, action: "inquiry.converted", entityType: "inquiry", entityId: inq.id, projectId: project.id, source: "manual" });
  redirect(`/admin/projects/${project.id}`);
}

// ---------------------------------------------------------------------------
// Clients, invitations, access
// ---------------------------------------------------------------------------
export async function saveClient(clientId: string | null, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const type = str(fd, "client_type", 40);
  const row = {
    display_name: str(fd, "display_name", 200),
    business_name: optStr(fd, "business_name", 200),
    client_type: CLIENT_TYPES.includes(type) ? type : "other",
    primary_email: optStr(fd, "primary_email", 320),
    phone: optStr(fd, "phone", 50),
    website: optStr(fd, "website", 2048),
  };
  if (!row.display_name) return fail("Name is required.");
  if (clientId) {
    const { error } = await supabase.from("clients").update(row).eq("id", clientId);
    if (error) return fail(error.message);
    revalidatePath(`/admin/clients/${clientId}`);
    return ok("Saved.");
  }
  const { data, error } = await supabase.from("clients").insert(row).select("id").single();
  if (error || !data) return fail(error?.message ?? "Couldn't create the client.");
  await audit({ actorId: user.id, action: "client.created", entityType: "client", entityId: data.id, source: "manual" });
  redirect(`/admin/clients/${data.id}`);
}

export async function inviteClient(clientId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { user } = await requireStaff();
  const email = str(fd, "email", 320).toLowerCase();
  const name = str(fd, "name", 200);
  const projectId = str(fd, "project_id", 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email.");
  if (!name) return fail("Enter their name.");
  const admin = createAdminClient();
  // An invitation can only point at a project that belongs to this client.
  if (projectId) {
    const { data: p } = await admin.from("projects").select("id").eq("id", projectId).eq("client_id", clientId).maybeSingle();
    if (!p) return fail("That project doesn't belong to this client.");
  }
  // Staff accounts are managed separately and never receive client invitations.
  const { data: prof } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (prof) {
    const { data: staff } = await admin.from("staff_roles").select("user_id").eq("user_id", prof.id).maybeSingle();
    if (staff) return fail("That email belongs to a studio account.");
  }
  try {
    const r = await createInvitation({ email, name, clientId, projectId: projectId || null, createdBy: user.id });
    revalidatePath(`/admin/clients/${clientId}`);
    return ok(r.emailQueued ? "Invitation sent." : "Invitation created, but no email was queued.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Couldn't create the invitation.");
  }
}

export async function revokeInvitation(invitationId: string): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const { data } = await supabase.from("invitations").update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId).is("accepted_at", null).select("client_id").maybeSingle();
  await audit({ actorId: user.id, action: "invitation.revoked", entityType: "invitation", entityId: invitationId, source: "manual" });
  if (data) revalidatePath(`/admin/clients/${data.client_id}`);
  return ok("Invitation revoked.");
}

/** Removes a person's access to one project. Their account and other projects are untouched. */
export async function removeProjectMember(projectId: string, userId: string): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId);
  if (error) return fail(error.message);
  await audit({ actorId: user.id, action: "project_member.removed", entityType: "project", entityId: projectId, projectId, after: { user_id: userId }, source: "manual" });
  revalidatePath("/admin", "layout");
  return ok("Access removed.");
}

/** Grant an already-active client user access to another of that client's projects. */
export async function addProjectMember(projectId: string, _p: Result | null, fd: FormData): Promise<Result> {
  const { supabase, user } = await requireStaff();
  const memberId = str(fd, "user_id", 40);
  if (!isUuid(memberId)) return fail("Choose a person.");
  const { data: project } = await supabase.from("projects").select("client_id").eq("id", projectId).single();
  const { data: cm } = await supabase.from("client_members").select("user_id").eq("client_id", project?.client_id).eq("user_id", memberId).maybeSingle();
  if (!cm) return fail("Only people already on this client's account can be added. Invite anyone else.");
  const { error } = await supabase.from("project_members").insert({ project_id: projectId, user_id: memberId, added_by: user.id });
  if (error) return fail(error.code === "23505" ? "They already have access." : error.message);
  await audit({ actorId: user.id, action: "project_member.added", entityType: "project", entityId: projectId, projectId, after: { user_id: memberId }, source: "manual" });
  revalidatePath(`/admin/projects/${projectId}`);
  return ok("Access granted.");
}

export async function setWorkRequestStatus(id: string, status: string): Promise<Result> {
  const { supabase } = await requireStaff();
  if (!["new", "reviewing", "quoted", "converted", "closed"].includes(status)) return fail("Unknown status.");
  await supabase.from("work_requests").update({ status }).eq("id", id);
  revalidatePath("/admin/requests");
  return ok();
}
