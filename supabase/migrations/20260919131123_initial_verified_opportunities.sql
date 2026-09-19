-- Initial production catalogue: each listing was checked against GitHub
-- Education's official events registry on 2026-09-19. The source is stored
-- inactive because this dynamic page needs a reviewed parser configuration
-- before automatic ingestion is enabled.
insert into public.sources(name,domain,base_url,source_type,fetch_method,country,categories,trust_score,is_official,active,config)
values('GitHub Education Events','education.github.com','https://education.github.com/events?q=student','official_registry','JSON_LD','PK',array['hackathons','conferences','workshops'],95,true,false,'{}'::jsonb)
on conflict(base_url) do update set name=excluded.name,trust_score=excluded.trust_score,is_official=true,last_checked_at=now(),last_success_at=now();

insert into public.opportunities(slug,title,summary,description,organizer_name,category,topics,country,city,venue,is_online,start_at,registration_url,is_free,status,confidence_score,fingerprint,last_checked_at,last_verified_at)
values
('geminithon-2026','Geminithon 2026','A hybrid AI and cloud innovation hackathon for students, developers, designers, and builders across Pakistan.','The GitHub Education Events registry describes Geminithon 2026 as a hybrid AI and cloud innovation hackathon where participants build solutions with Gemini, Google Cloud, and AWS technologies.', 'GitHub Education Events','hackathons',array['artificial-intelligence','programming','cloud'],'PK','Online','',true,'2026-09-19T09:00:00+05:00','https://education.github.com/events?q=student',true,'active',95,'github-education-geminithon-2026',now(),now()),
('build-forward-2026','Build Forward 2026: AI, Open Source & Cloud Summit','A one-day summit for students and developers to learn, build, and connect.','The GitHub Education Events registry lists Build Forward 2026 as a one-day AI, open source, and cloud summit in Sahiwal, Pakistan.', 'GitHub Education Events','conferences',array['artificial-intelligence','programming','web-development'],'PK','Sahiwal','Sahiwal, Punjab',false,'2026-09-21T09:00:00+05:00','https://education.github.com/events?q=student',true,'active',95,'github-education-build-forward-2026',now(),now()),
('aws-student-community-day-lahore-2026','AWS Student Community Day Lahore 2026','A student community day for learning from industry experts and AWS community leaders.','The GitHub Education Events registry lists AWS Student Community Day Lahore 2026 as a full-day in-person event for students in Lahore, Pakistan.', 'GitHub Education Events','conferences',array['cloud','programming','career-development'],'PK','Lahore','Lahore, Punjab',false,'2026-09-26T09:00:00+05:00','https://education.github.com/events?q=student',true,'active',95,'github-education-aws-student-lahore-2026',now(),now())
on conflict(slug) do update set summary=excluded.summary,description=excluded.description,start_at=excluded.start_at,registration_url=excluded.registration_url,status='active',confidence_score=excluded.confidence_score,last_checked_at=now(),last_verified_at=now();

insert into public.opportunity_sources(opportunity_id,source_id,source_url,source_name,source_domain,is_official,trust_score)
select o.id,s.id,'https://education.github.com/events?q=student',s.name,s.domain,true,s.trust_score
from public.opportunities o cross join public.sources s
where o.slug in ('geminithon-2026','build-forward-2026','aws-student-community-day-lahore-2026') and s.base_url='https://education.github.com/events?q=student'
on conflict(opportunity_id,source_id) do update set checked_at=now(),source_url=excluded.source_url;
