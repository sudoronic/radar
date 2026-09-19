import type {Opportunity,Profile,Organizer,Source,SourceEvidence,Preferences} from './domain';
export type Json=string|number|boolean|null|{[key:string]:Json|undefined}|Json[];
type Table<T>={Row:{[K in keyof T]:T[K]};Insert:Partial<T>;Update:Partial<T>;Relationships:[]};
export type Database={public:{Tables:{
 saved_opportunities:Table<{user_id:string;opportunity_id:string;created_at:string}>;
 opportunity_submissions:Table<{id:string;submitter_id:string|null;title:string;organizer:string;category:string;city:string;event_at:string|null;registration_deadline:string|null;registration_url:string|null;source_url:string;description:string;status:string;created_at:string}>;
 user_opportunity_actions:Table<{id:number;user_id:string;opportunity_id:string;action:string;created_at:string}>;
 notifications:Table<{id:string;user_id:string;opportunity_id:string|null;type:string;title:string;body:string;read_at:string|null;created_at:string}>;
 reports:Table<{id:string;opportunity_id:string;reporter_id:string|null;reason:string;details:string;status:string;created_at:string;updated_at:string}>;
 profiles:Table<Profile>;
 organizers:Table<Organizer>;
 sources:Table<Source>;
 opportunities:Table<Opportunity>;
 opportunity_sources:Table<SourceEvidence>;
 interests:Table<{slug:string;name:string}>;
 categories:Table<{slug:string;name:string}>;
 countries:Table<{code:string;name:string}>;
 cities:Table<{id:number;name:string;country:string;timezone:string}>;
 user_interests:Table<{user_id:string;interest_slug:string}>;
 user_categories:Table<{user_id:string;category_slug:string}>;
 user_preferences:Table<Omit<Preferences,'interests'|'categories'>&{notification_cursor:string}>;
};Views:Record<string,never>;Functions:{
 search_opportunities:{Args:{filters:Json;page_number:number};Returns:Opportunity[]};
 saved_feed:{Args:{sort_by:string;page_number:number};Returns:Opportunity[]};
 record_action:{Args:{p_opportunity_id:string;p_action:string};Returns:undefined};
 is_admin:{Args:Record<string,never>;Returns:boolean};
 save_preferences:{Args:{p:Json;interest_ids:string[];category_ids:string[]};Returns:undefined};
 recommendation_candidates:{Args:{p_city:string;p_country:string;p_online:boolean;p_travel:boolean;p_categories:string[];p_interests:string[];p_offset:number};Returns:Opportunity[]};
};Enums:Record<string,never>;CompositeTypes:Record<string,never>}};
