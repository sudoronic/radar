"use server";
import {requireUser} from "@/lib/auth/session";
import {revalidatePath} from "next/cache";
import {z} from "zod";
export async function toggleSave(state:{saved:boolean;error:string},form:FormData){
 const id=z.uuid().safeParse(form.get('id'));if(!id.success)return {...state,error:'Invalid opportunity.'};
 const {db,user}=await requireUser();
 const result=state.saved?await db.from('saved_opportunities').delete().eq('user_id',user.id).eq('opportunity_id',id.data):await db.from('saved_opportunities').upsert({user_id:user.id,opportunity_id:id.data},{onConflict:'user_id,opportunity_id',ignoreDuplicates:true});
 if(result.error)return {...state,error:'Could not update saved opportunities. Please try again.'};
 revalidatePath('/saved');revalidatePath('/for-you');return {saved:!state.saved,error:''};
}
