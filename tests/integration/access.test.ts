import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { admin, anon, configured, makeClientProject, makeUser, signIn, RUN } from "./helpers";

/**
 * Row-level security and privilege checks, exercised through the real API with real
 * signed-in users. These are the guarantees the app relies on even if a page or action
 * forgot a check.
 */
describe.skipIf(!configured)("access control", () => {
  let a: SupabaseClient, b: SupabaseClient;
  let userA: { id: string; email: string }, userB: { id: string; email: string };
  let pa: { clientId: string; projectId: string }, pb: { clientId: string; projectId: string };
  let fileB: { id: string; path: string };

  beforeAll(async () => {
    userA = await makeUser("a");
    userB = await makeUser("b");
    pa = await makeClientProject("A", userA.id);
    pb = await makeClientProject("B", userB.id);
    const db = admin();
    await db.from("project_messages").insert({ project_id: pb.projectId, author_id: userB.id, body: "B's private message" });
    await db.from("internal_notes").insert({ entity_type: "project", entity_id: pa.projectId, project_id: pa.projectId, body: "studio only" });
    await db.from("milestones").insert([{ project_id: pb.projectId, title: "B milestone" }, { project_id: pa.projectId, title: "A internal", client_visible: false }]);
    // A private file in project B.
    const path = `projects/${pb.projectId}/asset/${RUN}-secret.txt`;
    const up = await db.storage.from("project-files").upload(path, new Blob(["secret"], { type: "text/plain" }), { contentType: "text/plain" });
    expect(up.error).toBeNull();
    const { data: f } = await db.from("files").insert({ project_id: pb.projectId, path, original_name: "secret.txt", purpose: "asset", upload_status: "complete", mime_type: "text/plain", size_bytes: 6 }).select("id").single();
    fileB = { id: f!.id, path };
    a = await signIn(userA.email);
    b = await signIn(userB.email);
  });

  it("a client sees their own project and not another client's", async () => {
    const { data } = await a.from("projects").select("id");
    const ids = (data ?? []).map((p) => p.id);
    expect(ids).toContain(pa.projectId);
    expect(ids).not.toContain(pb.projectId);
    const { data: direct } = await a.from("projects").select("id").eq("id", pb.projectId);
    expect(direct).toEqual([]);
    const { data: overview } = await a.from("project_overview").select("id").eq("id", pb.projectId);
    expect(overview).toEqual([]);
  });

  it("a client can't read another project's messages, milestones, or file records", async () => {
    expect((await a.from("project_messages").select("id").eq("project_id", pb.projectId)).data).toEqual([]);
    expect((await a.from("milestones").select("id").eq("project_id", pb.projectId)).data).toEqual([]);
    expect((await a.from("files").select("id").eq("id", fileB.id)).data).toEqual([]);
    expect((await b.from("files").select("id").eq("id", fileB.id)).data).toHaveLength(1);
  });

  it("a client can't write into another client's project", async () => {
    const { error } = await a.from("project_messages").insert({ project_id: pb.projectId, author_id: userA.id, body: "hi" });
    expect(error).not.toBeNull();
    const { error: e2 } = await a.from("project_messages").insert({ project_id: pa.projectId, author_id: userB.id, body: "spoofed author" });
    expect(e2).not.toBeNull();
  });

  it("private files: other clients and anonymous visitors can't download; the owner can, briefly", async () => {
    const other = await a.storage.from("project-files").download(fileB.path);
    expect(other.error).not.toBeNull();
    const otherUrl = await a.storage.from("project-files").createSignedUrl(fileB.path, 60);
    expect(otherUrl.error).not.toBeNull();
    const pub = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-files/${fileB.path}`);
    expect(pub.ok).toBe(false);
    const own = await b.storage.from("project-files").createSignedUrl(fileB.path, 2);
    expect(own.error).toBeNull();
    expect((await fetch(own.data!.signedUrl)).ok).toBe(true);
    await new Promise((r) => setTimeout(r, 3500));
    expect((await fetch(own.data!.signedUrl)).ok).toBe(false); // expired
  });

  it("clients can't upload straight into storage (only via server-issued signed uploads)", async () => {
    const { error } = await a.storage.from("project-files").upload(`projects/${pa.projectId}/asset/${RUN}-direct.txt`, new Blob(["x"]));
    expect(error).not.toBeNull();
  });

  it("internal notes and internal milestones are invisible to clients", async () => {
    expect((await a.from("internal_notes").select("id")).data).toEqual([]);
    const { data } = await a.from("milestones").select("title").eq("project_id", pa.projectId);
    expect((data ?? []).map((m) => m.title)).not.toContain("A internal");
  });

  it("clients can't make themselves staff or edit protected profile fields", async () => {
    const ins = await a.from("staff_roles").insert({ user_id: userA.id, role: "owner" });
    expect(ins.error).not.toBeNull();
    const meta = await a.auth.updateUser({ data: { role: "admin", is_staff: true } }); // metadata is never trusted
    expect(meta.error).toBeNull();
    expect((await a.rpc("is_staff")).data).toBe(false);
    const prof = await a.from("profiles").update({ email: "evil@example.test" }).eq("id", userA.id);
    expect(prof.error).not.toBeNull();
    const ok = await a.from("profiles").update({ full_name: "Renamed" }).eq("id", userA.id);
    expect(ok.error).toBeNull();
  });

  it("non-staff can't read or change studio records", async () => {
    expect((await a.from("inquiries").select("id")).data).toEqual([]);
    expect((await a.from("invitations").select("id")).data).toEqual([]);
    expect((await a.from("audit_log").select("id")).data).toEqual([]);
    expect((await a.from("email_deliveries").select("id")).data).toEqual([]);
    const upd = await a.from("projects").update({ stage: "completed" }).eq("id", pa.projectId).select("id");
    expect(upd.data ?? []).toEqual([]);
    const inv = await a.from("invoices").insert({ project_id: pa.projectId, number: `X-${RUN}`, amount_cents: 1, status: "paid" });
    expect(inv.error).not.toBeNull();
  });

  it("clients can't call server-only functions or write validated records directly", async () => {
    expect((await a.rpc("submit_form", { p_assignment: pa.projectId, p_user: userA.id, p_answers: {} })).error).not.toBeNull();
    expect((await a.rpc("accept_invitation", { p_token_hash: "x", p_user: userA.id })).error).not.toBeNull();
    expect((await a.rpc("check_rate_limit", { p_key: "x", p_window_seconds: 60, p_max: 1 })).error).not.toBeNull();
    expect((await a.from("approvals").insert({ project_id: pa.projectId, review_version_id: pa.projectId, statement: "x", approved_by: userA.id })).error).not.toBeNull();
  });

  it("anonymous visitors read only published public content", async () => {
    const pub = anon();
    expect((await pub.from("projects").select("id")).data).toEqual([]);
    expect((await pub.from("inquiries").select("id")).data).toEqual([]);
    expect((await pub.from("packages").select("id")).data).toEqual([]); // working copies are staff-only
    expect((await pub.from("published_content").select("entity_type").limit(1)).error).toBeNull();
    const ins = await pub.from("inquiries").insert({ name: "x", email: "x@example.test", client_type: "other", description: "x" });
    expect(ins.error).not.toBeNull(); // intake goes through the validated, rate-limited server path
  });
});
