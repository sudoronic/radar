export const dynamic="force-dynamic";
import {viewer} from "@/lib/data";
import {Shell} from "@/components/navigation/shell";
import {OnboardingFlow} from "@/components/onboarding/flow";
import {CATEGORIES,INTERESTS} from "@/lib/catalog";
import {logout} from "@/app/auth/actions";
export const metadata={title:"Profile",robots:{index:false,follow:false}};
export default async function Profile(){const {profile,preferences,demo}=await viewer(false);return <Shell city={profile.city} name={profile.name}><OnboardingFlow profile={profile} preferences={preferences} interests={[...INTERESTS]} categories={[...CATEGORIES]} edit/>{!demo&&<form action={logout}><button className="button secondary">Log out</button></form>}</Shell>;}
