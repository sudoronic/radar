"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { serviceClient } from "@/lib/supabase/admin";

const sourceInput = z.object({
  name: z.string().trim().min(2).max(120),
  base_url: z.url().startsWith("https://"),
  fetch_method: z.enum(["RSS", "ICAL", "JSON", "JSON_LD", "PUBLIC_API", "HTML"]),
  country: z.string().trim().max(2).optional(),
  city: z.string().trim().max(100).optional(),
  categories: z.string().trim().max(400).optional(),
  source_type: z.string().trim().min(2).max(60),
  trust_score: z.coerce.number().int().min(0).max(100),
  refresh_interval_minutes: z.coerce.number().int().min(60).max(10080),
  is_official: z.boolean(),
  active: z.boolean(),
  config: z.string().trim().max(10000).optional(),
});

export async function createSource(form: FormData) {
  await requireAdmin();
  const rawUrl = String(form.get("base_url") || "").trim();
  let parsedUrl: URL;
  try { parsedUrl = new URL(rawUrl); } catch { throw new Error("Enter a valid HTTPS source URL."); }
  const parsed = sourceInput.safeParse({
    ...Object.fromEntries(form),
    base_url: parsedUrl.toString(),
    is_official: form.get("is_official") === "on",
    active: form.get("active") === "on",
  });
  if (!parsed.success) throw new Error("Check the source details and try again.");
  const value = parsed.data;
  let config: Record<string, unknown> = {};
  if (value.config) {
    try {
      const candidate: unknown = JSON.parse(value.config);
      if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") throw new Error();
      config = candidate as Record<string, unknown>;
    } catch { throw new Error("Parser configuration must be a JSON object."); }
  }
  const { error } = await serviceClient().from("sources").insert({
    name: value.name,
    domain: parsedUrl.hostname.toLowerCase(),
    base_url: value.base_url,
    source_type: value.source_type,
    fetch_method: value.fetch_method,
    country: value.country || null,
    city: value.city || null,
    categories: value.categories ? value.categories.split(",").map((item) => item.trim()).filter(Boolean) : [],
    trust_score: value.trust_score,
    refresh_interval_minutes: value.refresh_interval_minutes,
    is_official: value.is_official,
    active: value.active,
    next_refresh_at: new Date().toISOString(), config,
  });
  if (error) throw new Error(error.code === "23505" ? "That source URL already exists." : "Could not create the source.");
  revalidatePath("/admin");
}

export async function updateSource(form: FormData) {
  await requireAdmin(); const id=z.uuid().parse(form.get("id")); const intent=z.enum(["disable","refresh"]).parse(form.get("intent")); const db=serviceClient();
  const patch=intent==="disable"?{active:false}:{next_refresh_at:new Date().toISOString(),failure_count:0}; const {error}=await db.from("sources").update(patch).eq("id",id); if(error)throw new Error("Could not update source."); revalidatePath("/admin");
}
