import {worker,client,check} from '../_shared/client.ts';
worker(async()=>{const db=client();const updated=check(await db.rpc('maintain_opportunities')).data;check(await db.rpc('cleanup_ingestion'));return {updated};});
