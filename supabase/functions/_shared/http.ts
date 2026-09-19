import {publicIp,validateSourceUrl,robotsAllows} from './safety.ts';
async function validateDns(host:string){const results=await Promise.allSettled([Deno.resolveDns(host,'A'),Deno.resolveDns(host,'AAAA')]);const ips=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);if(!ips.length||ips.some(ip=>!publicIp(ip)))throw new Error('Source resolves to a non-public or unavailable address');}
export async function safeFetch(value:string,domain:string,headers:Record<string,string>={},maxBytes=2_000_000){
 let target=validateSourceUrl(value,domain);
 for(let hop=0;hop<4;hop++){
 await validateDns(new URL(target).hostname);
 const response=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(8000),headers:{'User-Agent':'RadarBot/1.0 (public opportunity discovery)',...headers}});
 if([301,302,303,307,308].includes(response.status)){const next=response.headers.get('location');await response.body?.cancel();if(!next)throw new Error('Empty redirect');target=validateSourceUrl(new URL(next,target).href,domain);continue;}
 if(response.status===304)return {response,body:''};
 if(Number(response.headers.get('content-length'))>maxBytes){await response.body?.cancel();throw new Error('Response exceeds size limit');}
 const reader=response.body?.getReader();let size=0,body='';const decoder=new TextDecoder();
 if(reader){while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>maxBytes){await reader.cancel();throw new Error('Response exceeds size limit');}body+=decoder.decode(next.value,{stream:true});}body+=decoder.decode();}
 return {response,body};
 }
 throw new Error('Too many redirects');
}
export async function checkRobots(value:string,domain:string){const u=new URL(value);const {response,body}=await safeFetch(u.origin+'/robots.txt',domain,{},100_000);if(response.status===404)return;if(!response.ok)throw new Error('robots.txt unavailable; retry later');if(!robotsAllows(body,u.pathname+u.search))throw new Error('Source disallowed by robots.txt');}
