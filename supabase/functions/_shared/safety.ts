import {url} from './normalize.ts';
export function publicIp(ip:string){
 if(ip.includes(':'))return /^2[0-9a-f]{3}:/i.test(ip)&&!ip.toLowerCase().startsWith('2001:db8:');
 const n=ip.split('.').map(Number);if(n.length!==4||n.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
 return !(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||n[0]===169&&n[1]===254||n[0]===172&&n[1]>=16&&n[1]<=31||n[0]===192&&(n[1]===168||n[1]===0||n[1]===2)||n[0]===100&&n[1]>=64&&n[1]<=127||n[0]===198&&(n[1]===18||n[1]===19||n[1]===51)||n[0]===203&&n[1]===0);
}
export function robotsAllows(body:string,path:string){
 const groups:{agents:string[];rules:{allow:boolean;path:string}[]}[]=[];let current={agents:[] as string[],rules:[] as {allow:boolean;path:string}[]};
 for(const raw of body.split(/\r?\n/)){const line=raw.split('#')[0].trim(),i=line.indexOf(':');if(i<0)continue;const key=line.slice(0,i).toLowerCase(),value=line.slice(i+1).trim();if(key==='user-agent'){if(current.rules.length){groups.push(current);current={agents:[],rules:[]};}current.agents.push(value.toLowerCase());}else if(['allow','disallow'].includes(key)&&value)current.rules.push({allow:key==='allow',path:value});}
 groups.push(current);const exact=groups.filter(g=>g.agents.includes('radarbot'));const applicable=exact.length?exact:groups.filter(g=>g.agents.includes('*'));
 const rules=applicable.flatMap(g=>g.rules).filter(r=>{const escaped=r.path.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*').replace(/\\\$$/,'$');return new RegExp('^'+escaped).test(path);}).sort((a,b)=>b.path.length-a.path.length||Number(b.allow)-Number(a.allow));return !rules.length||rules[0].allow;
}
export function validateSourceUrl(value:string,domain:string){const safe=url(value);if(!safe||new URL(safe).hostname!==domain.toLowerCase())throw new Error('Source URL must use HTTPS on its registered public domain');return safe;}
