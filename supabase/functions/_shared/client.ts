import {createClient} from '@supabase/supabase-js';
export function client(){const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)throw new Error('Missing worker credentials');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function authorized(request:Request){
 if(request.method!=='POST')return false;
 const secret=Deno.env.get('RADAR_CRON_SECRET');if(!secret||secret.length<32)return false;
 const supplied=request.headers.get('x-radar-secret')||'';
 const enc=new TextEncoder();const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(secret)),crypto.subtle.digest('SHA-256',enc.encode(supplied))]);let diff=0;const x=new Uint8Array(a),y=new Uint8Array(b);for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
export function worker(run:()=>Promise<unknown>){Deno.serve(async request=>{if(!await authorized(request))return Response.json({error:'Unauthorized'},{status:401});try{return Response.json(await run());}catch(error){console.error(error instanceof Error?error.message:'Worker error');return Response.json({error:'Worker failed; inspect logs.'},{status:500});}});}
export function check<T extends {error:unknown}>(result:T):T{if(result.error)throw new Error(JSON.stringify(result.error));return result;}
