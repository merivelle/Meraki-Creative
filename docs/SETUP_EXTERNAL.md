# External setup (not done yet: needs your accounts)

Nothing below has been configured or deployed. The code runs locally with only a Supabase
project; every other integration shows as "Not configured" in Admin → Settings and falls back
safely (no emails sent, no automatic payment status).

## 1. Supabase (production project)

Create a **separate** production project from the dev one (e.g. `meraki-prod`).

1. Apply the schema: put its connection string in `SUPABASE_DB_URL` and run `npm run db:push`.
2. Seed site content and questionnaires: `npm run seed:content`.
3. Grant yourself access: see `docs/ADMIN_SETUP.md`.
4. **Authentication → Providers → Email:** turn **off** "Allow new users to sign up" (clients
   are created only by invitation). Keep "Confirm email" on.
5. **Authentication → URL configuration:** Site URL `https://www.merakicreative.co`; add
   `https://www.merakicreative.co/auth/confirm` to the redirect allow-list.
6. **Authentication → Email templates:** paste the three templates from `supabase/templates/`
   (recovery, magic link, email change). They send people to `/auth/confirm` with a token hash.
7. **Authentication → SMTP:** use Resend's SMTP (host `smtp.resend.com`, port 465, user
   `resend`, password = a Resend API key) so auth emails come from your domain.

## 2. Resend

1. Add and verify the domain **merakicreative.co** (DNS records at your registrar). Never use
   the `.com`; that domain belongs to someone else.
2. Create an API key → `RESEND_API_KEY`.
3. `EMAIL_FROM="Meraki Creative <studio@merakicreative.co>"` (any address on the verified domain).
4. `STUDIO_NOTIFY_EMAIL` = where new-inquiry and client-activity alerts go.

## 3. Stripe (optional)

1. `STRIPE_SECRET_KEY` (start with a test key).
2. Add a webhook endpoint `https://www.merakicreative.co/api/webhooks/stripe` for events
   `invoice.paid`, `invoice.voided`, `invoice.marked_uncollectible`; put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
3. Without these, invoices use any external payment link and "paid" is a logged manual change.

## 4. Cloudflare Turnstile (optional)

Create a widget for `www.merakicreative.co` → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY`. The inquiry form also has a honeypot, a timing check, and rate limits.

## 5. Vercel (when you decide to go live)

The current Vercel project serves the old static files. Deploying this branch changes that.

1. Project → Settings → General → Framework Preset: **Next.js** (`vercel.json` also declares it).
2. Add every variable from `.env.example` for Production (and Preview if wanted), using the
   **production** Supabase project. Generate `FORM_SIGNING_SECRET`, `IP_HASH_SALT`, and
   `CRON_SECRET` with `openssl rand -hex 32`.
3. `vercel.json` schedules a daily email-retry job (`/api/cron/email-retry`). Vercel sends
   `CRON_SECRET` automatically.
4. Deploy a Preview first and check it: the old `.html` URLs should redirect, and the
   inquiry form should work end to end.
5. Past Web3Forms submissions: export them (or build a CSV from the emails) and run
   `npm run import-inquiries -- --file inquiries.csv --dry-run`, then without `--dry-run`.
   Once the new site is live, the old Web3Forms key is no longer used and can be deleted
   from web3forms.com.

## 6. Signing provider (later)

Agreements currently use an uploaded file + external signing link, with signed status recorded
manually. To automate it, pick a provider and follow the notes in `src/lib/signing/provider.ts`.
