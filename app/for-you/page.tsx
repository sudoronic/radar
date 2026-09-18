export const dynamic="force-dynamic";
import {SaveButton} from "@/components/opportunities/save-button";
import {savedIds} from "@/lib/data";
import {closingSoon} from "@/lib/utils/dates";
import Link from "next/link";
import {Shell} from "@/components/navigation/shell";
import {OpportunityCard} from "@/components/opportunities/card";
import {EmptyState} from "@/components/ui";
import {viewer,candidates} from "@/lib/data";
import {scoreOpportunity} from "@/lib/recommendations/score";
export const metadata={title:"For You",robots:{index:false,follow:false}};
export default async function ForYou({searchParams}:{searchParams:Promise<{page?:string;tab?:string}>}){
 const {profile,preferences,demo}=await viewer();const params=await searchParams;const page=Math.max(0,Math.min(10,Number(params.page)||0));
 const items=await candidates(profile,preferences,Math.floor(page/4)*80);
 const saved=await savedIds(items.map(o=>o.id));
 let ranked=items.map(o=>({o,match:scoreOpportunity(o,profile,preferences)})).sort((a,b)=>b.match.score-a.match.score);
 if(params.tab==='closing')ranked=ranked.filter(x=>closingSoon(x.o.registration_deadline));
 if(params.tab==='new')ranked.sort((a,b)=>Date.parse(b.o.created_at)-Date.parse(a.o.created_at));
 return <Shell city={profile.city} name={profile.name||'You'}><div className="page-heading"><div><p className="eyebrow">YOUR WORLD, A LITTLE BIGGER</p><h1>Your next <span>what if.</span></h1><p className="muted">Opportunities that fit who you are — and who you could become.</p></div><Link className="button secondary tune" href="/profile">⚙ Tune your Radar</Link></div><div className="radar-summary"><span className="radar-status">◉</span><div><strong>Your Radar is looking out for you</strong><p>Following {preferences.interests.length} interests in {profile.city}{preferences.include_online?' and online':''}. A little less searching, a lot more possibility.</p></div><span className="live-label">● PERSONALIZED</span></div><div className="feed-toolbar"><div className="tabs"><Link className={!params.tab?'selected':''} href="/for-you">Best matches <span>{ranked.length}</span></Link><Link className={params.tab==='closing'?'selected':''} href="/for-you?tab=closing">Closing soon</Link><Link className={params.tab==='new'?'selected':''} href="/for-you?tab=new">New for you</Link></div><span className="muted">Picked for your next step</span></div>{ranked.length?<div className="opportunity-grid">{ranked.slice((page%4)*20,(page%4+1)*20).map(({o,match})=><OpportunityCard key={o.id} opportunity={o} match={match} saveControl={!demo?<SaveButton id={o.id} saved={saved.has(o.id)}/>:undefined}/>)}</div>:<EmptyState title="Nothing strong matches your Radar right now."><p>Broaden your interests, include online opportunities, or explore manually.</p><Link className="button secondary" href="/explore">Explore opportunities</Link></EmptyState>}<div className="feed-end"><span>✧</span><p>A new possibility is always around the corner.</p><Link href="/explore">Explore beyond your Radar →</Link>{(ranked.length>(page%4+1)*20||items.length===80)&&<Link className="button secondary" href={`/for-you?page=${page+1}`}>More opportunities →</Link>}</div></Shell>;
}
