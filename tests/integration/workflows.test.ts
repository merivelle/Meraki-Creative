import { beforeAll, describe, expect, it } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { admin, configured, makeClientProject, makeUser, signIn, RUN } from "./helpers";

describe.skipIf(!configured)("review versions, feedback, and approvals", () => {
  let client: SupabaseClient;
  let user: { id: string; email: string };
  let staff: { id: string; email: string };
  let p: { clientId: string; projectId: string };
  let reviewId: string, milestoneId: string;

  beforeAll(async () => {
    user = await makeUser("reviewer");
    staff = await makeUser("staff");
    await admin().from("staff_roles").insert({ user_id: staff.id, role: "admin" });
    p = await makeClientProject("Review", user.id);
    const db = admin();
    const { data: m } = await db.from("milestones").insert({ project_id: p.projectId, title: "Design direction", requires_approval: true }).select("id").single();
    milestoneId = m!.id;
    const { data: r } = await db.from("reviews").insert({ project_id: p.projectId, milestone_id: milestoneId, title: "Homepage", review_kind: "website" }).select("id").single();
    reviewId = r!.id;
    client = await signIn(user.email);
  });

  const publish = async (url: string) => {
    const { data, error } = await admin().rpc("publish_review_version", { p_review: reviewId, p_user: staff.id, p_preview_url: url, p_file: null, p_instructions: null, p_due: null });
    expect(error).toBeNull();
    return data as string;
  };

  it("approval is tied to the exact version, and a new version needs its own approval", async () => {
    const v1 = await publish("https://preview.example.test/v1");
    // Client drafts one consolidated set for v1, through RLS.
    const { data: set, error } = await client.from("feedback_sets").insert({ review_version_id: v1, project_id: p.projectId, last_edited_by: user.id }).select("id").single();
    expect(error).toBeNull();
    expect((await client.from("feedback_items").insert({ feedback_set_id: set!.id, project_id: p.projectId, kind: "approved_element", page: "Home", body: "Love the hero", created_by: user.id })).error).toBeNull();
    // A second set for the same version is refused (one per round).
    expect((await client.from("feedback_sets").insert({ review_version_id: v1, project_id: p.projectId, last_edited_by: user.id })).error).not.toBeNull();

    const { error: subErr } = await admin().rpc("submit_feedback", { p_feedback_set: set!.id, p_user: user.id, p_decision: "approve", p_statement: "Approved v1" });
    expect(subErr).toBeNull();

    const { data: ap } = await client.from("approvals").select("review_version_id, approved_by").single();
    expect(ap).toEqual({ review_version_id: v1, approved_by: user.id });
    let { data: ms } = await client.from("milestone_status").select("approval_state, latest_version_no").eq("id", milestoneId).single();
    expect(ms).toEqual({ approval_state: "approved", latest_version_no: 1 });

    // Submitted notes are locked.
    const { error: lockErr } = await client.from("feedback_items").update({ body: "changed my mind" }).eq("feedback_set_id", set!.id).select();
    expect(lockErr).not.toBeNull();

    // v2 does NOT inherit v1's approval.
    const v2 = await publish("https://preview.example.test/v2");
    ({ data: ms } = await client.from("milestone_status").select("approval_state, latest_version_no").eq("id", milestoneId).single());
    expect(ms).toEqual({ approval_state: "awaiting_review", latest_version_no: 2 });
    expect((await client.from("approvals").select("review_version_id")).data).toEqual([{ review_version_id: v1 }]);

    // A published version can't be altered.
    expect((await admin().from("review_versions").update({ preview_url: "https://evil.example.test" }).eq("id", v1)).error).not.toBeNull();

    // Changes requested on v2 are recorded against v2 without approval.
    const { data: set2 } = await client.from("feedback_sets").insert({ review_version_id: v2, project_id: p.projectId, last_edited_by: user.id }).select("id").single();
    await client.from("feedback_items").insert({ feedback_set_id: set2!.id, project_id: p.projectId, kind: "change", page: "About", section: "Bio", body: "Shorter please", created_by: user.id });
    expect((await admin().rpc("submit_feedback", { p_feedback_set: set2!.id, p_user: user.id, p_decision: "request_changes", p_statement: "x" })).error).toBeNull();
    const { data: state } = await client.from("review_version_state").select("id, feedback_status, decision, approval_id").eq("id", v2).single();
    expect(state).toMatchObject({ feedback_status: "submitted", decision: "request_changes", approval_id: null });
  });

  it("feedback on a superseded version can't be submitted", async () => {
    const vOld = await publish("https://preview.example.test/old");
    const { data: set } = await client.from("feedback_sets").insert({ review_version_id: vOld, project_id: p.projectId, last_edited_by: user.id }).select("id").single();
    await publish("https://preview.example.test/newer");
    const { error } = await admin().rpc("submit_feedback", { p_feedback_set: set!.id, p_user: user.id, p_decision: "approve", p_statement: "x" });
    expect(error?.message).toContain("version_superseded");
  });

  it("clients can't resolve their own notes (that's the studio's field)", async () => {
    const v = await publish("https://preview.example.test/resolve");
    const { data: set } = await client.from("feedback_sets").insert({ review_version_id: v, project_id: p.projectId, last_edited_by: user.id }).select("id").single();
    const { data: item } = await client.from("feedback_items").insert({ feedback_set_id: set!.id, project_id: p.projectId, body: "x", created_by: user.id }).select("id").single();
    expect((await client.from("feedback_items").update({ resolution_status: "resolved" }).eq("id", item!.id).select()).error).not.toBeNull();
  });
});

describe.skipIf(!configured)("questionnaires", () => {
  let user: { id: string; email: string };
  let p: { clientId: string; projectId: string };
  let assignmentId: string, versionId: string;

  beforeAll(async () => {
    user = await makeUser("forms");
    p = await makeClientProject("Forms", user.id);
    const db = admin();
    const { data: tpl } = await db.from("form_templates").insert({ key: `test-${RUN}`, title: "[TEST] form" }).select("id").single();
    const schema = { key: `test-${RUN}`, version: 1, title: "T", sections: [{ id: "s", title: "S", questions: [{ id: "q", type: "text", label: "Q", required: true }] }] };
    const { data: v } = await db.from("form_template_versions").insert({ template_id: tpl!.id, version: 1, schema, published_at: new Date().toISOString() }).select("id").single();
    versionId = v!.id;
    const { data: a } = await db.from("form_assignments").insert({ project_id: p.projectId, template_version_id: versionId, title: "T" }).select("id").single();
    assignmentId = a!.id;
  });

  it("saved progress survives signing out and back in", async () => {
    const first = await signIn(user.email);
    const { error } = await first.from("form_drafts").upsert({ assignment_id: assignmentId, answers: { q: "half-finished answer" }, updated_by: user.id });
    expect(error).toBeNull();
    await first.auth.signOut();
    const second = await signIn(user.email);
    const { data } = await second.from("form_drafts").select("answers").eq("assignment_id", assignmentId).single();
    expect(data?.answers).toEqual({ q: "half-finished answer" });
  });

  it("stores the template version with each submission; published versions and submissions are immutable", async () => {
    const db = admin();
    const { data: subId, error } = await db.rpc("submit_form", { p_assignment: assignmentId, p_user: user.id, p_answers: { q: "final" } });
    expect(error).toBeNull();
    const { data: sub } = await db.from("form_submissions").select("template_version_id, revision_no").eq("id", subId).single();
    expect(sub).toEqual({ template_version_id: versionId, revision_no: 1 });
    expect((await db.from("form_submissions").update({ answers: { q: "tampered" } }).eq("id", subId)).error).not.toBeNull();
    expect((await db.from("form_template_versions").update({ schema: {} }).eq("id", versionId)).error).not.toBeNull();

    // Amendment: reopen, resubmit with a summary → revision 2 pointing at revision 1.
    expect((await db.rpc("submit_form", { p_assignment: assignmentId, p_user: user.id, p_answers: { q: "again" } })).error?.message).toContain("already_submitted");
    await db.rpc("reopen_form", { p_assignment: assignmentId });
    expect((await db.rpc("submit_form", { p_assignment: assignmentId, p_user: user.id, p_answers: { q: "v2" } })).error?.message).toContain("amendment_needs_summary");
    const { data: sub2 } = await db.rpc("submit_form", { p_assignment: assignmentId, p_user: user.id, p_answers: { q: "v2" }, p_change_summary: "Fixed a typo" });
    const { data: rev } = await db.from("form_submissions").select("revision_no, amends_submission_id").eq("id", sub2).single();
    expect(rev).toEqual({ revision_no: 2, amends_submission_id: subId });
  });

  it("someone outside the project can't submit it", async () => {
    const outsider = await makeUser("outsider");
    const { error } = await admin().rpc("submit_form", { p_assignment: assignmentId, p_user: outsider.id, p_answers: { q: "x" } });
    expect(error).not.toBeNull();
  });
});

describe.skipIf(!configured)("invitations", () => {
  const hash = (t: string) => createHash("sha256").update(t).digest("hex");

  it("grant access only to the invited user, only once, only to the intended project", async () => {
    const invitee = await makeUser("invitee");
    const intruder = await makeUser("intruder");
    const target = await makeClientProject("Invite target", null);
    const other = await makeClientProject("Invite other", null);
    const db = admin();
    const token = randomBytes(32).toString("base64url");
    await db.from("invitations").insert({ email: invitee.email, client_id: target.clientId, project_id: target.projectId, user_id: invitee.id, token_hash: hash(token), expires_at: new Date(Date.now() + 86400000).toISOString() });

    expect((await db.rpc("accept_invitation", { p_token_hash: hash(token), p_user: intruder.id })).error?.message).toContain("invitation_wrong_user");
    expect((await db.rpc("accept_invitation", { p_token_hash: hash(token), p_user: invitee.id })).error).toBeNull();
    expect((await db.rpc("accept_invitation", { p_token_hash: hash(token), p_user: invitee.id })).error?.message).toContain("invitation_already_used");

    const c = await signIn(invitee.email);
    const ids = ((await c.from("projects").select("id")).data ?? []).map((p) => p.id);
    expect(ids).toEqual([target.projectId]);
    expect(ids).not.toContain(other.projectId);
    const intr = await signIn(intruder.email);
    expect((await intr.from("projects").select("id")).data).toEqual([]);
  });

  it("rejects expired and revoked invitations", async () => {
    const u = await makeUser("late");
    const t = await makeClientProject("Late", null);
    const db = admin();
    const expired = randomBytes(32).toString("base64url");
    const revoked = randomBytes(32).toString("base64url");
    await db.from("invitations").insert([
      { email: u.email, client_id: t.clientId, project_id: t.projectId, user_id: u.id, token_hash: hash(expired), expires_at: new Date(Date.now() - 1000).toISOString() },
      { email: u.email, client_id: t.clientId, project_id: t.projectId, user_id: u.id, token_hash: hash(revoked), expires_at: new Date(Date.now() + 86400000).toISOString(), revoked_at: new Date().toISOString() },
    ]);
    expect((await db.rpc("accept_invitation", { p_token_hash: hash(expired), p_user: u.id })).error?.message).toContain("invitation_expired");
    expect((await db.rpc("accept_invitation", { p_token_hash: hash(revoked), p_user: u.id })).error?.message).toContain("invitation_revoked");
  });
});
