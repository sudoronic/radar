"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";

export async function recordAction(form: FormData) {
  const id = z.uuid().safeParse(form.get("opportunity_id"));
  const action = z.enum(["interested", "applied", "going", "not_interested", "hide", "hide_organizer"]).safeParse(form.get("action"));
  if (!id.success || !action.success) return;
  const { db } = await requireUser();
  const { error } = await db.rpc("record_action", { p_opportunity_id: id.data, p_action: action.data });
  if (error) throw new Error("Could not record that action.");
  revalidatePath("/for-you"); revalidatePath("/saved"); revalidatePath("/calendar");
}

export async function submitReport(form: FormData) {
  const id = z.uuid().safeParse(form.get("opportunity_id"));
  const reason = z.enum(["wrong_information", "expired_registration", "suspicious", "duplicate", "cancelled", "incorrect_location"]).safeParse(form.get("reason"));
  if (!id.success || !reason.success) return;
  const { db, user } = await requireUser();
  const { error } = await db.from("reports").insert({ opportunity_id: id.data, reporter_id: user.id, reason: reason.data, details: String(form.get("details") || "").slice(0, 1000) });
  if (error) throw new Error("Could not submit the report.");
  revalidatePath(`/opportunity/${String(form.get("slug") || "")}`);
}

export async function submitOpportunity(form: FormData) {
  const { db, user } = await requireUser();
  const parsed = z.object({title:z.string().trim().min(5).max(200),organizer:z.string().max(150),category:z.string().max(80),city:z.string().max(100),event_at:z.string().optional(),registration_deadline:z.string().optional(),registration_url:z.url().optional().or(z.literal("")),source_url:z.url(),description:z.string().max(12000)}).safeParse(Object.fromEntries(form));
  if (!parsed.success) throw new Error("Check the title and URLs, then try again.");
  const { error } = await db.from("opportunity_submissions").insert({...parsed.data, submitter_id:user.id, registration_url:parsed.data.registration_url||null, event_at:parsed.data.event_at||null, registration_deadline:parsed.data.registration_deadline||null});
  if (error) throw new Error("Could not send your submission.");
  revalidatePath("/submit");
}
