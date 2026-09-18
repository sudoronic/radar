"use server";
import {z} from "zod";
import {requireUser} from "@/lib/auth/session";
import {ROLES,LEVELS} from "@/lib/catalog";
import {redirect} from "next/navigation";
export const saveOnboarding = async (_state:{error:string},form:FormData):Promise<{error:string}> => {
 const {db}=await requireUser();
 const schema=z.object({name:z.string().max(100),role:z.enum(ROLES),field:z.string().max(100),city:z.string().trim().min(2).max(100),country:z.string().length(2),experience_level:z.enum(LEVELS),budget:z.enum(['free','mostly_free','custom','any']),currency:z.string().length(3),budget_amount:z.number().nonnegative().nullable(),include_online:z.boolean(),travel:z.boolean()});
 const parsed=schema.safeParse({name:String(form.get('name')||''),role:form.get('role'),field:String(form.get('field')||''),city:form.get('city'),country:String(form.get('country')||'').toUpperCase(),experience_level:form.get('experience_level'),budget:form.get('budget'),currency:String(form.get('currency')||'PKR').toUpperCase(),budget_amount:form.get('budget_amount')?Number(form.get('budget_amount')):null,include_online:form.get('include_online')==='on',travel:form.get('travel')==='on'});
 if(!parsed.success)return {error:parsed.error.issues[0].message};
 if(parsed.data.budget==='custom'&&parsed.data.budget_amount===null)return {error:'Enter your budget amount.'};
 const interests=form.getAll('interests').map(String),categories=form.getAll('categories').map(String);
 if(!interests.length||!categories.length)return {error:'Choose at least one interest and category.'};
 const {error}=await db.rpc('save_preferences',{p:parsed.data,interest_ids:interests,category_ids:categories});
 if(error)return {error:'Your preferences could not be saved. Please check your selections and try again.'};
 redirect('/for-you');
};
