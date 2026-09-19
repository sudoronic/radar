import {client,check,worker} from '../_shared/client.ts';
import {checkRobots,safeFetch} from '../_shared/http.ts';
import {parseSource,record} from '../_shared/parsers.ts';
import {hash,url} from '../_shared/normalize.ts';
import {processBatch} from '../_shared/process.ts';
worker(async()=>{
 const db=client(),sources=check(await db.rpc('claim_sources',{batch_size:3})).data||[];let fetched=0,unchanged=0,failed=0;
 for(const source of sources){const job=check(await db.from('crawl_jobs').insert({source_id:source.id}).select('id').single()).data!;
 try{
 await checkRobots(source.base_url,source.domain);
 const headers:Record<string,string>={};if(source.etag)headers['If-None-Match']=source.etag;if(source.last_modified)headers['If-Modified-Since']=source.last_modified;
 const {response,body}=await safeFetch(source.base_url,source.domain,headers);
 if(response.status!==304&&!response.ok)throw new Error('Source returned HTTP '+response.status);
 const digest=response.status===304?source.content_hash:await hash(body);let count=0;
 if(response.status===304||digest===source.content_hash){unchanged++;}
 else {
 const candidates=parseSource(body,source.fetch_method,record(source.config));if(!candidates.length)throw new Error('No candidates found; check parser configuration');
 const rows=await Promise.all(candidates.slice(0,40).map(async c=>{const compact=JSON.stringify(c);if(compact.length>25000)throw new Error('Candidate too large');return {source_id:source.id,source_url:url(c.source_url,source.base_url)||source.base_url,raw_title:String(c.title||'').slice(0,200),raw_data:c,content_hash:await hash(compact)};}));
 check(await db.from('raw_ingestion').upsert(rows,{onConflict:'source_id,content_hash',ignoreDuplicates:true}));count=rows.length;fetched++;
 }
 const now=new Date().toISOString();check(await db.from('sources').update({etag:response.headers.get('etag')||source.etag,last_modified:response.headers.get('last-modified')||source.last_modified,content_hash:digest,last_checked_at:now,last_success_at:now,last_changed_at:digest!==source.content_hash?now:source.last_changed_at,failure_count:0,next_refresh_at:new Date(Date.now()+source.refresh_interval_minutes*60000).toISOString(),lease_until:null,lease_token:null}).eq('id',source.id).eq('lease_token',source.lease_token));
 check(await db.from('crawl_jobs').update({status:'success',items_found:count,finished_at:now}).eq('id',job.id));
 }catch(error){failed++;const message=String(error).slice(0,500);check(await db.from('crawl_logs').insert({source_id:source.id,job_id:job.id,level:'error',message}));check(await db.from('crawl_jobs').update({status:'failed',finished_at:new Date().toISOString()}).eq('id',job.id));check(await db.from('sources').update({failure_count:source.failure_count+1,last_checked_at:new Date().toISOString(),next_refresh_at:new Date(Date.now()+Math.min(7*1440,source.refresh_interval_minutes*2**Math.min(source.failure_count+1,8))*60000).toISOString(),lease_until:null,lease_token:null}).eq('id',source.id).eq('lease_token',source.lease_token));}
 }
 return {fetched,unchanged,failed,processing:await processBatch()};
});
