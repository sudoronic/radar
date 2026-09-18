import type {Database} from "@/types/database";
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function configured() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export async function supabase() {
 if (!configured()) throw new Error("Connect Supabase using .env.local to enable accounts and live data.");
 const jar = await cookies();
 return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
 cookies: { getAll: () => jar.getAll(), setAll: values => { try { values.forEach(({name,value,options}) => jar.set(name,value,options)); } catch { /* Proxy writes refreshed cookies for server components. */ } } }
 });
}
