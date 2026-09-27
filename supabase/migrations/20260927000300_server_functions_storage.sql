-- Server-only functions (executable by service_role only) and storage buckets.
-- Server code validates input in TypeScript first, then calls these so each
-- multi-row write is atomic.

-- ---------------------------------------------------------------------------
-- Rate limiting: fixed window counter. Returns true when the call is allowed.
-- ---------------------------------------------------------------------------
create or replace function public.check_rate_limit(p_key text, p_window_seconds int, p_max int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = rl.count + 1
  returning count into v_count;
  -- Opportunistic cleanup of old windows.
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return v_count <= p_max;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invitation acceptance: binds memberships to the invited user, single use.
-- ---------------------------------------------------------------------------
create or replace function public.accept_invitation(p_token_hash text, p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invitations%rowtype;
begin
  select * into v_inv from public.invitations where token_hash = p_token_hash for update;
  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0002';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'invitation_revoked' using errcode = 'P0001';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'invitation_already_used' using errcode = 'P0001';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;
  if v_inv.user_id <> p_user then
    raise exception 'invitation_wrong_user' using errcode = 'P0001';
  end if;

  insert into public.client_members (client_id, user_id, role)
  values (v_inv.client_id, p_user, 'primary')
  on conflict (client_id, user_id) do nothing;

  if v_inv.project_id is not null then
    insert into public.project_members (project_id, user_id, role, added_by)
    values (v_inv.project_id, p_user, 'client', v_inv.created_by)
    on conflict (project_id, user_id) do nothing;
  end if;

  update public.invitations set accepted_at = now() where id = v_inv.id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, project_id, source, after)
  values (p_user, 'invitation.accepted', 'invitation', v_inv.id, v_inv.project_id, 'client',
          jsonb_build_object('client_id', v_inv.client_id, 'project_id', v_inv.project_id));

  return v_inv.project_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Form submission: answers already validated by the TS form engine.
-- ---------------------------------------------------------------------------
create or replace function public.submit_form(
  p_assignment uuid, p_user uuid, p_answers jsonb, p_change_summary text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_assignment public.form_assignments%rowtype;
  v_prev public.form_submissions%rowtype;
  v_id uuid;
begin
  select * into v_assignment from public.form_assignments where id = p_assignment for update;
  if not found then
    raise exception 'assignment_not_found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.project_members
                 where project_id = v_assignment.project_id and user_id = p_user)
     and not exists (select 1 from public.staff_roles where user_id = p_user) then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;
  if v_assignment.status = 'submitted' then
    raise exception 'already_submitted' using errcode = 'P0001';
  end if;

  select * into v_prev from public.form_submissions
   where assignment_id = p_assignment order by revision_no desc limit 1;

  if v_prev.id is not null and coalesce(trim(p_change_summary), '') = '' then
    raise exception 'amendment_needs_summary' using errcode = 'P0001';
  end if;

  insert into public.form_submissions
    (assignment_id, template_version_id, revision_no, answers, amends_submission_id, change_summary, submitted_by)
  values
    (p_assignment, v_assignment.template_version_id, coalesce(v_prev.revision_no, 0) + 1,
     p_answers, v_prev.id, nullif(trim(p_change_summary), ''), p_user)
  returning id into v_id;

  update public.form_assignments set status = 'submitted' where id = p_assignment;
  return v_id;
end;
$$;

-- Reopen a submitted form so the client can amend it (staff or client-initiated).
create or replace function public.reopen_form(p_assignment uuid)
returns void language sql security definer set search_path = '' as $$
  update public.form_assignments set status = 'reopened' where id = p_assignment and status = 'submitted';
$$;

-- ---------------------------------------------------------------------------
-- Feedback submission (+ approval) for a single review version.
-- ---------------------------------------------------------------------------
create or replace function public.submit_feedback(
  p_feedback_set uuid, p_user uuid, p_decision text, p_statement text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_set public.feedback_sets%rowtype;
  v_rv public.review_versions%rowtype;
  v_review public.reviews%rowtype;
  v_latest uuid;
  v_approval uuid;
begin
  if p_decision not in ('approve', 'request_changes') then
    raise exception 'bad_decision' using errcode = 'P0001';
  end if;

  select * into v_set from public.feedback_sets where id = p_feedback_set for update;
  if not found then raise exception 'feedback_not_found' using errcode = 'P0002'; end if;
  if v_set.status = 'submitted' then raise exception 'already_submitted' using errcode = 'P0001'; end if;

  select * into v_rv from public.review_versions where id = v_set.review_version_id;
  select * into v_review from public.reviews where id = v_rv.review_id;

  if v_rv.published_at is null then
    raise exception 'version_not_published' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.project_members where project_id = v_rv.project_id and user_id = p_user) then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;

  -- Feedback and approval only apply to the current version.
  select id into v_latest from public.review_versions
   where review_id = v_rv.review_id and published_at is not null
   order by version_no desc limit 1;
  if v_latest <> v_rv.id then
    raise exception 'version_superseded' using errcode = 'P0001';
  end if;

  update public.feedback_sets
     set status = 'submitted', decision = p_decision, submitted_by = p_user,
         submitted_at = now(), last_edited_by = p_user
   where id = v_set.id;

  if p_decision = 'approve' then
    insert into public.approvals (project_id, milestone_id, review_version_id, feedback_set_id, statement, approved_by)
    values (v_rv.project_id, v_review.milestone_id, v_rv.id, v_set.id, p_statement, p_user)
    returning id into v_approval;
  end if;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, project_id, source, after)
  values (p_user, 'feedback.submitted', 'review_version', v_rv.id, v_rv.project_id, 'client',
          jsonb_build_object('decision', p_decision, 'version_no', v_rv.version_no, 'approval_id', v_approval));

  return v_set.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Publish a new review version with the next version number.
-- ---------------------------------------------------------------------------
create or replace function public.publish_review_version(
  p_review uuid, p_user uuid, p_preview_url text, p_file uuid, p_instructions text, p_due date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_review public.reviews%rowtype;
  v_next int;
  v_id uuid;
begin
  select * into v_review from public.reviews where id = p_review for update;
  if not found then raise exception 'review_not_found' using errcode = 'P0002'; end if;
  if p_preview_url is null and p_file is null then
    raise exception 'preview_required' using errcode = 'P0001';
  end if;
  select coalesce(max(version_no), 0) + 1 into v_next from public.review_versions where review_id = p_review;

  if p_file is not null then
    update public.files set visibility = 'project' where id = p_file and project_id = v_review.project_id;
  end if;

  insert into public.review_versions
    (review_id, project_id, version_no, preview_url, file_id, instructions, due_date, published_at, created_by)
  values
    (p_review, v_review.project_id, v_next, p_preview_url, p_file, p_instructions, p_due, now(), p_user)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
revoke all on function public.accept_invitation(text, uuid) from public, anon, authenticated;
revoke all on function public.submit_form(uuid, uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.reopen_form(uuid) from public, anon, authenticated;
revoke all on function public.submit_feedback(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.publish_review_version(uuid, uuid, text, uuid, text, date) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
grant execute on function public.accept_invitation(text, uuid) to service_role;
grant execute on function public.submit_form(uuid, uuid, jsonb, text) to service_role;
grant execute on function public.reopen_form(uuid) to service_role;
grant execute on function public.submit_feedback(uuid, uuid, text, text) to service_role;
grant execute on function public.publish_review_version(uuid, uuid, text, uuid, text, date) to service_role;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
-- Private project files. Uploads happen only through signed upload URLs issued by the
-- server after an authorization + type/size check; downloads only through short-lived
-- signed URLs. The per-bucket limits below are the hard backstop.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files', 'project-files', false, 104857600,  -- 100 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/tiff', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv', 'application/rtf',
    'application/zip',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/mp4',
    'video/mp4', 'video/quicktime'
  ])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Public portfolio media (separate from private project assets).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do nothing;

-- Project files: readable only when a matching files row is visible to the caller.
create policy project_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.files f
      where f.bucket = 'project-files' and f.path = storage.objects.name and f.deleted_at is null
        and (public.is_staff() or (f.visibility = 'project' and public.is_project_member(f.project_id)))
    )
  );
-- No insert/update/delete policies for project-files: writes use signed upload URLs
-- (created with the service role) or the service role directly.

create policy portfolio_media_staff_write on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-media' and public.is_staff());
create policy portfolio_media_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'portfolio-media' and public.is_staff());
create policy portfolio_media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-media' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Default milestone lists (editable in admin; copied into each new project).
-- These are working defaults, not promises shown on the public site.
-- ---------------------------------------------------------------------------
insert into public.stage_templates (service_category, title, requires_approval, sort) values
  ('web_design', 'Discovery questionnaire', false, 10),
  ('web_design', 'Content and assets', false, 20),
  ('web_design', 'Design direction', true, 30),
  ('web_design', 'Build preview', true, 40),
  ('web_design', 'Final approval', true, 50),
  ('web_design', 'Launch and handoff', false, 60),
  ('post_production', 'Discovery questionnaire', false, 10),
  ('post_production', 'Footage and materials', false, 20),
  ('post_production', 'First cut', true, 30),
  ('post_production', 'Revised cut', true, 40),
  ('post_production', 'Final approval', true, 50),
  ('post_production', 'Final exports and delivery', false, 60),
  ('creative_materials', 'Discovery', false, 10),
  ('creative_materials', 'Materials and references', false, 20),
  ('creative_materials', 'First draft', true, 30),
  ('creative_materials', 'Final approval', true, 40),
  ('creative_materials', 'Delivery', false, 50),
  ('bundle', 'Discovery', false, 10),
  ('bundle', 'Content and assets', false, 20),
  ('bundle', 'First review', true, 30),
  ('bundle', 'Final approval', true, 40),
  ('bundle', 'Delivery and handoff', false, 50);

insert into public.service_categories (id, title, sort) values
  ('web-design', 'Web Design', 10),
  ('post-production', 'Post-Production', 20),
  ('creative-materials', 'Creative Materials', 30),
  ('bundles', 'Bundles', 40);

insert into public.site_settings (key, value, is_public) values
  ('booking_status', '"Booking 2026"'::jsonb, true),
  ('studio_notify_email', '""'::jsonb, false);
