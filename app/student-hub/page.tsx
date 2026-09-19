import { Shell } from "@/components/navigation/shell";
import { Chip, EmptyState } from "@/components/ui";
import { configured, supabase } from "@/lib/supabase/server";
import type { StudentResource } from "@/types/domain";
import { dateLabel } from "@/lib/utils/dates";
export const dynamic = "force-dynamic";
export const metadata = { title: "Student Hub", description: "Official student benefits and current programs, checked by Radar." };

export default async function StudentHub(){
 let resources:StudentResource[]=[];
 if(configured()){const {data,error}=await (await supabase()).from("student_resources").select("*").eq("available",true).order("last_verified_at",{ascending:false});if(error)throw new Error(error.message);resources=(data||[]) as StudentResource[];}
 const benefits=resources.filter(item=>item.kind==="benefit"),programs=resources.filter(item=>item.kind==="program");
 const cards=(items:StudentResource[])=>items.map(item=><article className="student-card" key={item.id}><div className="student-card-top"><span className={item.kind==="benefit"?"resource-mark benefit":"resource-mark program"}>{item.kind==="benefit"?"✦ PERK":"◎ NOW OPEN"}</span><span className="verified">Official link</span></div><h2>{item.title}</h2><p className="provider">{item.provider}</p><p>{item.summary}</p><p className="eligibility"><strong>Who can use it:</strong> {item.eligibility}</p><div className="tags">{item.tags.map(tag=><Chip key={tag}>{tag}</Chip>)}</div><footer><span>Checked {dateLabel(item.last_verified_at)}</span><a className="button" href={item.official_url} target="_blank" rel="noopener noreferrer">See official page ↗</a></footer></article>);
 return <Shell><div className="page-heading"><div><p className="eyebrow">STUDENT POWER-UPS</p><h1>More for your <span>student life.</span></h1><p className="muted">Official benefits and active programs in one place. Radar links you to the provider — it does not resell, claim, or alter their offer.</p></div></div>{resources.length?<><section className="student-section"><div className="section-title"><div><p className="eyebrow">FREE & STUDENT-ONLY</p><h2>Student offers</h2></div><span>{benefits.length} verified</span></div><div className="student-grid">{cards(benefits)}</div></section><section className="student-section"><div className="section-title"><div><p className="eyebrow">BUILD, LEAD & COMPETE</p><h2>Programs happening now</h2></div><span>{programs.length} verified</span></div><div className="student-grid">{cards(programs)}</div></section></>:<EmptyState title="The Student Hub is being verified."><p>Radar only shows offers after an official provider page has been checked.</p></EmptyState>}</Shell>;
}
