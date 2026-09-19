import "server-only";
import type { StudentResource } from "@/types/domain";

export async function studentResources():Promise<StudentResource[]>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return [];
 const response=await fetch(`${url}/rest/v1/student_resources?available=eq.true&order=last_verified_at.desc`,{headers:{apikey:key,Authorization:`Bearer ${key}`},next:{revalidate:3600,tags:["student-resources"]}});
 if(!response.ok)throw new Error("Could not load verified student resources.");
 return response.json() as Promise<StudentResource[]>;
}
