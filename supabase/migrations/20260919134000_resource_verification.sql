create table public.resource_sources(
 id uuid primary key default gen_random_uuid(),
 resource_id uuid not null unique references public.student_resources(id) on delete cascade,
 source_url text not null unique check(source_url ~ '^https://'),
 domain text not null,
 active boolean not null default true,
 refresh_interval_hours integer not null default 168 check(refresh_interval_hours between 24 and 720),
 next_check_at timestamptz not null default now(),
 last_checked_at timestamptz,
 last_success_at timestamptz,
 failure_count integer not null default 0 check(failure_count>=0),
 created_at timestamptz not null default now()
);
alter table public.resource_sources enable row level security;
revoke all on public.resource_sources from anon,authenticated;
grant all on public.resource_sources to service_role;
create index resource_sources_due on public.resource_sources(next_check_at) where active;

insert into public.resource_sources(resource_id,source_url,domain)
select id,official_url,lower(regexp_replace(regexp_replace(official_url,'^https?://','','i'),'/.*$','')) from public.student_resources
on conflict(resource_id) do update set source_url=excluded.source_url,domain=excluded.domain,active=true;
