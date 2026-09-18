import {NextResponse} from "next/server";
import {supabase} from "@/lib/supabase/server";
import {publicUrl} from "@/lib/utils/url";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const db=await supabase();const {data,error}=await db.from('opportunities').select('registration_url,status,is_demo,registration_deadline').eq('id',id).maybeSingle();const url=data?.registration_url?publicUrl(data.registration_url):null;if(error||!url||data?.is_demo||!['active','closing_soon'].includes(data?.status||'')||(data?.registration_deadline&&Date.parse(data.registration_deadline)<=Date.now()))return NextResponse.json({error:'Registration is unavailable.'},{status:404});return NextResponse.redirect(url,302);}
