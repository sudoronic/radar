import { AuthForm } from "@/components/auth-form";
export const metadata = {title:"Signup | Radar",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{message?:string}>}){return <AuthForm mode="signup" message={(await searchParams).message}/>;}
