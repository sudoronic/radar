import Link from "next/link";
import {viewer} from "@/lib/data";
import {supabase} from "@/lib/supabase/server";
import {Shell} from "@/components/navigation/shell";
import {OpportunityCard} from "@/components/opportunities/card";
import {SaveButton} from "@/components/opportunities/save-button";
import {EmptyState} from "@/components/ui";
import type {Opportunity} from "@/types/domain";
export const dynamic="force-dynamic";export const metadata={title:'Saved',robots:{index:false,follow:false}};
export default async function Saved({searchParams}:{searchParams:Promise<{sort?:string;page?:string}>}){const {profile,demo}=await viewer();const p=await searchParams;const sort=['date','deadline'].includes(p.sort||'')?p.sort!:'recent',page=Math.max(0,Number(p.page)||0);let items:Opportunity[]=[];if(!demo){const db=await supabase();const {data,error}=await db.rpc('saved_feed',{sort_by:sort,page_number:page});if(error)throw new Error(error.message);items=data||[];}return <Shell city={profile.city} name={profile.name}><div className="page-heading"><div><p className="eyebrow">KEEP THE POSSIBILITIES CLOSE</p><h1>Saved for <span>later.</span></h1><p className="muted">Make your next move when the moment feels right.</p></div></div><div className="quick-filters">{[['recent','Recently saved'],['deadline','Deadline'],['date','Opportunity date']].map(([key,label])=><Link className="chip" href={'/saved?sort='+key} key={key}>{label}</Link>)}</div>{items.length?<div className="opportunity-grid">{items.map(o=><OpportunityCard key={o.id} opportunity={o} saveControl={<SaveButton id={o.id} saved/>}/>)}</div>:<EmptyState title="Save opportunities and they’ll appear here."><Link href="/explore">Find your next opportunity →</Link></EmptyState>}<div className="pagination">{page>0&&<Link href={`/saved?sort=${sort}&page=${page-1}`}>← Previous</Link>}{items.length===20&&<Link href={`/saved?sort=${sort}&page=${page+1}`}>More saved opportunities →</Link>}</div></Shell>;}
