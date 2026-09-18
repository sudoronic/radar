create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check(length(name)<=100),
 role text not null default 'Student' check(role in ('Student','Professional','Founder','Freelancer','Other')),
 field text not null default '' check(length(field)<=100),
 city text not null default '', country text not null default '',
 onboarded boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table private.admin_roles(user_id uuid primary key references auth.users(id) on delete cascade);
alter table private.admin_roles enable row level security;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.admin_roles where user_id=auth.uid());
$$;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
create function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select private.is_admin(); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
alter table public.profiles enable row level security;
grant select,insert,update,delete on public.profiles to authenticated;
create policy profiles_own on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id); return new; end; $$;
revoke all on function private.new_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_profile();
