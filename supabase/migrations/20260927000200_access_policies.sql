-- Access control: helper functions, row-level security policies, and immutability triggers.
--
-- Model:
--   * Staff (rows in staff_roles) can read and write everything through the app.
--   * A client user can read only projects they are an explicit member of
--     (project_members), and only the client-visible parts of those projects.
--   * Validated writes (form submission, feedback submission, approvals, invitation
--     acceptance, inquiries, payment status) go through server code using the
--     service role; there is deliberately no client insert policy for them.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_roles where user_id = auth.uid());
$$;

create or replace function public.is_project_member(p_project uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project and user_id = auth.uid()
  );
$$;

create or replace function public.can_access_project(p_project uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_staff() or public.is_project_member(p_project);
$$;

create or replace function public.is_client_member(p_client uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.client_members
    where client_id = p_client and user_id = auth.uid()
  );
$$;

-- A profile is visible to its owner, to staff, and to people who share a project
-- (so message authors show a name). Staff profiles are visible to their clients.
create or replace function public.can_see_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid()
    or public.is_staff()
    or exists (select 1 from public.staff_roles where user_id = p_user)
    or exists (
      select 1 from public.project_members a
      join public.project_members b on a.project_id = b.project_id
      where a.user_id = auth.uid() and b.user_id = p_user
    );
$$;

revoke all on function public.is_staff() from public;
revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.can_access_project(uuid) from public;
revoke all on function public.is_client_member(uuid) from public;
revoke all on function public.can_see_profile(uuid) from public;
grant execute on function public.is_staff() to anon, authenticated, service_role;
grant execute on function public.is_project_member(uuid) to authenticated, service_role;
grant execute on function public.can_access_project(uuid) to authenticated, service_role;
grant execute on function public.is_client_member(uuid) to authenticated, service_role;
grant execute on function public.can_see_profile(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Staff: full access on every table through one generated policy each.
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select tablename from pg_tables
           where schemaname = 'public' and tablename not in ('rate_limits', 'staff_roles')
  loop
    execute format(
      'create policy staff_all on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      r.tablename);
  end loop;
end $$;

-- staff_roles: staff may read the list; nobody writes it through the API.
create policy staff_read on public.staff_roles for select to authenticated using (public.is_staff());
revoke insert, update, delete on public.staff_roles from anon, authenticated;

-- rate_limits: service role only (via check_rate_limit).
revoke all on public.rate_limits from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy profiles_read on public.profiles for select to authenticated
  using (public.can_see_profile(id));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Only the display name is self-editable. email mirrors auth.users; password_set_at is server-set.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Clients and membership
-- ---------------------------------------------------------------------------
create policy clients_member_read on public.clients for select to authenticated
  using (public.is_client_member(id));
create policy client_members_self_read on public.client_members for select to authenticated
  using (user_id = auth.uid());

create policy projects_member_read on public.projects for select to authenticated
  using (public.is_project_member(id));
create policy project_members_read on public.project_members for select to authenticated
  using (public.is_project_member(project_id));

-- ---------------------------------------------------------------------------
-- Client-visible project data (read)
-- ---------------------------------------------------------------------------
create policy milestones_member_read on public.milestones for select to authenticated
  using (client_visible and public.is_project_member(project_id));

create policy files_member_read on public.files for select to authenticated
  using (visibility = 'project' and deleted_at is null and public.is_project_member(project_id));

create policy form_assignments_member_read on public.form_assignments for select to authenticated
  using (public.is_project_member(project_id));

create policy form_versions_member_read on public.form_template_versions for select to authenticated
  using (exists (
    select 1 from public.form_assignments fa
    where fa.template_version_id = form_template_versions.id
      and public.is_project_member(fa.project_id)));

create policy form_templates_member_read on public.form_templates for select to authenticated
  using (exists (
    select 1 from public.form_template_versions v
    join public.form_assignments fa on fa.template_version_id = v.id
    where v.template_id = form_templates.id and public.is_project_member(fa.project_id)));

create policy form_submissions_member_read on public.form_submissions for select to authenticated
  using (exists (
    select 1 from public.form_assignments fa
    where fa.id = form_submissions.assignment_id and public.is_project_member(fa.project_id)));

create policy asset_requests_member_read on public.asset_requests for select to authenticated
  using (public.is_project_member(project_id));
create policy asset_items_member_read on public.asset_items for select to authenticated
  using (public.is_project_member(project_id));

create policy reviews_member_read on public.reviews for select to authenticated
  using (public.is_project_member(project_id) and exists (
    select 1 from public.review_versions rv where rv.review_id = reviews.id and rv.published_at is not null));
create policy review_versions_member_read on public.review_versions for select to authenticated
  using (published_at is not null and public.is_project_member(project_id));
create policy feedback_sets_member_read on public.feedback_sets for select to authenticated
  using (public.is_project_member(project_id));
create policy feedback_items_member_read on public.feedback_items for select to authenticated
  using (public.is_project_member(project_id));
create policy approvals_member_read on public.approvals for select to authenticated
  using (public.is_project_member(project_id));

create policy messages_member_read on public.project_messages for select to authenticated
  using (public.is_project_member(project_id));
create policy deliverables_member_read on public.deliverables for select to authenticated
  using (status = 'published' and public.is_project_member(project_id));

create policy proposals_member_read on public.proposals for select to authenticated
  using (status <> 'draft' and public.is_project_member(project_id));
create policy agreements_member_read on public.agreements for select to authenticated
  using (status <> 'draft' and public.is_project_member(project_id));
create policy invoices_member_read on public.invoices for select to authenticated
  using (status <> 'draft' and public.is_project_member(project_id));

create policy work_requests_member_read on public.work_requests for select to authenticated
  using (public.is_client_member(client_id));

create policy notifications_own_read on public.notifications for select to authenticated
  using (recipient_user_id = auth.uid());
create policy notifications_own_mark_read on public.notifications for update to authenticated
  using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Low-risk client writes (drafts, links, messages, requests) through RLS
-- ---------------------------------------------------------------------------
create policy form_drafts_member_read on public.form_drafts for select to authenticated
  using (exists (
    select 1 from public.form_assignments fa
    where fa.id = form_drafts.assignment_id and public.is_project_member(fa.project_id)));
create policy form_drafts_member_insert on public.form_drafts for insert to authenticated
  with check (updated_by = auth.uid() and exists (
    select 1 from public.form_assignments fa
    where fa.id = form_drafts.assignment_id and public.is_project_member(fa.project_id)));
create policy form_drafts_member_update on public.form_drafts for update to authenticated
  using (exists (
    select 1 from public.form_assignments fa
    where fa.id = form_drafts.assignment_id and public.is_project_member(fa.project_id)))
  with check (updated_by = auth.uid());

create policy asset_items_member_insert on public.asset_items for insert to authenticated
  with check (
    added_by = auth.uid()
    and url is not null and file_id is null      -- file items are created server-side after upload
    and public.is_project_member(project_id)
    and exists (select 1 from public.asset_requests ar
                where ar.id = asset_items.asset_request_id and ar.project_id = asset_items.project_id
                  and ar.status <> 'accepted'));

create policy feedback_sets_member_insert on public.feedback_sets for insert to authenticated
  with check (
    status = 'draft' and decision is null and submitted_at is null
    and last_edited_by = auth.uid()
    and public.is_project_member(project_id)
    and exists (select 1 from public.review_versions rv
                where rv.id = feedback_sets.review_version_id and rv.project_id = feedback_sets.project_id
                  and rv.published_at is not null));
create policy feedback_sets_member_update on public.feedback_sets for update to authenticated
  using (status = 'draft' and public.is_project_member(project_id))
  with check (status = 'draft' and decision is null and submitted_at is null and last_edited_by = auth.uid());
revoke update on public.feedback_sets from authenticated;
grant update (general_notes, last_edited_by) on public.feedback_sets to authenticated;

create policy feedback_items_member_insert on public.feedback_items for insert to authenticated
  with check (
    created_by = auth.uid() and resolution_status = 'open' and resolution_note is null
    and public.is_project_member(project_id)
    and exists (select 1 from public.feedback_sets fs
                where fs.id = feedback_items.feedback_set_id and fs.project_id = feedback_items.project_id
                  and fs.status = 'draft'));
create policy feedback_items_member_update on public.feedback_items for update to authenticated
  using (public.is_project_member(project_id) and exists (
    select 1 from public.feedback_sets fs where fs.id = feedback_items.feedback_set_id and fs.status = 'draft'))
  with check (public.is_project_member(project_id));
create policy feedback_items_member_delete on public.feedback_items for delete to authenticated
  using (public.is_project_member(project_id) and exists (
    select 1 from public.feedback_sets fs where fs.id = feedback_items.feedback_set_id and fs.status = 'draft'));
-- Clients can't touch resolution fields; those belong to the studio.
revoke update on public.feedback_items from authenticated;
grant update (kind, page, section, timecode_start_ms, timecode_end_ms, body) on public.feedback_items to authenticated;
grant update (resolution_status, resolution_note, resolved_at) on public.feedback_items to authenticated; -- staff_all policy gates these

create policy messages_member_insert on public.project_messages for insert to authenticated
  with check (author_id = auth.uid() and kind = 'message' and public.is_project_member(project_id)
              and (parent_id is null or exists (
                select 1 from public.project_messages pm
                where pm.id = project_messages.parent_id and pm.project_id = project_messages.project_id)));

create policy work_requests_member_insert on public.work_requests for insert to authenticated
  with check (requested_by = auth.uid() and status = 'new'
              and public.is_client_member(client_id)
              and (project_id is null or public.is_project_member(project_id)));

-- ---------------------------------------------------------------------------
-- Trusted-server-only tables: make the intent explicit at the grant level too.
-- (Staff still write through the staff_all policy.)
-- ---------------------------------------------------------------------------
revoke insert, update, delete on public.inquiries from anon;
revoke insert, update, delete on public.form_submissions from anon;
revoke insert, update, delete on public.approvals from anon;
revoke insert, update, delete on public.invitations from anon;
revoke insert, update, delete on public.payment_events from anon;
revoke insert, update, delete on public.audit_log from anon;
revoke insert, update, delete on public.email_deliveries from anon;

-- ---------------------------------------------------------------------------
-- Public content: anon reads only the published snapshot and public settings.
-- ---------------------------------------------------------------------------
create policy published_content_public_read on public.published_content for select to anon, authenticated
  using (true);
create policy site_settings_public_read on public.site_settings for select to anon, authenticated
  using (is_public);
create policy service_categories_public_read on public.service_categories for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Immutability
-- ---------------------------------------------------------------------------
create or replace function public.forbid_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% rows are immutable (%)', tg_table_name, tg_op using errcode = 'P0001';
end;
$$;

create trigger form_submissions_immutable before update or delete on public.form_submissions
  for each row execute function public.forbid_change();
create trigger approvals_immutable before update or delete on public.approvals
  for each row execute function public.forbid_change();
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function public.forbid_change();

create or replace function public.guard_form_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.published_at is not null then
      raise exception 'published form versions cannot be deleted' using errcode = 'P0001';
    end if;
    return old;
  end if;
  if old.published_at is not null then
    raise exception 'published form versions are immutable; create a new version' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger form_versions_guard before update or delete on public.form_template_versions
  for each row execute function public.guard_form_version();

create or replace function public.guard_review_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.published_at is not null then
      raise exception 'published review versions cannot be deleted' using errcode = 'P0001';
    end if;
    return old;
  end if;
  if old.published_at is not null and (
       new.review_id is distinct from old.review_id
    or new.project_id is distinct from old.project_id
    or new.version_no is distinct from old.version_no
    or new.preview_url is distinct from old.preview_url
    or new.file_id is distinct from old.file_id
    or new.instructions is distinct from old.instructions
    or new.published_at is distinct from old.published_at) then
    raise exception 'published review versions are immutable; publish a new version' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger review_versions_guard before update or delete on public.review_versions
  for each row execute function public.guard_review_version();

create or replace function public.guard_feedback_set() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'submitted' then
      raise exception 'submitted feedback cannot be deleted' using errcode = 'P0001';
    end if;
    return old;
  end if;
  if old.status = 'submitted' then
    raise exception 'submitted feedback is locked' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger feedback_sets_guard before update or delete on public.feedback_sets
  for each row execute function public.guard_feedback_set();

create or replace function public.guard_feedback_item() returns trigger
language plpgsql set search_path = '' as $$
declare v_status text;
begin
  select status into v_status from public.feedback_sets
   where id = coalesce(new.feedback_set_id, old.feedback_set_id);
  if v_status = 'submitted' then
    if tg_op in ('INSERT', 'DELETE') then
      raise exception 'submitted feedback is locked' using errcode = 'P0001';
    end if;
    if new.kind is distinct from old.kind or new.page is distinct from old.page
       or new.section is distinct from old.section or new.body is distinct from old.body
       or new.timecode_start_ms is distinct from old.timecode_start_ms
       or new.timecode_end_ms is distinct from old.timecode_end_ms
       or new.feedback_set_id is distinct from old.feedback_set_id then
      raise exception 'submitted feedback is locked; only resolution can change' using errcode = 'P0001';
    end if;
  end if;
  -- Resolution fields belong to the studio.
  if tg_op = 'UPDATE' and not public.is_staff() and auth.role() <> 'service_role' and (
       new.resolution_status is distinct from old.resolution_status
    or new.resolution_note is distinct from old.resolution_note
    or new.resolved_at is distinct from old.resolved_at) then
    raise exception 'only the studio can resolve feedback' using errcode = 'P0001';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger feedback_items_guard before insert or update or delete on public.feedback_items
  for each row execute function public.guard_feedback_item();

-- Keep the asset request status in step when a client adds something.
create or replace function public.asset_item_added() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.asset_requests
     set status = 'uploaded'
   where id = new.asset_request_id and status in ('missing', 'needs_replacement');
  return new;
end;
$$;
create trigger asset_items_after_insert after insert on public.asset_items
  for each row execute function public.asset_item_added();

-- ---------------------------------------------------------------------------
-- Derived status views (security_invoker: RLS of the caller applies)
-- ---------------------------------------------------------------------------
create or replace view public.milestone_status with (security_invoker = true) as
select
  m.id, m.project_id, m.title, m.description, m.sort, m.due_date, m.status,
  m.requires_approval, m.client_visible,
  lv.id as latest_version_id,
  lv.version_no as latest_version_no,
  lv.published_at as latest_version_published_at,
  ap.id as approval_id,
  ap.approved_at,
  case
    when not m.requires_approval then 'not_required'
    when lv.id is null then 'not_ready'
    when ap.id is not null then 'approved'
    else 'awaiting_review'
  end as approval_state
from public.milestones m
left join lateral (
  select rv.id, rv.version_no, rv.published_at
  from public.reviews r
  join public.review_versions rv on rv.review_id = r.id
  where r.milestone_id = m.id and rv.published_at is not null
  order by rv.published_at desc, rv.version_no desc
  limit 1
) lv on true
left join public.approvals ap on ap.review_version_id = lv.id;

create or replace view public.review_version_state with (security_invoker = true) as
select
  rv.id, rv.review_id, rv.project_id, rv.version_no, rv.published_at, rv.due_date,
  r.title, r.milestone_id, r.review_kind,
  (rv.id = (select rv2.id from public.review_versions rv2
            where rv2.review_id = rv.review_id and rv2.published_at is not null
            order by rv2.version_no desc limit 1)) as is_latest,
  fs.status as feedback_status,
  fs.decision,
  fs.submitted_at,
  ap.id as approval_id
from public.review_versions rv
join public.reviews r on r.id = rv.review_id
left join public.feedback_sets fs on fs.review_version_id = rv.id
left join public.approvals ap on ap.review_version_id = rv.id;

create or replace view public.project_overview with (security_invoker = true) as
select
  p.id, p.client_id, p.title, p.service_category, p.stage, p.state, p.start_date, p.due_date,
  p.client_summary, p.updated_at,
  c.display_name as client_name,
  (select case
            when count(*) = 0 then 'none'
            when bool_and(a.status = 'signed') then 'signed'
            else 'pending'
          end
     from public.agreements a
    where a.project_id = p.id and a.status not in ('draft', 'void')) as agreement_status,
  (select case
            when count(*) = 0 then 'none'
            when bool_and(i.status in ('paid', 'void')) then 'paid'
            when bool_or(i.status = 'open' and i.due_date < current_date) then 'overdue'
            else 'open'
          end
     from public.invoices i
    where i.project_id = p.id and i.status <> 'draft') as payment_status,
  case
    when p.state <> 'active' then null
    when exists (select 1 from public.proposals x where x.project_id = p.id and x.status = 'sent')
      then 'review_proposal'
    when exists (select 1 from public.agreements x where x.project_id = p.id and x.status = 'sent')
      then 'sign_agreement'
    when exists (select 1 from public.invoices x where x.project_id = p.id and x.status = 'open')
      then 'pay_invoice'
    when exists (select 1 from public.form_assignments x where x.project_id = p.id
                  and x.status in ('assigned', 'in_progress', 'reopened'))
      then 'complete_form'
    when exists (select 1 from public.asset_requests x where x.project_id = p.id
                  and x.status in ('missing', 'needs_replacement'))
      then 'provide_assets'
    when exists (select 1 from public.review_version_state x where x.project_id = p.id
                  and x.is_latest and x.published_at is not null
                  and coalesce(x.feedback_status, 'draft') = 'draft')
      then 'give_feedback'
    else null
  end as next_action
from public.projects p
left join public.clients c on c.id = p.client_id;

grant select on public.milestone_status, public.review_version_state, public.project_overview to authenticated;
revoke all on public.milestone_status, public.review_version_state, public.project_overview from anon;
