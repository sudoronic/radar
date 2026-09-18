import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { safeReturn } from "@/lib/utils/url";
export async function GET(request: Request) {
 const url=new URL(request.url), code=url.searchParams.get("code");
 if(code) { const db=await supabase(); const {error}=await db.auth.exchangeCodeForSession(code); if(!error) return NextResponse.redirect(new URL(safeReturn(url.searchParams.get("next")),url.origin)); }
 return NextResponse.redirect(new URL("/login?message=This+link+expired.+Please+try+again.",url.origin));
}
