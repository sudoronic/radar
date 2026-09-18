import type {Opportunity,Preferences,Profile} from "@/types/domain";
export const WEIGHTS={category:30,interest:25,city:15,experience:10,audience:10,budget:5,format:5,closed:100,wrongAudience:30,wrongCity:20,lowTrust:10,stale:20} as const;
export function scoreOpportunity(o:Opportunity,p:Profile,prefs:Preferences,now=Date.now()) {
 let score=0;const reasons:string[]=[];const add=(points:number,reason:string)=>{score+=points;reasons.push(reason);};
 if(prefs.categories.includes(o.category)) add(WEIGHTS.category,"A category you follow");
 const topics=o.topics.filter(t=>prefs.interests.includes(t));
 if(topics.length) add(WEIGHTS.interest,`${topics[0].replaceAll("-"," ")} interest`);
 if(o.city.toLowerCase()===p.city.toLowerCase()&&o.country===p.country) add(WEIGHTS.city,`In ${o.city}`);
 else if(!o.is_online&&!prefs.travel) score-=WEIGHTS.wrongCity;
 if(prefs.experience_level==="Any"||o.experience_level==="Any"||o.experience_level===prefs.experience_level) add(WEIGHTS.experience,"Fits your experience");
 const eligible=p.role==="Student"?o.student_eligible:o.professional_eligible;
 if(eligible) add(WEIGHTS.audience,p.role==="Student"?"Students welcome":"Open to professionals"); else score-=WEIGHTS.wrongAudience;
 const budget=prefs.budget==="any"||o.is_free||(prefs.budget==="custom"&&o.currency===prefs.currency&&o.price_amount!==null&&o.price_amount<=Number(prefs.budget_amount));
 if(budget) add(WEIGHTS.budget,o.is_free?"Free to join":"Within your budget");
 if(!o.is_online||prefs.include_online) score+=WEIGHTS.format;
 if(o.confidence_score<50) score-=WEIGHTS.lowTrust;
 if(!o.last_verified_at||now-Date.parse(o.last_verified_at)>30*86400000) score-=WEIGHTS.stale;
 const learned=[o.category,...o.topics].reduce((sum,key)=>sum+(prefs.weights[key]||0),0);
 score+=Math.max(-10,Math.min(10,learned));
 if(!['active','closing_soon'].includes(o.status)||(o.registration_deadline&&Date.parse(o.registration_deadline)<=now)) score-=WEIGHTS.closed;
 return {score:Math.max(0,Math.min(100,Math.round(score))),reasons};
}
