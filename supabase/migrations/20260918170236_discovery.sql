create table public.saved_opportunities(user_id uuid not null references public.profiles(id) on delete cascade,opportunity_id uuid not null references public.opportunities(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,opportunity_id));
alter table public.saved_opportunities enable row level security;
grant select,insert,delete on public.saved_opportunities to authenticated;
grant all on public.saved_opportunities to service_role;
create policy own_saved on public.saved_opportunities for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.opportunities where id=opportunity_id));
create index saved_recent on public.saved_opportunities(user_id,created_at desc);
create function public.search_opportunities(filters jsonb default '{}',page_number integer default 0) returns setof public.opportunities language sql stable security invoker set search_path='' as $$
 select o.* from public.opportunities o where o.status in ('active','closing_soon','registration_closed')
 and (coalesce(filters->>'q','')='' or o.search_document @@ websearch_to_tsquery('english',left(filters->>'q',200)))
 and (coalesce(filters->>'category','')='' or o.category=filters->>'category')
 and (coalesce(filters->>'city','')='' or lower(o.city)=lower(filters->>'city'))
 and (coalesce(filters->>'country','')='' or o.country=upper(filters->>'country'))
 and (coalesce(filters->>'organizer','')='' or o.organizer_name ilike '%'||left(filters->>'organizer',100)||'%')
 and (coalesce(filters->>'format','')='' or (filters->>'format'='online' and o.is_online) or (filters->>'format'='hybrid' and o.is_hybrid) or (filters->>'format'='in-person' and not o.is_online))
 and (coalesce(filters->>'price','')='' or (filters->>'price'='free' and o.is_free) or (filters->>'price'='paid' and not o.is_free))
 and (coalesce(filters->>'audience','')='' or (filters->>'audience'='student' and o.student_eligible) or (filters->>'audience'='professional' and o.professional_eligible))
 and (coalesce(filters->>'level','')='' or o.experience_level='Any' or o.experience_level=filters->>'level')
 and (coalesce(filters->>'date','')='' or (o.start_at>=(filters->>'date')::date and o.start_at<(filters->>'date')::date+interval '1 day'))
 and (coalesce(filters->>'quick','')<>'today' or (o.start_at>=date_trunc('day',now()) and o.start_at<date_trunc('day',now())+interval '1 day'))
 and (coalesce(filters->>'quick','')<>'week' or (o.start_at>=now() and o.start_at<now()+interval '7 days'))
 and (coalesce(filters->>'quick','')<>'closing' or (o.registration_deadline>now() and o.registration_deadline<now()+interval '3 days'))
 order by case when coalesce(filters->>'q','')<>'' then ts_rank(o.search_document,websearch_to_tsquery('english',filters->>'q')) else 0 end desc,o.start_at nulls last,o.id
 limit 20 offset greatest(0,least(page_number,100))*20;
$$;
grant execute on function public.search_opportunities(jsonb,integer) to anon,authenticated;
create function public.saved_feed(sort_by text default 'recent',page_number integer default 0) returns setof public.opportunities language sql stable security invoker set search_path='' as $$
 select o.* from public.saved_opportunities s join public.opportunities o on o.id=s.opportunity_id where s.user_id=auth.uid()
 order by case when sort_by='deadline' then o.registration_deadline end asc nulls last,case when sort_by='date' then o.start_at end asc nulls last,s.created_at desc,o.id limit 20 offset greatest(0,least(page_number,100))*20;
$$;
revoke all on function public.saved_feed(text,integer) from public,anon;grant execute on function public.saved_feed(text,integer) to authenticated;
