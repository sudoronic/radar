import "server-only";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
export async function requireUser() {
 const db = await supabase();
 const { data: {user} } = await db.auth.getUser();
 if (!user) redirect("/login");
 return {db,user};
}
export async function requireAdmin() {
 const {db,user} = await requireUser();
 const {data,error} = await db.rpc("is_admin");
 if (error || data !== true) redirect("/for-you");
 return {db,user};
}
