create table public.user_opportunity_actions(id bigint generated always as identity primary key,user_id uuid not null references public.profiles(id) on delete cascade,opportunity_id uuid not null references public.opportunities(id) on delete cascade,action text not null check(action in ('interested','applied','going','not_interested','hide','hide_organizer','registration_clicked')),created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,opportunity_id uuid references public.opportunities(id) on delete cascade,type text not null check(type in ('strong_match','closing_soon','updated','cancelled','venue_changed','registration_opened','saved_organizer')),title text not null check(length(title)<=160),body text not null check(length(body)<=500),read_at timestamptz,created_at timestamptz not null default now());
create table public.reports(id uuid primary key default gen_random_uuid(),opportunity_id uuid not null references public.opportunities(id) on delete cascade,reporter_id uuid references public.profiles(id) on delete set null,reason text not null check(reason in ('wrong_information','expired_registration','suspicious','duplicate','cancelled','incorrect_location')),details text not null default '' check(length(details)<=1000),status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.opportunity_submissions(id uuid primary key default gen_random_uuid(),submitter_id uuid references public.profiles(id) on delete set null,title text not null check(length(title) between 5 and 200),organizer text not null default '',category text not null references public.categories(slug),city text not null default '',event_at timestamptz,registration_deadline timestamptz,registration_url text,source_url text not null check(source_url ~ '^https://'),description text not null default '' check(length(description)<=12000),status text not null default 'needs_review' check(status='needs_review'),created_at timestamptz not null default now());
alter table public.user_opportunity_actions enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.opportunity_submissions enable row level security;
grant select,insert on public.user_opportunity_actions,public.reports to authenticated;
grant select,update on public.notifications to authenticated;
grant all on public.user_opportunity_actions,public.notifications,public.reports to service_role;
grant insert,select on public.opportunity_submissions to authenticated; grant all on public.opportunity_submissions to service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;
create policy actions_own on public.user_opportunity_actions for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy notifications_own on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_read on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reports_insert on public.reports for insert to authenticated with check(reporter_id=(select auth.uid()));
create policy reports_own on public.reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy submissions_insert on public.opportunity_submissions for insert to authenticated with check(submitter_id=(select auth.uid()));
create policy submissions_own on public.opportunity_submissions for select to authenticated using(submitter_id=(select auth.uid()));
create index actions_user_opportunity on public.user_opportunity_actions(user_id,opportunity_id,created_at desc);
create index notifications_unread on public.notifications(user_id,created_at desc) where read_at is null;
create index reports_open on public.reports(status,created_at);
create function public.record_action(p_opportunity_id uuid,p_action text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or p_action not in ('interested','applied','going','not_interested','hide','hide_organizer','registration_clicked') then raise exception 'Invalid action'; end if;
 if not exists(select 1 from public.opportunities where id=p_opportunity_id) then raise exception 'Opportunity not found'; end if;
 insert into public.user_opportunity_actions(user_id,opportunity_id,action) values(auth.uid(),p_opportunity_id,p_action);
 if p_action in ('interested','applied','going') then insert into public.saved_opportunities(user_id,opportunity_id) values(auth.uid(),p_opportunity_id) on conflict do nothing;end if;
 update public.user_preferences set weights=jsonb_set(weights,array['last_action'],to_jsonb(p_action),true) where user_id=auth.uid();
end; $$;
revoke all on function public.record_action(uuid,text) from public,anon; grant execute on function public.record_action(uuid,text) to authenticated;
create function public.generate_notifications() returns integer language plpgsql security invoker set search_path='' as $$
declare count_created integer; begin
 insert into public.notifications(user_id,opportunity_id,type,title,body)
 select s.user_id,o.id,'closing_soon','Registration closes soon',o.title||' closes within three days.'
 from public.saved_opportunities s join public.opportunities o on o.id=s.opportunity_id
 where o.registration_deadline>now() and o.registration_deadline<now()+interval '3 days'
 and not exists(select 1 from public.notifications n where n.user_id=s.user_id and n.opportunity_id=o.id and n.type='closing_soon' and n.created_at>now()-interval '24 hours');
 get diagnostics count_created=row_count; return count_created; end; $$;
revoke all on function public.generate_notifications() from public,anon,authenticated; grant execute on function public.generate_notifications() to service_role;
