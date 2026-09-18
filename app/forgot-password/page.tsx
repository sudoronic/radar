import { AuthForm } from "@/components/auth-form";
export const metadata = {title:"Forgot Password | Radar",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{message?:string}>}){return <AuthForm mode="forgot-password" message={(await searchParams).message}/>;}
