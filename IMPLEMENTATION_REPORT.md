# Radar implementation report

## Live and verified

- The public website is deployed at https://radar-metaronics.vercel.app.
- Student Hub is cached for one hour and loads from public, RLS-protected Supabase data.
- Five provider resources are tracked. The weekly verification worker was deployed and its first run verified four provider pages; failures retain the existing resource and use backoff.
- Four low-frequency worker schedules are active for source processing, status maintenance, and notifications.

## Data-quality rules

- Radar treats only explicitly registered official providers as automatic sources.
- Source fetching has robots checks, HTTPS validation, redirect restrictions, response-size limits, conditional requests, and exponential backoff.
- A provider failure never fabricates a replacement offer or overwrites verified copy.
- External registration links remain evidence links; Radar does not claim ownership of an event merely because it indexes it.

## Remaining operational work

The GitHub Education event catalogue is an official HTML registry. Its production collector needs publishing as an Edge Function before that source is activated. Keep it disabled until the function is deployed and its first run produces valid candidates. This prevents a broken source from consuming free-tier capacity or exposing incomplete records.

## Everyday usefulness roadmap

1. Add one official source at a time, inspect its first result, then activate it.
2. Grow coverage around a student's city, university communities, and online programs before adding broad global feeds.
3. Let users save events, get deadline notifications, and use the calendar as their daily planning view.
4. Review source failures weekly in `/admin` and remove stale providers instead of silently keeping dead links.
