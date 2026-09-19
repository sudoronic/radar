import Link from "next/link";
import { Shell } from "@/components/navigation/shell";
import { viewer } from "@/lib/data";
import { supabase } from "@/lib/supabase/server";
export const dynamic="force-dynamic"; export const metadata={title:"Notifications",robots:{index:false,follow:false}};
export default async function Notifications(){const {profile}=await viewer();const db=await supabase();const {data,error}=await db.from("notifications").select("*").eq("user_id",profile.id).order("created_at",{ascending:false}).limit(50);if(error)throw new Error(error.message);return <Shell city={profile.city} name={profile.name}><div className="page-heading"><div><p className="eyebrow">STAY IN THE LOOP</p><h1>What changed.</h1></div></div>{data?.length?<div className="list-card">{data.map(n=><article key={n.id} className={n.read_at?"notification":"notification unread"}><strong>{n.title}</strong><p>{n.body}</p>{n.opportunity_id&&<Link href="/saved">View opportunity →</Link>}</article>)}</div>:<p className="notice">You’re all caught up. New strong matches and changes will appear here.</p>}</Shell>;}
