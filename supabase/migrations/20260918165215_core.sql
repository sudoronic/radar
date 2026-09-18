create table public.countries(code text primary key check(length(code)=2),name text not null);
create table public.cities(id bigint generated always as identity primary key,name text not null,country text not null references public.countries(code),timezone text not null default 'UTC',unique(name,country));
create table public.interests(slug text primary key,name text not null unique);
create table public.categories(slug text primary key,name text not null unique);
create table public.organizers(id uuid primary key default gen_random_uuid(),name text not null,slug text not null unique,website text,logo_url text,description text not null default '',country text,city text,verified boolean not null default false,created_at timestamptz not null default now());
create table public.sources(
 id uuid primary key default gen_random_uuid(),name text not null,domain text not null,base_url text not null unique check(base_url ~ '^https://'),source_type text not null default 'community',
 country text,city text,categories text[] not null default '{}',fetch_method text not null check(fetch_method in ('RSS','ICAL','JSON','JSON_LD','PUBLIC_API','HTML')),
 trust_score integer not null default 50 check(trust_score between 0 and 100),is_official boolean not null default false,
 refresh_interval_minutes integer not null default 1440 check(refresh_interval_minutes>=60),next_refresh_at timestamptz not null default now(),last_checked_at timestamptz,last_success_at timestamptz,last_changed_at timestamptz,
 failure_count integer not null default 0,active boolean not null default false,etag text,last_modified text,content_hash text,
 config jsonb not null default '{}',lease_until timestamptz,lease_token uuid,created_at timestamptz not null default now()
);
create table public.opportunities(
 id uuid primary key default gen_random_uuid(),slug text not null unique,title text not null check(length(title) between 5 and 200),summary text not null default '' check(length(summary)<=600),description text not null default '' check(length(description)<=12000),
 organizer_id uuid references public.organizers(id) on delete set null,organizer_name text not null default '',category text not null references public.categories(slug),topics text[] not null default '{}',
 country text not null default '',city text not null default '',venue text not null default '',latitude numeric check(latitude between -90 and 90),longitude numeric check(longitude between -180 and 180),
 is_online boolean not null default false,is_hybrid boolean not null default false,start_at timestamptz,end_at timestamptz,registration_deadline timestamptz,registration_url text check(registration_url ~ '^https://'),
 price_amount numeric check(price_amount>=0),currency text not null default 'PKR' check(length(currency)=3),is_free boolean not null default false,
 student_eligible boolean not null default true,professional_eligible boolean not null default true,experience_level text not null default 'Any' check(experience_level in ('Beginner','Intermediate','Advanced','Any')),team_required boolean not null default false,
 status text not null default 'discovered' check(status in ('discovered','active','closing_soon','registration_closed','completed','cancelled','archived','needs_review')),
 confidence_score integer not null default 0 check(confidence_score between 0 and 100),fingerprint text unique,is_demo boolean not null default false,
 first_seen_at timestamptz not null default now(),last_verified_at timestamptz,last_checked_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 search_document tsvector,
 check(end_at is null or start_at is null or end_at>=start_at),check(not is_free or coalesce(price_amount,0)=0)
);
create table public.opportunity_sources(
 opportunity_id uuid not null references public.opportunities(id) on delete cascade,source_id uuid not null references public.sources(id) on delete cascade,
 source_url text not null,source_name text not null,source_domain text not null,is_official boolean not null default false,trust_score integer not null,
 checked_at timestamptz not null default now(),primary key(opportunity_id,source_id)
);
create function private.search_document() returns trigger language plpgsql set search_path='' as $$
begin
 new.search_document:=setweight(to_tsvector('english',new.title),'A') || setweight(to_tsvector('english',new.organizer_name||' '||new.category||' '||array_to_string(new.topics,' ')),'B') || setweight(to_tsvector('english',new.city||' '||new.venue||' '||new.summary||' '||new.description),'C');
 new.updated_at:=now();return new;
end; $$;
create trigger opportunity_search before insert or update on public.opportunities for each row execute function private.search_document();
create index opportunities_search on public.opportunities using gin(search_document);
create index opportunities_feed on public.opportunities(status,country,city,category);
create index opportunities_start on public.opportunities(start_at);
create index opportunities_deadline on public.opportunities(registration_deadline);
create index opportunities_organizer on public.opportunities(organizer_id);
create index opportunities_created on public.opportunities(created_at desc);
create index opportunities_updated on public.opportunities(updated_at desc);
create index opportunities_topics on public.opportunities using gin(topics);
create index source_due on public.sources(next_refresh_at) where active;
create index source_relationships on public.opportunity_sources(source_id);
alter table public.countries enable row level security;
grant select on public.countries to anon,authenticated;
create policy public_read on public.countries for select to anon,authenticated using(true);
alter table public.cities enable row level security;
grant select on public.cities to anon,authenticated;
create policy public_read on public.cities for select to anon,authenticated using(true);
alter table public.interests enable row level security;
grant select on public.interests to anon,authenticated;
create policy public_read on public.interests for select to anon,authenticated using(true);
alter table public.categories enable row level security;
grant select on public.categories to anon,authenticated;
create policy public_read on public.categories for select to anon,authenticated using(true);
alter table public.organizers enable row level security;
grant select on public.organizers to anon,authenticated;
create policy public_read on public.organizers for select to anon,authenticated using(true);
alter table public.sources enable row level security;
revoke all on public.sources from anon,authenticated;
alter table public.opportunities enable row level security;
grant select on public.opportunities to anon,authenticated;
create policy public_opportunities on public.opportunities for select to anon,authenticated using(status in ('active','closing_soon','registration_closed','completed','cancelled','archived') and not is_demo);
alter table public.opportunity_sources enable row level security;
grant select on public.opportunity_sources to anon,authenticated;
create policy public_sources on public.opportunity_sources for select to anon,authenticated using(exists(select 1 from public.opportunities o where o.id=opportunity_id));
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
insert into public.interests(slug,name) values ('artificial-intelligence','Artificial Intelligence'),('programming','Programming'),('web-development','Web Development'),('mobile-development','Mobile Development'),('cybersecurity','Cybersecurity'),('data-science','Data Science'),('startups','Startups'),('entrepreneurship','Entrepreneurship'),('business','Business'),('marketing','Marketing'),('finance','Finance'),('design','Design'),('engineering','Engineering'),('science','Science'),('research','Research'),('leadership','Leadership'),('career-development','Career Development');
insert into public.categories(slug,name) values ('hackathons','Hackathons'),('competitions','Competitions'),('workshops','Workshops'),('networking','Networking'),('developer-meetups','Developer Meetups'),('conferences','Conferences'),('career-events','Career Events'),('government-programs','Government Programs'),('scholarships','Scholarships'),('fellowships','Fellowships'),('startup-events','Startup Events'),('bootcamps','Bootcamps'),('webinars','Webinars');
insert into public.countries values ('PK','Pakistan');
insert into public.cities(name,country,timezone) values ('Lahore','PK','Asia/Karachi'),('Islamabad','PK','Asia/Karachi'),('Rawalpindi','PK','Asia/Karachi'),('Karachi','PK','Asia/Karachi'),('Faisalabad','PK','Asia/Karachi');
