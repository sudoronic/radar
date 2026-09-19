# Radar

**Opportunities find you.** Radar is a personalized opportunity-discovery app built with Next.js App Router, strict TypeScript, Tailwind, Supabase PostgreSQL/Auth/Edge Functions/Cron, and deterministic recommendations. Infrastructure is restricted to GitHub, Vercel Hobby and Supabase Free. Public websites are data sources only.

Implementation status is tracked in [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md). SPECIFICATION.txt preserves the authoritative brief. The production app is deployed on Vercel and uses the connected Supabase project.

## Local setup

Use Node 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, and configure the public Supabase URL and publishable key. Keep the service-role key server-only. `NEXT_PUBLIC_SITE_URL` must be your exact app origin, not an untrusted request header.

Run `npm run dev`. Run `npm run check` for typecheck, lint, tests and production build.

## Authentication and the strict free-tier constraint

The auth pages implement Supabase email/password, signup, login, password reset and cookie sessions. On Supabase Free, the built-in email service is restricted to organization-team addresses and is not production email infrastructure. Therefore arbitrary public signup confirmation and forgotten-password email delivery cannot be fully enabled under the requested three-provider-only restriction. Test with authorized team addresses or local Supabase mail capture. Do not claim a successful recovery email when Supabase returns an error. Do not add an external SMTP provider without changing the project constraints.

Official reference: https://supabase.com/docs/guides/auth/auth-smtp

## Database and jobs

Apply committed migrations in order with `supabase db push` after linking a project. Load `supabase/seed.sql` only for local development; all seed opportunities are explicitly fictional and hidden from public production reads. Deploy the Edge Functions in `supabase/functions`, set `RADAR_CRON_SECRET`, and store `radar_project_url` plus `radar_cron_secret` in Supabase Vault. The committed Cron jobs begin inactive; activate them only after deployment and a manual source test.

Sources are registry-managed. Add structured JSON, RSS, iCal, JSON-LD, public API, or deliberately configured HTML sources in the admin area. The worker respects robots rules, same-domain HTTPS redirects, response limits, conditional requests, and backoff. Public submissions go to `needs_review`. Student benefits and programs use a separate `resource_sources` registry: Radar checks each provider's official page weekly, refreshes the verification date when it remains available, and backs off after failures. It does not invent, rewrite, or publish a new offer from an unverified page.

## Deployment and security

Push to GitHub and connect the repository to Vercel. Set only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in Vercel. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; it is for Edge Functions/admin server actions and never a public variable. Apply RLS migrations before enabling public traffic. Assign administrators directly in the private `admin_roles` table; browser-editable user metadata never grants administration.

Recommendation scoring is deterministic: categories, interests, city, experience, eligibility, price and format add points; closed, wrong-audience, wrong-location, low-confidence and stale listings subtract points. See `lib/recommendations/score.ts`. See [FREE_TIER.md](FREE_TIER.md) for operational limits.
