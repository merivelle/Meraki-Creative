# Architecture

Meraki Creative is one Next.js (App Router, TypeScript) application with three areas:

| Area | Routes | Who |
|---|---|---|
| Public site | `/`, `/web-design`, `/post-production`, `/web-design/[service]`, `/post-production/[service]`, `/services`, `/work`, `/work/[slug]`, `/about`, `/start` | Everyone |
| Client portal | `/portal/**` | Invited clients, per project |
| Studio admin | `/admin/**` | Staff (rows in `staff_roles`) |

Supporting services: **Supabase** (Postgres, Auth, Storage), **Resend** (transactional email over
its REST API), **Stripe** (optional hosted invoices; unconfigured until keys are added).

## Separation of infrastructure

- Meraki's Supabase, Vercel, Resend, and Stripe accounts hold **only Meraki's business data**:
  inquiries, clients, projects, files clients send for Meraki work, and public site content.
- Websites built *for* clients get **their own** repositories and provider accounts (ideally in
  the client's name or transferable to them). The portal is not an admin panel for client
  sites; it only stores links and handoff instructions about them.
- Client credentials (domain registrar, hosting, CMS logins) are **never** collected through
  the portal. Questionnaires say so explicitly, and a validator rejects answers that look like
  passwords or API keys. Hand credentials over out-of-band (a password manager share).

## Old URLs

The previous static site lived at the repo root as `.html` files (kept in `legacy/` for
reference). Every old URL 308-redirects to its new route (`src/lib/redirects.ts`, wired in
`next.config.ts`). Query strings carry through, so `contact.html?package=…` still works.
`/packages` and `packages.html` now 308 to `/services` (packages retired, Sep 2026).

## Public content

- Content tables (`services`, `packages`, `portfolio_items`, `testimonials`, `faqs`,
  `content_blocks`) hold the **working copy** and are staff-only.
- **Publishing** copies a snapshot into `published_content`, the only content table anonymous
  visitors can read. Pages are cached and re-rendered when something is published
  (`revalidateTag`).
- **Preview**: staff can turn on draft mode (`/api/preview`) to see unpublished edits.
- If Supabase isn't configured (e.g. a preview build), pages render from `src/content/seed.ts`,
  which was transcribed from the original pages. Prices are verbatim strings.

## Data model (main entities)

`profiles` (1:1 with auth users; no role column) · `staff_roles` · `clients` · `client_members`
· `projects` · `project_members` · `invitations` · `inquiries` · `milestones` /
`stage_templates` · `internal_notes` · `form_templates` / `form_template_versions` /
`form_assignments` / `form_drafts` / `form_submissions` · `preference_card_sets` (reserved) ·
`asset_requests` / `asset_items` / `files` · `reviews` / `review_versions` / `feedback_sets` /
`feedback_items` / `approvals` · `project_messages` · `deliverables` · `work_requests` ·
`proposal_templates` / `proposals` / `agreements` / `invoices` / `payment_events` ·
`notifications` / `email_deliveries` · `audit_log` · `rate_limits` · public content tables.

Views: `project_overview` (derived agreement + payment status and the client's next action),
`milestone_status` (approval state from the **latest published** version), `review_version_state`.

### Lifecycle vs. money
`projects.stage` (inquiry → … → completed) and `projects.state` (active / on hold / cancelled /
archived) describe production only. Agreement and payment status are **derived** from
`agreements` and `invoices` and are never stored on the project, so moving a project into
production can't imply anything was signed or paid.

## Security model

Three layers, each sufficient on its own for the critical rules:

1. **Middleware** refreshes the session and bounces signed-out visitors from private areas.
2. **Server-side guards** (`src/lib/auth/guards.ts`) in every page, action, and route:
   `requireStaff*`, `requireProjectAccess` (looks the project up *as the user*, so RLS decides).
3. **Row-level security** on every table and on `storage.objects`
   (`supabase/migrations/*_access_policies.sql`, `*_server_functions_storage.sql`).

Rules worth knowing:
- Staff status comes only from `staff_roles`, which has no client write path. User metadata is
  never used for authorization. Admin access is granted from the command line.
- Project access is explicit per project (`project_members`). Being on a client account alone
  grants nothing.
- Validated writes (form submission, feedback submission + approval, invitation acceptance,
  inquiries, payment status) run on the server through `security definer` functions that only
  the service role may execute. Clients have no direct insert path for those tables.
- Immutable records: published form versions, form submissions (amendments are new rows),
  published review versions, submitted feedback (only the studio's resolution fields change),
  approvals, and the audit log.
- Files live in the private `project-files` bucket. Uploads go through server-issued, single-use
  signed upload URLs after an access, type, and size check; downloads go through
  `/api/files/[id]`, which checks access and redirects to a **5-minute** signed URL. Public
  portfolio media is a separate public bucket.
- Public forms: honeypot, signed minimum-fill-time token, per-IP and per-email rate limits
  (hashed IPs only), length caps, and optional Cloudflare Turnstile.
- Service credentials are read only in server modules marked `import "server-only"`.

## Notifications and email

Every event is first saved as a `notifications` row (shown in the portal/admin) with a unique
`dedupe_key`, then an `email_deliveries` row is queued and sent **after** the response.
Sending uses Resend's `Idempotency-Key`, every attempt and error is recorded, failures show up
in Admin → Settings, and a daily cron plus a "Retry" button re-attempt them. An email failure
never undoes the saved inquiry or submission. Without `RESEND_API_KEY` nothing is sent;
deliveries are recorded as `dev_skipped`.

## Payments and signing

- `src/lib/payments/provider.ts` defines the boundary; `stripe.ts` implements hosted Stripe
  invoices. Only `/api/webhooks/stripe` (signature-verified, idempotent per event) can set
  `status_source = 'provider'`. Clicking a pay link or returning from checkout changes nothing.
- Without Stripe, invoices carry any external payment link; "paid" is a **manual** change that
  requires a reason and is logged and labelled as manual.
- Agreements: upload + external signing link; signed status is manual (reason required) until a
  provider is integrated (`src/lib/signing/provider.ts` documents how).
- The app never sees or stores card details.

## Forms

`src/lib/forms` is a small JSON form DSL shared by the inquiry and the questionnaires:
conditional sections/questions (`showIf` on answers or context such as client type),
"I don't know" answers, and validation that checks required fields **only for visible
questions** and strips hidden answers on submit. Drafts save as you go (debounced autosave plus
a Save button) to the database, so progress survives signing out.
