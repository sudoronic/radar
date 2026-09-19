create table public.raw_ingestion(id uuid primary key default gen_random_uuid(),source_id uuid not null references public.sources(id) on delete cascade,source_url text not null,raw_title text not null,raw_data jsonb not null check(octet_length(raw_data::text)<30000),content_hash text not null,fetched_at timestamptz not null default now(),processing_status text not null default 'pending' check(processing_status in ('pending','processed','error')),processing_error text,unique(source_id,content_hash));
create table public.crawl_jobs(id uuid primary key default gen_random_uuid(),source_id uuid references public.sources(id) on delete set null,status text not null default 'running',started_at timestamptz not null default now(),finished_at timestamptz,items_found integer not null default 0);
create table public.crawl_logs(id bigint generated always as identity primary key,source_id uuid references public.sources(id) on delete set null,job_id uuid references public.crawl_jobs(id) on delete cascade,level text not null,message text not null check(length(message)<=1000),created_at timestamptz not null default now());
alter table public.raw_ingestion enable row level security;alter table public.crawl_jobs enable row level security;alter table public.crawl_logs enable row level security;
revoke all on public.raw_ingestion,public.crawl_jobs,public.crawl_logs from anon,authenticated;
grant all on public.raw_ingestion,public.crawl_jobs,public.crawl_logs to service_role;
grant usage,select on all sequences in schema public to service_role;
create index ingestion_pending on public.raw_ingestion(fetched_at) where processing_status='pending';
create index logs_created on public.crawl_logs(created_at);
create index jobs_source on public.crawl_jobs(source_id,started_at desc);
create function public.claim_sources(batch_size integer default 3) returns setof public.sources language plpgsql security invoker set search_path='' as $$
begin
 return query update public.sources s set lease_until=now()+interval '4 minutes',lease_token=gen_random_uuid()
 where id in(select id from public.sources where active and next_refresh_at<=now() and (lease_until is null or lease_until<now()) order by next_refresh_at for update skip locked limit greatest(1,least(batch_size,3))) returning s.*;
end; $$;
revoke all on function public.claim_sources(integer) from public,anon,authenticated;grant execute on function public.claim_sources(integer) to service_role;
-- A single transaction locks each raw candidate, merges duplicates, links evidence, and marks it processed.
create function public.ingest_candidate(raw_id uuid,candidate jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare r public.raw_ingestion;s public.sources;o public.opportunities;oid uuid;org uuid;fp text;candidate_status text;confidence integer;
begin
 select * into r from public.raw_ingestion where id=raw_id for update;
 if r.id is null or r.processing_status<>'pending' then return null;end if;
 select * into s from public.sources where id=r.source_id;
 fp:=candidate->>'fingerprint';
 perform pg_advisory_xact_lock(hashtextextended(fp,0));
 select * into o from public.opportunities where fingerprint=fp or (registration_url=candidate->>'registration_url' and lower(title)=lower(candidate->>'title') and start_at is not distinct from (candidate->>'start_at')::timestamptz) order by created_at limit 1 for update;
 confidence:=least(100,greatest(0,(candidate->>'confidence_score')::integer));
 candidate_status:=case when s.is_official and s.trust_score>=80 and candidate->>'start_at' is not null and candidate->>'registration_url' is not null and (candidate->>'verified')::boolean then 'active' else 'needs_review' end;
 if candidate->>'organizer_name'<>'' then
 insert into public.organizers(name,slug,country,city) values(candidate->>'organizer_name',regexp_replace(lower(candidate->>'organizer_name'),'[^a-z0-9]+','-','g')||'-'||substr(md5(candidate->>'organizer_name'),1,6),candidate->>'country',candidate->>'city') on conflict(slug) do update set name=excluded.name returning id into org;
 end if;
 if o.id is null then
 insert into public.opportunities(slug,title,summary,description,organizer_id,organizer_name,category,topics,country,city,venue,is_online,is_hybrid,start_at,end_at,registration_deadline,registration_url,is_free,price_amount,currency,experience_level,status,confidence_score,fingerprint,last_checked_at,last_verified_at)
 values(candidate->>'slug',candidate->>'title',candidate->>'summary',candidate->>'description',org,candidate->>'organizer_name',candidate->>'category',array(select jsonb_array_elements_text(candidate->'topics')),candidate->>'country',candidate->>'city',candidate->>'venue',(candidate->>'is_online')::boolean,(candidate->>'is_hybrid')::boolean,(candidate->>'start_at')::timestamptz,(candidate->>'end_at')::timestamptz,(candidate->>'registration_deadline')::timestamptz,candidate->>'registration_url',(candidate->>'is_free')::boolean,(candidate->>'price_amount')::numeric,candidate->>'currency','Any',candidate_status,confidence,fp,now(),case when candidate_status='active' then now() end) returning id into oid;
 else
 oid:=o.id;
 -- Untrusted mirrors cannot overwrite a canonical listing or reverse manual moderation.
 if s.trust_score>=o.confidence_score and s.is_official and candidate_status='active' and o.status not in ('cancelled','archived','needs_review') then
 update public.opportunities set title=candidate->>'title',summary=candidate->>'summary',description=candidate->>'description',venue=candidate->>'venue',start_at=(candidate->>'start_at')::timestamptz,end_at=(candidate->>'end_at')::timestamptz,registration_deadline=(candidate->>'registration_deadline')::timestamptz,registration_url=candidate->>'registration_url',last_checked_at=now(),last_verified_at=now(),confidence_score=greatest(confidence_score,confidence) where id=oid;
 end if;
 end if;
 insert into public.opportunity_sources(opportunity_id,source_id,source_url,source_name,source_domain,is_official,trust_score) values(oid,s.id,r.source_url,s.name,s.domain,s.is_official,s.trust_score) on conflict(opportunity_id,source_id) do update set source_url=excluded.source_url,checked_at=now();
 update public.raw_ingestion set processing_status='processed',processing_error=null where id=r.id;
 return oid;
end; $$;
revoke all on function public.ingest_candidate(uuid,jsonb) from public,anon,authenticated;grant execute on function public.ingest_candidate(uuid,jsonb) to service_role;
create function public.maintain_opportunities() returns integer language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
 with changes as (select id,case when coalesce(end_at,start_at)<now()-interval '90 days' then 'archived' when coalesce(end_at,start_at)<now() then 'completed' when registration_deadline<=now() then 'registration_closed' when registration_deadline<=now()+interval '3 days' then 'closing_soon' else 'active' end as next_status from public.opportunities where status not in ('needs_review','discovered','cancelled','archived'))
 update public.opportunities o set status=c.next_status from changes c where o.id=c.id and o.status<>c.next_status;
 get diagnostics affected=row_count;return affected;
end; $$;
revoke all on function public.maintain_opportunities() from public,anon,authenticated;grant execute on function public.maintain_opportunities() to service_role;
create function public.cleanup_ingestion() returns void language plpgsql security invoker set search_path='' as $$
begin
 delete from public.raw_ingestion where id in(select id from public.raw_ingestion where processing_status<>'pending' and fetched_at<now()-interval '7 days' limit 1000);
 delete from public.crawl_logs where id in(select id from public.crawl_logs where created_at<now()-interval '14 days' limit 2000);
 delete from public.crawl_jobs where id in(select id from public.crawl_jobs where started_at<now()-interval '14 days' limit 1000);
end; $$;
revoke all on function public.cleanup_ingestion() from public,anon,authenticated;grant execute on function public.cleanup_ingestion() to service_role;
