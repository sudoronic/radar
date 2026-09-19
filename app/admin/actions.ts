"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { serviceClient } from "@/lib/supabase/admin";
export async function updateSource(form: FormData) {
  await requireAdmin(); const id=z.uuid().parse(form.get("id")); const intent=z.enum(["disable","refresh"]).parse(form.get("intent")); const db=serviceClient();
  const patch=intent==="disable"?{active:false}:{next_refresh_at:new Date().toISOString(),failure_count:0}; const {error}=await db.from("sources").update(patch).eq("id",id); if(error)throw new Error("Could not update source."); revalidatePath("/admin");
}
