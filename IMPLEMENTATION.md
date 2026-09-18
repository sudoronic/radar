# Radar implementation record

The authoritative brief is preserved in SPECIFICATION.txt. Work proceeds in its eight phases, with typecheck, lint, tests and production build required at each checkpoint.

1. Foundation, authentication and identity RLS — passed typecheck, lint, 2 tests and production build.
2. Core opportunity database and development seed — passed typecheck, lint, 3 tests and production build.
3. Onboarding and deterministic recommendations — passed typecheck, lint, 7 tests and production build.
4. Explore, search, details and saved opportunities — pending.
5. Source ingestion, normalization, deduplication and schedules — pending.
6. Notifications, calendar, behavior and reports — pending.
7. Admin and moderation — pending.
8. SEO, accessibility, performance and security verification — pending.

## Environment

Empty local directory; no existing repository. Node 24. No Docker, PostgreSQL server or Supabase CLI preinstalled. SQL is tested using embedded PostgreSQL (PGlite); Supabase-specific hosted extensions and deployed Auth/Edge behavior require a configured Supabase project. No cloud resources are implicitly provisioned.

## Infrastructure constraint discovered

Supabase default SMTP only delivers to preauthorized organization-team email addresses, is rate-limited, and is not for public production email. Under the strict three-provider restriction, public email confirmation and password recovery delivery are a deployment limitation. The implementation must expose real failures and document this; no external email provider may be silently added.
