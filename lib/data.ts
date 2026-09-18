import "server-only";
import {supabase,configured} from "@/lib/supabase/server";
import {requireUser} from "@/lib/auth/session";
import {demoEnabled,demoProfile,demoPreferences,demoOpportunities} from "@/lib/demo";
import type {Profile,Preferences,Opportunity} from "@/types/domain";
import {redirect} from "next/navigation";
export async function viewer(onboarded=true){
 if(demoEnabled()) return {profile:demoProfile,preferences:demoPreferences,demo:true};
 if(!configured()) redirect("/login?message=Connect+Supabase+to+start+your+Radar");
 const {db,user}=await requireUser();
 const [profile,prefs,interests,categories]=await Promise.all([
 db.from('profiles').select('*').eq('id',user.id).single<Profile>(),db.from('user_preferences').select('*').eq('user_id',user.id).maybeSingle<Preferences>(),
 db.from('user_interests').select('interest_slug').eq('user_id',user.id),db.from('user_categories').select('category_slug').eq('user_id',user.id)]);
 if(profile.error)throw new Error(profile.error.message);
 if(onboarded&&!profile.data.onboarded)redirect('/onboarding');
 for(const result of [prefs,interests,categories]) if(result.error)throw new Error(result.error.message);
 const preferences:Preferences={user_id:user.id,experience_level:'Any',budget:'mostly_free',budget_amount:null,currency:'PKR',include_online:true,travel:false,weights:{},...prefs.data,interests:(interests.data||[]).map(i=>i.interest_slug),categories:(categories.data||[]).map(c=>c.category_slug)};
 return {profile:profile.data,preferences,demo:false};
}
export async function candidates(profile:Profile,prefs:Preferences,offset=0):Promise<Opportunity[]>{
 if(demoEnabled())return demoOpportunities();
 const db=await supabase();
 const {data,error}=await db.rpc('recommendation_candidates',{p_city:profile.city,p_country:profile.country,p_online:prefs.include_online,p_travel:prefs.travel,p_categories:prefs.categories,p_interests:prefs.interests,p_offset:offset}).overrideTypes<Opportunity[],{merge:false}>();
 if(error)throw new Error(error.message);return data||[];
}

export async function savedIds(ids:string[]){
 if(!configured()||demoEnabled()||!ids.length)return new Set<string>();
 const db=await supabase();const {data:{user}}=await db.auth.getUser();if(!user)return new Set<string>();
 const {data,error}=await db.from('saved_opportunities').select('opportunity_id').eq('user_id',user.id).in('opportunity_id',ids);if(error)throw new Error(error.message);
 return new Set((data||[]).map(s=>s.opportunity_id));
}
export async function opportunity(slug:string){
 if(demoEnabled())return demoOpportunities().find(o=>o.slug===slug)||null;
 if(!configured())return null;const db=await supabase();const {data,error}=await db.from('opportunities').select('*').eq('slug',slug).maybeSingle();if(error)throw new Error(error.message);return data;
}
