import { worker, client, check } from "../_shared/client.ts";
worker(async () => { const db = client(); return { created: check(await db.rpc("generate_notifications")).data }; });
