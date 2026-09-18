import type {Opportunity,Status} from "@/types/domain";
export function dateLabel(value:string|null){return value?new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(value)):"Date to be confirmed";}
export function deadline(value:string|null,now=Date.now()){
 if(!value)return "No deadline listed"; const diff=Date.parse(value)-now;
 if(diff<=0)return "Registration closed";
 const days=Math.ceil(diff/86400000);return days===1?"Less than 1 day left":`${days} days left`;
}
export function statusAt(o:Pick<Opportunity,'status'|'start_at'|'end_at'|'registration_deadline'>,now=Date.now()):Status{
 if(['cancelled','needs_review','discovered','archived'].includes(o.status))return o.status;
 const end=o.end_at||o.start_at;
 if(end&&Date.parse(end)<now-90*86400000)return 'archived';
 if(end&&Date.parse(end)<now)return 'completed';
 if(o.registration_deadline&&Date.parse(o.registration_deadline)<=now)return 'registration_closed';
 if(o.registration_deadline&&Date.parse(o.registration_deadline)<=now+3*86400000)return 'closing_soon';
 return 'active';
}

export function closingSoon(value:string|null,now=Date.now()){return !!value&&Date.parse(value)>now&&Date.parse(value)<now+3*86400000;}
