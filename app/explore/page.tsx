import Link from "next/link";
import {Shell} from "@/components/navigation/shell";
import {OpportunityCard} from "@/components/opportunities/card";
import {SaveButton} from "@/components/opportunities/save-button";
import {EmptyState,SearchBox,Button} from "@/components/ui";
import {FilterSheet} from "@/components/search-filters";
import {supabase,configured} from "@/lib/supabase/server";
import {demoEnabled,demoOpportunities} from "@/lib/demo";
import {filtersSchema} from "@/lib/search/filters";
import type {Opportunity} from "@/types/domain";
export const dynamic="force-dynamic";
export const metadata={title:"Explore opportunities"};
export default async function Explore({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const params=await searchParams,parsed=filtersSchema.safeParse(params),filters=parsed.success?parsed.data:{};
 const page=Math.max(0,Math.min(100,Number(params.page)||0));let items:Opportunity[]=[];
 if(demoEnabled())items=demoOpportunities().filter(o=>(!filters.q||`${o.title} ${o.topics.join(' ')}`.toLowerCase().includes(filters.q.toLowerCase()))&&(!filters.category||o.category===filters.category)&&(!filters.price||filters.price==='free'&&o.is_free)&&(!filters.format||filters.format==='online'&&o.is_online));
 else if(configured()){const db=await supabase();const {data,error}=await db.rpc('search_opportunities',{filters,page_number:page});if(error)throw new Error(error.message);items=data||[];}
 const saved=new Set<string>();const base=new URLSearchParams(Object.entries(filters).filter((x):x is [string,string]=>typeof x[1]==='string'));
 const quick=[['Today','quick','today'],['This week','quick','week'],['Free','price','free'],['Hackathons','category','hackathons'],['Networking','category','networking'],['Workshops','category','workshops'],['Online','format','online'],['Closing soon','quick','closing']];
 return <Shell><div className="page-heading"><div><p className="eyebrow">FOLLOW YOUR CURIOSITY</p><h1>A world of <span>possibility.</span></h1><p className="muted">Find something you didn’t know you were looking for.</p></div></div><div className="search-row"><form className="search-row grow" action="/explore"><SearchBox value={filters.q}/><Button>Search</Button></form><FilterSheet filters={filters}/></div><div className="quick-filters">{quick.map(([label,key,value])=>{const q=new URLSearchParams(base);q.set(key,value);return <Link className="chip" key={label} href={'/explore?'+q}>{label}</Link>;})}<Link href="/explore" className="muted">Clear filters</Link></div>{!parsed.success&&<p className="notice">Some filters were invalid. Please adjust your search.</p>}{!configured()&&!demoEnabled()&&<p className="notice">Connect Supabase to browse live opportunities. No fictional listings are shown in production.</p>}{items.length?<div className="opportunity-grid">{items.map(o=><OpportunityCard key={o.id} opportunity={o} saveControl={!demoEnabled()?<SaveButton id={o.id} saved={saved.has(o.id)}/>:undefined}/>)}</div>:<EmptyState title="No opportunities found."><p>Try removing some filters.</p></EmptyState>}<div className="pagination">{page>0&&<Link className="button secondary" href={'/explore?'+base+'&page='+(page-1)}>← Previous</Link>}{items.length===20&&<Link className="button secondary" href={'/explore?'+base+'&page='+(page+1)}>More opportunities →</Link>}</div></Shell>;
}
