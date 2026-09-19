create table public.student_resources(
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check(kind in ('benefit','program')),
  title text not null check(length(title) between 3 and 160),
  provider text not null check(length(provider)<=120),
  summary text not null check(length(summary)<=500),
  eligibility text not null check(length(eligibility)<=500),
  official_url text not null unique check(official_url ~ '^https://'),
  tags text[] not null default '{}',
  available boolean not null default true,
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.student_resources enable row level security;
grant select on public.student_resources to anon,authenticated;
grant all on public.student_resources to service_role;
create policy student_resources_public_read on public.student_resources for select to anon,authenticated using(available);
create index student_resources_feed on public.student_resources(kind,available,last_verified_at desc);

insert into public.student_resources(slug,kind,title,provider,summary,eligibility,official_url,tags) values
('github-student-developer-pack','benefit','GitHub Student Developer Pack','GitHub Education','A verified student pack that groups developer tools, learning resources, and partner offers in one place.','Students aged 13 or older must verify student status with GitHub Education. Individual partner offers have their own terms.','https://education.github.com/pack/join',array['developer-tools','cloud','learning']),
('azure-for-students','benefit','Azure for Students','Microsoft Azure','Student-focused Azure access for building and learning with cloud services, without requiring a credit card.','Availability and credits depend on Microsoft''s current student verification and regional terms.','https://azure.microsoft.com/en-us/free/students/',array['cloud','developer-tools','ai']),
('canva-for-education','benefit','Canva for Education','Canva','A free education workspace with premium classroom design tools and collaboration features.','Canva Education is for eligible K-12 teachers, schools, and students. College students should check Canva for Campus through their institution.','https://www.canva.com/education/eligibility-guidelines/',array['design','productivity','k-12']),
('microsoft-learn-student-ambassadors','program','Microsoft Learn Student Ambassadors','Microsoft Learn','Build technical skills, lead communities, and access Student Hub resources and rotations.','Open to students. Microsoft describes the current Student Hub entry point as available without an application.','https://learn.microsoft.com/en-us/training/student-hub/become-a-student-ambassador',array['leadership','community','technology']),
('microsoft-imagine-cup','program','Microsoft Imagine Cup','Microsoft','Microsoft''s global student technology and startup competition, linked from the Student Hub.','Check the official competition page for the current season, country availability, rules, and deadlines.','https://imaginecup.microsoft.com/',array['competition','startup','technology'])
on conflict(slug) do update set title=excluded.title,provider=excluded.provider,summary=excluded.summary,eligibility=excluded.eligibility,official_url=excluded.official_url,tags=excluded.tags,available=true,last_verified_at=now(),updated_at=now();
