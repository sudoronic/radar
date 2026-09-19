# Free-tier guardrails

Radar uses GitHub, Vercel Hobby and Supabase Free only. Do not add paid APIs, hosted crawlers, external analytics, external email, or copied event media without revisiting that constraint.

- Source registry entries are checked only when due. Keep ordinary sources at four hours or longer.
- The worker claims at most three sources, fetches no more than 2 MB per response, parses at most 100 candidates, and inserts at most 40 compact records per source run.
- Conditional ETag and Last-Modified requests plus a content hash skip unchanged content.
- Do not precompute user-opportunity matches; PostgreSQL selects a limited candidate set and TypeScript scores it at request time.
- Raw ingestion expires after seven days; crawler logs and job history expire after fourteen days.
- Use 20-item pages. Avoid polling and real-time subscriptions.
- Review Supabase database/egress/function usage, Vercel function usage, and GitHub Actions minutes before broadening source coverage.
- Cron schedules are committed inactive. Configure Vault secrets, deploy functions, then activate them deliberately.
- Student-resource verification checks at most five official provider pages per run, normally once a week. A failed provider page is retried with exponential backoff and never replaces its verified description automatically.
