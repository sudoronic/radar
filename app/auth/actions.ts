"use server";
import { redirect } from "next/navigation";
import { supabase, configured } from "@/lib/supabase/server";
import { z } from "zod";
export async function authenticate(form: FormData) {
 const mode = String(form.get("mode"));
 if (!configured()) redirect("/login?message=" + encodeURIComponent("Connect Supabase to enable accounts. See README setup."));
 const db = await supabase();
 const email = String(form.get("email") || ""), password = String(form.get("password") || "");
 if (mode !== "reset-password" && !z.email().safeParse(email).success) redirect("/login?message=Enter+a+valid+email");
 if (mode !== "forgot-password" && password.length < 10) redirect("/login?message=Use+at+least+10+characters");
 const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
 if (mode === "signup") {
 const {data,error} = await db.auth.signUp({email,password, options:{emailRedirectTo:origin+"/auth/callback?next=/onboarding"}});
 if (error) redirect("/signup?message="+encodeURIComponent(error.message));
 redirect(data.session ? "/onboarding" : "/login?message=Check+your+email+to+confirm+your+account");
 }
 if (mode === "forgot-password") {
 const {error} = await db.auth.resetPasswordForEmail(email,{redirectTo:origin+"/auth/callback?next=/reset-password"});
 if(error) redirect("/forgot-password?message="+encodeURIComponent("Recovery email could not be requested. The project email service may be restricted; contact the administrator."));
 redirect("/forgot-password?message=If+the+account+exists%2C+a+reset+link+has+been+requested");
 }
 if (mode === "reset-password") {
 const {data:{user}} = await db.auth.getUser();
 if (!user) redirect("/forgot-password?message=Request+a+new+recovery+link");
 const {error} = await db.auth.updateUser({password});
 if(error) redirect("/reset-password?message="+encodeURIComponent(error.message));
 redirect("/for-you");
 }
 const {error} = await db.auth.signInWithPassword({email,password});
 if(error) redirect("/login?message="+encodeURIComponent(error.message));
 const {data} = await db.from("profiles").select("onboarded").single();
 redirect(data?.onboarded ? "/for-you" : "/onboarding");
}
export async function logout() { const db=await supabase(); await db.auth.signOut(); redirect("/"); }
