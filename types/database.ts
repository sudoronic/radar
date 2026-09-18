import type {Opportunity,Profile,Organizer,Source,SourceEvidence,Preferences} from './domain';
export type Json=string|number|boolean|null|{[key:string]:Json|undefined}|Json[];
type Table<T>={Row:{[K in keyof T]:T[K]};Insert:Partial<T>;Update:Partial<T>;Relationships:[]};
export type Database={public:{Tables:{
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
 is_admin:{Args:Record<string,never>;Returns:boolean};
 save_preferences:{Args:{p:Json;interest_ids:string[];category_ids:string[]};Returns:undefined};
 recommendation_candidates:{Args:{p_city:string;p_country:string;p_online:boolean;p_travel:boolean;p_categories:string[];p_interests:string[];p_offset:number};Returns:Opportunity[]};
};Enums:Record<string,never>;CompositeTypes:Record<string,never>}};
