import {expect,test} from 'vitest';
import {parseSource} from '../supabase/functions/_shared/parsers';
import {fingerprint,normalizeCandidate,url} from '../supabase/functions/_shared/normalize';
import {robotsAllows,publicIp,validateSourceUrl} from '../supabase/functions/_shared/safety';
test('fingerprints normalize punctuation and whitespace',async()=>{expect(await fingerprint(' AI: Hackathon! ','LAB','2026-10-10','Lahore')).toBe(await fingerprint('ai hackathon','lab','2026-10-10',' lahore '));});
test('JSON mapping, RSS, iCal, JSON-LD and configured HTML parse candidates',()=>{
 expect(parseSource('{"items":[{"name":"Buildathon"}]}','JSON',{items_path:'items',mapping:{title:'name'}})[0].title).toBe('Buildathon');
 expect(parseSource('<rss><channel><item><title>Workshop</title><link>https://example.org/a</link></item></channel></rss>','RSS')[0].title).toBe('Workshop');
 expect(parseSource('BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Workshop\nDTSTART:20261010T100000Z\nEND:VEVENT\nEND:VCALENDAR','ICAL')[0].start_at).toBe('2026-10-10T10:00:00Z');
 expect(parseSource('<script type="application/ld+json">{"@graph":[{"@type":"Event","name":"Buildathon"}]}</script>','JSON_LD')[0].title).toBe('Buildathon');
 expect(parseSource('<article><h2>Buildathon</h2><a href="/apply">Join</a></article>','HTML',{item_selector:'article',fields:{title:'h2',registration_url:'a@href'}})[0].registration_url).toBe('/apply');
});
test('incomplete dates stay unverified and trackers do not create distinct URLs',async()=>{
 const source={base_url:'https://example.org/events',domain:'example.org',city:'Lahore',country:'PK',categories:['workshops'],trust_score:90,is_official:true};
 const result=await normalizeCandidate({title:'Test workshop',registration_url:'https://example.org/apply?utm_source=rss'},source,['workshops'],[]);expect(result.verified).toBe(false);expect(result.registration_url).toBe('https://example.org/apply');
 expect(url('https://127.0.0.1')).toBeNull();expect(()=>validateSourceUrl('https://evil.org','example.org')).toThrow();
});
test('crawler honors robots and rejects internal IP ranges',()=>{
 expect(robotsAllows('User-agent: *\nDisallow: /private\nAllow: /private/public','/private/a')).toBe(false);
 expect(robotsAllows('User-agent: *\nDisallow: /private\nAllow: /private/public','/private/public/a')).toBe(true);
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.0.1','::1','fc00::1'])expect(publicIp(ip)).toBe(false);
 expect(publicIp('8.8.8.8')).toBe(true);
 expect(()=>parseSource('<!DOCTYPE x><rss/>','RSS')).toThrow();
});
