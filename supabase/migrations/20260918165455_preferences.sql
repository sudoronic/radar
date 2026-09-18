create table public.user_interests(user_id uuid not null references public.profiles(id) on delete cascade,interest_slug text not null references public.interests(slug),primary key(user_id,interest_slug));
create table public.user_categories(user_id uuid not null references public.profiles(id) on delete cascade,category_slug text not null references public.categories(slug),primary key(user_id,category_slug));
create table public.user_preferences(user_id uuid primary key references public.profiles(id) on delete cascade,experience_level text not null default 'Any' check(experience_level in ('Beginner','Intermediate','Advanced','Any')),budget text not null default 'mostly_free' check(budget in ('free','mostly_free','custom','any')),budget_amount numeric check(budget_amount>=0),currency text not null default 'PKR' check(length(currency)=3),include_online boolean not null default true,travel boolean not null default false,weights jsonb not null default '{}',notification_cursor timestamptz not null default '1970-01-01',check(budget<>'custom' or budget_amount is not null));
alter table public.user_interests enable row level security;
grant select,insert,update,delete on public.user_interests to authenticated;
create policy own on public.user_interests for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
alter table public.user_categories enable row level security;
grant select,insert,update,delete on public.user_categories to authenticated;
create policy own on public.user_categories for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
alter table public.user_preferences enable row level security;
grant select,insert,update,delete on public.user_preferences to authenticated;
create policy own on public.user_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create function public.save_preferences(p jsonb,interest_ids text[],category_ids text[]) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if cardinality(interest_ids)<1 or cardinality(category_ids)<1 or cardinality(interest_ids)>30 or cardinality(category_ids)>30 then raise exception 'Choose interests and categories';end if;
 update public.profiles set name=left(p->>'name',100),role=p->>'role',field=left(p->>'field',100),city=left(p->>'city',100),country=left(p->>'country',2),onboarded=true,updated_at=now() where id=auth.uid();
 insert into public.user_preferences(user_id,experience_level,budget,budget_amount,currency,include_online,travel) values(auth.uid(),p->>'experience_level',p->>'budget',(p->>'budget_amount')::numeric,p->>'currency',(p->>'include_online')::boolean,(p->>'travel')::boolean)
 on conflict(user_id) do update set experience_level=excluded.experience_level,budget=excluded.budget,budget_amount=excluded.budget_amount,currency=excluded.currency,include_online=excluded.include_online,travel=excluded.travel;
 delete from public.user_interests where user_id=auth.uid();
 insert into public.user_interests select auth.uid(),unnest(interest_ids);
 delete from public.user_categories where user_id=auth.uid();
 insert into public.user_categories select auth.uid(),unnest(category_ids);
end; $$;
revoke all on function public.save_preferences(jsonb,text[],text[]) from public,anon;
grant execute on function public.save_preferences(jsonb,text[],text[]) to authenticated;
create function public.recommendation_candidates(p_city text,p_country text,p_online boolean,p_travel boolean,p_categories text[],p_interests text[],p_offset integer default 0) returns setof public.opportunities language sql stable security invoker set search_path='' as $$
 select o.* from public.opportunities o where o.status in ('active','closing_soon')
 and (o.registration_deadline is null or o.registration_deadline>now()) and (o.end_at is null or o.end_at>now())
 and ((p_online and o.is_online) or (not o.is_online and ((o.country=p_country and lower(o.city)=lower(p_city)) or p_travel)))
 and (o.category=any(p_categories) or o.topics && p_interests)
 order by o.registration_deadline nulls last,o.id limit 80 offset greatest(0,least(p_offset,800));
$$;
revoke all on function public.recommendation_candidates(text,text,boolean,boolean,text[],text[],integer) from public,anon;
grant execute on function public.recommendation_candidates(text,text,boolean,boolean,text[],text[],integer) to authenticated;
grant all on public.user_preferences,public.user_interests,public.user_categories to service_role;
