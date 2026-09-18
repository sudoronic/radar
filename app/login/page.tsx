import { AuthForm } from "@/components/auth-form";
export const metadata = {title:"Login | Radar",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{message?:string}>}){return <AuthForm mode="login" message={(await searchParams).message}/>;}
