import {client,check} from './client.ts';
import {normalizeCandidate} from './normalize.ts';
import {record} from './parsers.ts';
export async function processBatch(){
 const db=client();const rows=check(await db.from('raw_ingestion').select('*').eq('processing_status','pending').order('fetched_at').limit(20)).data||[];
 const [c,i,s]=await Promise.all([db.from('categories').select('slug'),db.from('interests').select('slug'),db.from('sources').select('*').in('id',[...new Set(rows.map(r=>r.source_id))])]);check(c);check(i);check(s);let processed=0,failed=0;
 for(const row of rows){try{const source=s.data?.find(s=>s.id===row.source_id);if(!source)throw new Error('Source no longer exists');const candidate=await normalizeCandidate(record(row.raw_data),source,c.data!.map(c=>c.slug),i.data!.map(i=>i.slug));check(await db.rpc('ingest_candidate',{raw_id:row.id,candidate}));processed++;}catch(error){failed++;check(await db.from('raw_ingestion').update({processing_status:'error',processing_error:String(error).slice(0,500)}).eq('id',row.id).eq('processing_status','pending'));}}
 return {processed,failed};
}
