import {client,check,worker} from '../_shared/client.ts';
import {checkRobots,safeFetch} from '../_shared/http.ts';

worker(async()=>{
 const db=client();
 const {data,error}=await db.from('resource_sources').select('*').eq('active',true).lte('next_check_at',new Date().toISOString()).order('next_check_at').limit(5);
 check({error});let checked=0,available=0;
 for(const source of data||[]){
  const now=new Date().toISOString();checked++;
  try{
   await checkRobots(source.source_url,source.domain);
   const {response}=await safeFetch(source.source_url,source.domain,{},250_000);
   if(!response.ok)throw new Error(`Official page returned HTTP ${response.status}`);
   const next=new Date(Date.now()+source.refresh_interval_hours*3_600_000).toISOString();
   check(await db.from('student_resources').update({available:true,last_verified_at:now,updated_at:now}).eq('id',source.resource_id));
   check(await db.from('resource_sources').update({last_checked_at:now,last_success_at:now,next_check_at:next,failure_count:0}).eq('id',source.id));available++;
  }catch(error){
   const hours=Math.min(720,source.refresh_interval_hours*2**Math.min(source.failure_count+1,3));
   check(await db.from('resource_sources').update({last_checked_at:now,next_check_at:new Date(Date.now()+hours*3_600_000).toISOString(),failure_count:source.failure_count+1}).eq('id',source.id));
   console.warn(`Resource check failed for ${source.domain}: ${String(error).slice(0,160)}`);
  }
 }
 return {checked,available};
});
