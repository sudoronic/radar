# Radar

**Opportunities find you.** Radar is a personalized opportunity-discovery app built with Next.js App Router, strict TypeScript, Tailwind, Supabase PostgreSQL/Auth/Edge Functions/Cron, and deterministic recommendations. Infrastructure is restricted to GitHub, Vercel Hobby and Supabase Free. Public websites are data sources only.

Implementation is underway; see IMPLEMENTATION.md for phase checkpoints. SPECIFICATION.txt preserves the authoritative brief. No cloud project has been created or deployed.

## Local setup

Use Node 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, and configure the public Supabase URL and publishable key. Keep the service-role key server-only. `NEXT_PUBLIC_SITE_URL` must be your exact app origin, not an untrusted request header.

Run `npm run dev`. Run `npm run check` for typecheck, lint, tests and production build.

## Authentication and the strict free-tier constraint

The auth pages implement Supabase email/password, signup, login, password reset and cookie sessions. On Supabase Free, the built-in email service is restricted to organization-team addresses and is not production email infrastructure. Therefore arbitrary public signup confirmation and forgotten-password email delivery cannot be fully enabled under the requested three-provider-only restriction. Test with authorized team addresses or local Supabase mail capture. Do not claim a successful recovery email when Supabase returns an error. Do not add an external SMTP provider without changing the project constraints.

Official reference: https://supabase.com/docs/guides/auth/auth-smtp
