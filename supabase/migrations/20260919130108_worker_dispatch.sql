-- The prior scheduling migration could not be applied because hosted cron job
-- records are not directly updateable.  Install only the guarded dispatcher
-- here; create schedules after Vault secrets are configured and a manual
-- source run has succeeded.
do $$ begin
if exists(select 1 from pg_extension where extname='pg_net') and exists(select 1 from pg_extension where extname='supabase_vault') then
execute $fn$
create or replace function private.dispatch_worker(worker_name text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $worker$
declare
  project_url text;
  worker_secret text;
  request_id bigint;
begin
  if worker_name not in ('fetch-source', 'process-opportunities', 'update-statuses', 'generate-notifications', 'verify-student-resources') then
    raise exception 'Unknown worker';
  end if;

  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'radar_project_url' limit 1;
  select decrypted_secret into worker_secret from vault.decrypted_secrets where name = 'radar_cron_secret' limit 1;
  if project_url is null or worker_secret is null then
    raise exception 'Radar worker Vault secrets have not been configured';
  end if;

  select net.http_post(
    url := project_url || '/functions/v1/' || worker_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-radar-secret', worker_secret),
    body := '{}'::jsonb
  ) into request_id;
  return request_id;
end;
$worker$;

revoke all on function private.dispatch_worker(text) from public, anon, authenticated;
$fn$;
end if;
end $$;
