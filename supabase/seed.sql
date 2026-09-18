-- LOCAL DEVELOPMENT ONLY. Demo rows are deliberately hidden by public RLS.
insert into public.sources(name,domain,base_url,source_type,fetch_method,active,config)
values('Example structured calendar (disabled)','example.com','https://example.com/opportunities.json','community','JSON',false,'{"items_path":"opportunities"}') on conflict do nothing;
insert into public.opportunities(slug,title,summary,category,country,city,start_at,registration_deadline,is_free,price_amount,is_demo,status)
select lower(replace(title,' ','-')),title,'Fictional development data — not a real listing.',category,'PK','Lahore',now()+interval '14 days',now()+interval '7 days',true,0,true,'active'
from (values ('Lahore AI Hackathon','hackathons'),('Developer Meetup Lahore','developer-meetups'),('Startup Weekend Lahore','startup-events'),('Cybersecurity Workshop','workshops'),('Student Entrepreneurship Challenge','competitions'),('Government Youth Technology Program','government-programs')) as d(title,category)
on conflict do nothing;
