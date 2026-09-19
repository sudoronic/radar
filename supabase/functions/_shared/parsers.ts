import { XMLParser } from 'fast-xml-parser';
import { parseHTML } from 'linkedom';
export type RecordData=Record<string,unknown>;
export const record=(x:unknown):RecordData=>typeof x==='object'&&x!==null&&!Array.isArray(x)?x as RecordData:{};
const array=(x:unknown):unknown[]=>Array.isArray(x)?x:x?[x]:[];
export const text=(x:unknown):string=>typeof x==='string'?x:typeof x==='number'?String(x):'';
function at(x:unknown,path:string):unknown{return path.split('.').reduce<unknown>((v,k)=>record(v)[k],x);}
function mapped(item:unknown,mapping:RecordData){const out:RecordData={};for(const [key,path] of Object.entries(mapping))if(typeof path==='string')out[key]=at(item,path);return out;}
function schemaEvent(item:RecordData):RecordData{
 const location=record(item.location),address=record(location.address),offers=record(array(item.offers)[0]),organizer=record(item.organizer);
 return {title:item.name,description:item.description,organizer_name:organizer.name,organizer_url:organizer.url,source_url:item.url,registration_url:offers.url||item.url,start_at:item.startDate,end_at:item.endDate,registration_deadline:offers.validThrough,city:address.addressLocality,country:address.addressCountry,venue:location.name,is_online:text(item.eventAttendanceMode).includes('Online')||location['@type']==='VirtualLocation',is_hybrid:text(item.eventAttendanceMode).includes('Mixed'),price_amount:offers.price,currency:offers.priceCurrency,is_free:item.isAccessibleForFree,category:item.category};
}
function unfoldIcal(body:string){return body.replace(/\r?\n[ \t]/g,'');}
function icalDate(value:string){if(/^\d{8}$/.test(value))return `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T00:00:00Z`;if(/^\d{8}T\d{6}Z$/.test(value))return `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T${value.slice(9,11)}:${value.slice(11,13)}:${value.slice(13,15)}Z`;return null;}
export function parseSource(body:string,method:string,config:RecordData={}):RecordData[]{
 if(body.length>2_000_000)throw new Error('Source exceeds 2 MB parser limit');
 if(method==='JSON'||method==='PUBLIC_API'){
 const data:unknown=JSON.parse(body),items=config.items_path?at(data,text(config.items_path)):data;
 if(!Array.isArray(items))throw new Error('JSON source must be an array or configure items_path');
 return items.slice(0,100).map(i=>Object.keys(record(config.mapping)).length?mapped(i,record(config.mapping)):record(i));
 }
 if(method==='RSS'){
 if(/<!DOCTYPE|<!ENTITY/i.test(body))throw new Error('XML entities are not supported');
 const parsed=record(new XMLParser({ignoreAttributes:false,parseTagValue:false,processEntities:false}).parse(body));
 const rss=record(record(parsed.rss).channel),feed=record(parsed.feed);
 return array(rss.item||feed.entry).slice(0,100).map(i=>{const v=record(i),link=Array.isArray(v.link)?record(v.link.find(l=>record(l)['@_rel']==='alternate')||v.link[0]):record(v.link);return {title:v.title,description:v.description||v.summary,source_url:text(v.link)||link['@_href'],registration_url:text(v.link)||link['@_href'],start_at:v['ev:startdate']||v.startDate,end_at:v['ev:enddate']||v.endDate,...mapped(v,record(config.mapping))};});
 }
 if(method==='ICAL')return [...unfoldIcal(body).matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)].slice(0,100).map(m=>{
 const fields:Record<string,string>={};for(const line of m[1].split(/\r?\n/)){const p=line.indexOf(':');if(p>0)fields[line.slice(0,p).split(';')[0]]=line.slice(p+1).replaceAll('\\n','\n').replaceAll('\\,',',');}
 return {title:fields.SUMMARY,description:fields.DESCRIPTION,source_url:fields.URL,registration_url:fields.URL,start_at:icalDate(fields.DTSTART||''),end_at:icalDate(fields.DTEND||''),venue:fields.LOCATION,recurrence:fields.RRULE};
 });
 const {document}=parseHTML(body);
 if(method==='JSON_LD'){
 const events:RecordData[]=[];const visit=(v:unknown,depth=0)=>{if(depth>8)return;if(Array.isArray(v)){v.slice(0,100).forEach(x=>visit(x,depth+1));return;}const o=record(v),types=array(o['@type']);if(types.some(t=>typeof t==='string'&&t.endsWith('Event')))events.push(schemaEvent(o));if(o['@graph'])visit(o['@graph'],depth+1);if(o.itemListElement)array(o.itemListElement).forEach(i=>visit(record(i).item||i,depth+1));};
 for(const script of document.querySelectorAll('script[type="application/ld+json"]')){try{visit(JSON.parse(script.textContent||''));}catch{/* A malformed independent script is ignored; empty results fail in worker. */}}
 return events.slice(0,100);
 }
 if(method==='HTML'){
 if(!config.item_selector||!Object.keys(record(config.fields)).length)throw new Error('HTML sources require item_selector and fields CSS selectors');
 return [...document.querySelectorAll(text(config.item_selector))].slice(0,100).map(item=>{const out:RecordData={};for(const [key,spec] of Object.entries(record(config.fields))){const [selector,attr]=text(spec).split('@');const node=selector?item.querySelector(selector):item;out[key]=attr?node?.getAttribute(attr):node?.textContent;}return out;});
 }
 throw new Error('Unsupported source method');
}
