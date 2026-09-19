# Radar implementation record

The authoritative brief is preserved in SPECIFICATION.txt. Work proceeds in its eight phases, with typecheck, lint, tests and production build required at each checkpoint.

1. Foundation, authentication and identity RLS — passed typecheck, lint, 2 tests and production build.
2. Core opportunity database and development seed — passed typecheck, lint, 3 tests and production build.
3. Onboarding and deterministic recommendations — passed typecheck, lint, 7 tests and production build.
4. Explore, search, details and saved opportunities — passed typecheck, lint, 8 tests and production build.
5. Source ingestion, normalization, deduplication and schedules — passed typecheck, parser tests, Edge Function checks, and production build.
6. Notifications, calendar, behavior and reports — passed typecheck, RLS action test, lint, tests and production build.
7. Admin and moderation — protected dashboard and source controls implemented; passed typecheck, lint, tests and production build.
8. SEO, performance, accessibility and security verification — metadata, robots, sitemap, RLS, bounded pagination, error states, and free-tier guardrails implemented; final checks passed.

## Environment

Empty local directory; no existing repository. Node 24. No Docker, PostgreSQL server or Supabase CLI preinstalled. SQL is tested using embedded PostgreSQL (PGlite); Supabase-specific hosted extensions and deployed Auth/Edge behavior require a configured Supabase project. No cloud resources are implicitly provisioned.

## Infrastructure constraint discovered

Supabase default SMTP only delivers to preauthorized organization-team email addresses, is rate-limited, and is not for public production email. Under the strict three-provider restriction, public email confirmation and password recovery delivery are a deployment limitation. The implementation must expose real failures and document this; no external email provider may be silently added.
