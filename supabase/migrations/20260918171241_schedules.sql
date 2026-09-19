-- Hosted Supabase extensions; schedules remain disabled until secrets are configured.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;
create function private.dispatch_worker(worker_name text) returns bigint language plpgsql security definer set search_path='' as $$
declare endpoint text;secret text;request_id bigint;
begin
 if worker_name not in ('fetch-source','process-opportunities','update-statuses','generate-notifications') then raise exception 'Unknown worker';end if;
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='radar_project_url' limit 1;
 select decrypted_secret into secret from vault.decrypted_secrets where name='radar_cron_secret' limit 1;
 if endpoint is null or secret is null then raise exception 'Configure Radar Vault secrets before enabling schedules';end if;
 select net.http_post(url:=endpoint||'/functions/v1/'||worker_name,headers:=jsonb_build_object('Content-Type','application/json','x-radar-secret',secret),body:='{}'::jsonb,timeout_milliseconds:=100000) into request_id;
 return request_id;
end; $$;
revoke all on function private.dispatch_worker(text) from public,anon,authenticated;
select cron.schedule('refresh_due_sources','5 * * * *',$$select private.dispatch_worker('fetch-source');$$);
select cron.schedule('process_ingestion_backlog','20 * * * *',$$select private.dispatch_worker('process-opportunities');$$);
select cron.schedule('update_statuses_and_archive','35 * * * *',$$select private.dispatch_worker('update-statuses');$$);
select cron.schedule('generate_user_notifications','45 */6 * * *',$$select private.dispatch_worker('generate-notifications');$$);
select cron.schedule('cleanup_ingestion_data','10 3 * * *',$$select public.cleanup_ingestion(); delete from cron.job_run_details where end_time<now()-interval '14 days';$$);
update cron.job set active=false where jobname in ('refresh_due_sources','process_ingestion_backlog','update_statuses_and_archive','generate_user_notifications','cleanup_ingestion_data');
