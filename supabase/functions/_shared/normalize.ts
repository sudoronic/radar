import {record,text,type RecordData} from './parsers.ts';
export const normalizeText=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export async function hash(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function url(value:unknown,base?:string){try{const u=new URL(text(value),base);if(!text(value)||u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/\.(local|localhost|internal)$/.test(u.hostname))return null;u.hash='';for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_')||['fbclid','gclid'].includes(key))u.searchParams.delete(key);u.searchParams.sort();return u.href;}catch{return null;}}
export async function fingerprint(title:string,organizer:string,start:string|null,city:string){return hash([normalizeText(title),normalizeText(organizer),start?.slice(0,10)||'',normalizeText(city)].join('|'));}
function date(value:unknown){const s=text(value);if(!s||!/^\d{4}-\d{2}-\d{2}(T.*(?:Z|[+-]\d{2}:?\d{2}))?$/.test(s))return null;const t=Date.parse(s);return Number.isFinite(t)?new Date(t).toISOString():null;}
function clean(value:unknown,max:number){return text(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
export async function normalizeCandidate(raw:RecordData,source:{base_url:string;domain:string;city:string|null;country:string|null;categories:string[];trust_score:number;is_official:boolean},categories:string[],interests:string[]){
 const title=clean(raw.title,200);if(title.length<5)throw new Error('A usable title is required');
 const description=clean(raw.description,12000),organizer_name=clean(raw.organizer_name,150),city=clean(raw.city||source.city,100),country=clean(raw.country||source.country,2).toUpperCase();
 const start_at=date(raw.start_at),end_at=date(raw.end_at),registration_deadline=date(raw.registration_deadline);
 if(start_at&&end_at&&end_at<start_at)throw new Error('End precedes start');
 const registration_url=url(raw.registration_url,source.base_url),source_url=url(raw.source_url,source.base_url)||source.base_url;
 const cat=normalizeText(text(raw.category)).replaceAll(' ','-');const category=categories.includes(cat)?cat:source.categories.find(c=>categories.includes(c))||categories.find(c=>normalizeText(title+' '+description).includes(c.replaceAll('-',' ').replace(/s$/,'')));
 if(!category)throw new Error('No supported category; configure source defaults');
 const combined=normalizeText(title+' '+description),topics=interests.filter(i=>combined.includes(i.replaceAll('-',' '))||Array.isArray(raw.topics)&&raw.topics.includes(i));
 const price=raw.price_amount===null||raw.price_amount===undefined||raw.price_amount===''?null:Number(raw.price_amount);if(price!==null&&(!Number.isFinite(price)||price<0))throw new Error('Invalid price');
 const is_free=raw.is_free===true||raw.is_free==='true'||price===0;
 const fp=await fingerprint(title,organizer_name,start_at,city);
 const verified=!!start_at&&!!registration_url&&new URL(registration_url).hostname===source.domain&&source.is_official&&source.trust_score>=80&&!raw.recurrence;
 return {title,summary:description.slice(0,300),description,organizer_name,category,topics,country,city,venue:clean(raw.venue,300),is_online:raw.is_online===true||raw.is_online==='true',is_hybrid:raw.is_hybrid===true||raw.is_hybrid==='true',start_at,end_at,registration_deadline,registration_url,source_url,price_amount:is_free?0:price,is_free,currency:clean(raw.currency||'PKR',3).toUpperCase(),fingerprint:fp,slug:normalizeText(title).replaceAll(' ','-').slice(0,70)+'-'+fp.slice(0,10),confidence_score:source.trust_score,verified,extra:record(raw.extra)};
}
