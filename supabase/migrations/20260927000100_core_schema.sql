-- Meraki Creative studio platform — core schema.
-- Every table lives in `public` and has RLS enabled (policies are in the next migration).
-- Status values are text + CHECK constraints rather than enums so they can evolve without
-- enum migrations.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  password_set_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_lower_idx on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Mirror auth.users into profiles. Roles are NEVER read from user metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Staff (studio) roles. Server-managed only: no client-facing write policy exists.
create table public.staff_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin')),
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients and access
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  business_name text,
  client_type text not null default 'other' check (client_type in (
    'actor', 'director', 'filmmaker', 'photographer', 'production_company',
    'creative_business', 'other')),
  primary_email text,
  phone text,
  website text,
  is_dev_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

create table public.client_members (
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'primary' check (role in ('primary', 'collaborator')),
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Inquiries (public intake)
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business_name text,
  client_type text not null,
  services text[] not null default '{}',
  package_slug text,
  goal text,
  description text not null,
  links text[] not null default '{}',
  scope jsonb not null default '{}'::jsonb,
  deadline date,
  deadline_fixed text check (deadline_fixed in ('fixed', 'flexible', 'unsure')),
  budget_range text,
  notes text,
  status text not null default 'new' check (status in (
    'new', 'reviewing', 'clarification_requested', 'proposal_sent', 'converted', 'declined', 'spam')),
  source text not null default 'web' check (source in ('web', 'web3forms_import', 'manual')),
  preselected text,
  ip_hash text,
  user_agent text,
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_email_idx on public.inquiries (lower(email));
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Public content (CMS). Working copies are staff-only; the public site reads
-- the snapshot table `published_content`.
-- ---------------------------------------------------------------------------
create table public.service_categories (
  id text primary key,                      -- 'web-design' | 'post-production' | 'creative-materials' | 'bundles'
  title text not null,
  sort int not null default 0
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.service_categories (id),
  role_label text,
  title text not null,
  description text,
  summary text,                            -- short line for the homepage; null = not on the homepage
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,               -- matches the original anchor id, e.g. 'reel-refresh'
  category_id text not null references public.service_categories (id),
  group_title text,                        -- e.g. 'Demo Reels', 'Scene Edits'
  label text,                              -- e.g. 'Post / Most booked'
  name text not null,
  price_display text not null,             -- stored verbatim, e.g. 'From $95', 'Quote on request'
  included text[] not null default '{}',
  tagline text,
  featured boolean not null default false,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client_name text,
  categories text[] not null default '{}',  -- service_categories ids
  layout text not null default 'site' check (layout in ('site', 'reel', 'film', 'scene', 'trailer', 'grade')),
  type_label text,                          -- caption tag, e.g. 'Actor Site', 'Trailer Edit'
  description text,
  contribution text,
  images jsonb not null default '[]'::jsonb,       -- [{src, alt, role}]
  video jsonb,                                      -- {kind: 'file'|'youtube'|'vimeo', src, poster}
  video_links jsonb not null default '[]'::jsonb,   -- [{label, url}]
  live_url text,
  url_label text,                           -- text in the browser bar on website cards
  featured boolean not null default false,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  role_label text,
  name text not null,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,                      -- 'web-design' | 'post-production' | 'creative-materials' | 'general'
  question text not null,
  answer text not null,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Structured page copy (hero, CTA band, process steps...). `data` shape is defined
-- per block in src/lib/content/blocks.ts.
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  key text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page, key)
);

-- Read-only snapshot the public site renders from.
create table public.published_content (
  entity_type text not null check (entity_type in (
    'service', 'package', 'portfolio_item', 'testimonial', 'faq', 'content_block')),
  entity_id uuid not null,
  slug text,
  sort int not null default 0,
  data jsonb not null,
  published_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['services', 'packages', 'portfolio_items', 'testimonials', 'faqs', 'content_blocks', 'site_settings']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  title text not null,
  service_category text not null check (service_category in (
    'web_design', 'post_production', 'creative_materials', 'bundle')),
  package_id uuid references public.packages (id) on delete set null,
  -- Production lifecycle. Agreement and payment status are NOT stored here; they are
  -- derived from agreements / invoices in the project_overview view.
  stage text not null default 'scoping' check (stage in (
    'inquiry', 'scoping', 'proposal', 'booking', 'discovery', 'production',
    'review', 'final_approval', 'delivery', 'completed')),
  state text not null default 'active' check (state in ('active', 'on_hold', 'cancelled', 'archived')),
  client_summary text,                       -- client-visible description
  scope_notes text,                          -- client-visible scope summary
  handoff_instructions text,                 -- client-visible, shown on the deliverables page
  start_date date,
  due_date date,
  is_dev_fixture boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_client_idx on public.projects (client_id);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- Explicit per-project access. Client membership alone grants nothing.
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'collaborator')),
  added_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_idx on public.project_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,           -- sha256 hex of the emailed token; raw token never stored
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index invitations_client_idx on public.invitations (client_id);

-- Milestone templates per service category, copied into a project on creation.
create table public.stage_templates (
  id uuid primary key default gen_random_uuid(),
  service_category text not null,
  title text not null,
  description text,
  requires_approval boolean not null default false,
  sort int not null default 0
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  sort int not null default 0,
  due_date date,
  status text not null default 'upcoming' check (status in ('upcoming', 'in_progress', 'done', 'skipped')),
  requires_approval boolean not null default false,
  client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index milestones_project_idx on public.milestones (project_id, sort);
create trigger milestones_updated_at before update on public.milestones
  for each row execute function public.set_updated_at();

-- Staff-only notes. A separate table (not a visibility flag) so client-facing
-- queries can never accidentally include them.
create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('inquiry', 'client', 'project', 'work_request')),
  entity_id uuid not null,
  project_id uuid references public.projects (id) on delete cascade,
  body text not null,
  author_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index internal_notes_entity_idx on public.internal_notes (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Files (private project storage metadata)
-- ---------------------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  bucket text not null default 'project-files',
  path text not null unique,
  original_name text not null,
  mime_type text,
  size_bytes bigint,
  purpose text not null check (purpose in ('asset', 'review', 'deliverable', 'document', 'attachment')),
  -- 'staff' = uploaded by the studio and not yet released to the client.
  visibility text not null default 'project' check (visibility in ('project', 'staff')),
  upload_status text not null default 'pending' check (upload_status in ('pending', 'complete')),
  uploaded_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index files_project_idx on public.files (project_id);

-- ---------------------------------------------------------------------------
-- Questionnaires
-- ---------------------------------------------------------------------------
create table public.form_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  service_category text,
  created_at timestamptz not null default now()
);

create table public.form_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.form_templates (id) on delete cascade,
  version int not null,
  schema jsonb not null,
  notes text,
  published_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create table public.form_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  template_version_id uuid not null references public.form_template_versions (id) on delete restrict,
  title text not null,
  context jsonb not null default '{}'::jsonb,   -- branching context, e.g. {clientType, scope}
  due_date date,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'submitted', 'reopened')),
  assigned_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index form_assignments_project_idx on public.form_assignments (project_id);
create trigger form_assignments_updated_at before update on public.form_assignments
  for each row execute function public.set_updated_at();

-- Saved progress: one working draft per assignment, shared by the project's members.
create table public.form_drafts (
  assignment_id uuid primary key references public.form_assignments (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

-- Submitted answers. Insert-only; amendments are new rows.
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.form_assignments (id) on delete cascade,
  template_version_id uuid not null references public.form_template_versions (id),
  revision_no int not null,
  answers jsonb not null,
  amends_submission_id uuid references public.form_submissions (id),
  change_summary text,
  submitted_by uuid not null references auth.users (id),
  submitted_at timestamptz not null default now(),
  unique (assignment_id, revision_no)
);

-- Data structure for future visual preference cards. Intentionally empty for now.
create table public.preference_card_sets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  cards jsonb not null default '[]'::jsonb,   -- [{id, label, image, tags}] — not designed yet
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Asset collection
-- ---------------------------------------------------------------------------
create table public.asset_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  kind text not null default 'either' check (kind in ('file', 'link', 'either')),
  accepted_types text[] not null default '{}',   -- keys from src/lib/files/policy.ts
  max_bytes bigint,
  status text not null default 'missing' check (status in ('missing', 'uploaded', 'needs_replacement', 'accepted')),
  studio_note text,                               -- client-visible note from the studio
  client_note text,                               -- client-visible note from the client
  due_date date,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index asset_requests_project_idx on public.asset_requests (project_id, sort);
create trigger asset_requests_updated_at before update on public.asset_requests
  for each row execute function public.set_updated_at();

create table public.asset_items (
  id uuid primary key default gen_random_uuid(),
  asset_request_id uuid not null references public.asset_requests (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  file_id uuid references public.files (id) on delete cascade,
  url text,
  label text,
  added_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  check ((file_id is not null) <> (url is not null))
);

-- ---------------------------------------------------------------------------
-- Reviews, feedback, approvals
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  title text not null,
  review_kind text not null default 'website' check (review_kind in ('website', 'edit', 'document')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index reviews_project_idx on public.reviews (project_id);

create table public.review_versions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  version_no int not null,                     -- also the revision round
  preview_url text,
  file_id uuid references public.files (id),
  instructions text,
  due_date date,
  published_at timestamptz,                    -- null = draft, invisible to the client
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (review_id, version_no)
);

-- One consolidated feedback set per review version.
create table public.feedback_sets (
  id uuid primary key default gen_random_uuid(),
  review_version_id uuid not null unique references public.review_versions (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  decision text check (decision in ('approve', 'request_changes')),
  general_notes text,
  last_edited_by uuid references auth.users (id),
  submitted_by uuid references auth.users (id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  feedback_set_id uuid not null references public.feedback_sets (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'change' check (kind in ('change', 'approved_element')),
  page text,
  section text,
  timecode_start_ms int,
  timecode_end_ms int,
  body text not null,
  resolution_status text not null default 'open' check (resolution_status in ('open', 'in_progress', 'resolved', 'wont_change')),
  resolution_note text,                         -- client-visible
  resolved_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index feedback_items_set_idx on public.feedback_items (feedback_set_id);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  review_version_id uuid not null unique references public.review_versions (id) on delete restrict,
  feedback_set_id uuid references public.feedback_sets (id),
  statement text not null,                       -- snapshot of what the client agreed to
  approved_by uuid not null references auth.users (id),
  approved_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Messages, deliverables, work requests
-- ---------------------------------------------------------------------------
create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  kind text not null default 'message' check (kind in ('message', 'update')),
  parent_id uuid references public.project_messages (id) on delete set null,
  body text not null check (length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index project_messages_project_idx on public.project_messages (project_id, created_at);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  file_id uuid references public.files (id),
  url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.work_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  kind text not null check (kind in ('maintenance', 'additional_work')),
  description text not null check (length(description) between 1 and 5000),
  desired_date date,
  status text not null default 'new' check (status in ('new', 'reviewing', 'quoted', 'converted', 'closed')),
  requested_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger work_requests_updated_at before update on public.work_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Proposals, agreements, invoices, payments
-- ---------------------------------------------------------------------------
create table public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_category text,
  -- Structure + placeholder text only. No legal language is shipped with the app.
  defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  template_id uuid references public.proposal_templates (id) on delete set null,
  title text not null,
  scope text,
  deliverables text[] not null default '{}',
  exclusions text[] not null default '{}',
  timeline_assumptions text,
  revision_rounds int,
  price_cents int check (price_cents >= 0),
  currency text not null default 'usd',
  payment_milestones jsonb not null default '[]'::jsonb,   -- [{label, amount_cents, due}]
  expires_at date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'superseded')),
  sent_at timestamptz,
  responded_at timestamptz,
  responded_by uuid references auth.users (id),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger proposals_updated_at before update on public.proposals
  for each row execute function public.set_updated_at();

create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  proposal_id uuid references public.proposals (id) on delete set null,
  title text not null,
  file_id uuid references public.files (id),
  signing_url text,
  provider text not null default 'external',
  provider_ref text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'declined', 'void')),
  status_source text not null default 'manual' check (status_source in ('manual', 'provider')),
  signed_file_id uuid references public.files (id),
  signed_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agreements_updated_at before update on public.agreements
  for each row execute function public.set_updated_at();

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  proposal_id uuid references public.proposals (id) on delete set null,
  number text not null unique,
  description text,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'usd',
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  status_source text not null default 'manual' check (status_source in ('manual', 'provider')),
  provider text not null default 'external' check (provider in ('external', 'stripe')),
  provider_invoice_id text unique,
  payment_url text,
  paid_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  type text not null,
  invoice_id uuid references public.invoices (id) on delete set null,
  verified boolean not null,
  payload jsonb not null,           -- sanitized; never contains card data
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  project_id uuid references public.projects (id) on delete set null,
  before jsonb,
  after jsonb,
  reason text,
  source text not null check (source in ('manual', 'provider', 'system', 'client')),
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications & email outbox
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  type text not null,
  project_id uuid references public.projects (id) on delete cascade,
  recipient_user_id uuid references auth.users (id) on delete cascade,
  recipient_email text,
  audience text not null check (audience in ('client', 'studio', 'visitor')),
  title text not null,
  body text,
  link_path text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_user_id, created_at desc);

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications (id) on delete cascade,
  to_email text not null,
  template text not null,
  subject text not null,
  text_body text not null,          -- stored so a failed send can be retried exactly
  html_body text not null,
  reply_to text,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'dev_skipped')),
  attempts int not null default 0,
  last_error text,
  provider_message_id text,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_deliveries_status_idx on public.email_deliveries (status, created_at);

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window)
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

-- Enable RLS everywhere. Tables with no policy are unreachable from anon/authenticated.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;
