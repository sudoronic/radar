import { AuthForm } from "@/components/auth-form";
export const metadata = {title:"Reset Password | Radar",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{message?:string}>}){return <AuthForm mode="reset-password" message={(await searchParams).message}/>;}
