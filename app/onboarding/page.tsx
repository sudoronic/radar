export const dynamic="force-dynamic";
import {viewer} from "@/lib/data";
import {supabase} from "@/lib/supabase/server";
import {OnboardingFlow} from "@/components/onboarding/flow";
import {CATEGORIES,INTERESTS} from "@/lib/catalog";
export const metadata={title:"Set up your Radar",robots:{index:false,follow:false}};
export default async function Onboarding(){const {profile,preferences,demo}=await viewer(false);let interests:{slug:string;name:string}[]=[...INTERESTS],categories:{slug:string;name:string}[]=[...CATEGORIES];if(!demo){const db=await supabase();const [i,c]=await Promise.all([db.from('interests').select('slug,name'),db.from('categories').select('slug,name')]);if(i.error||c.error)throw new Error('Could not load interests');interests=i.data||[];categories=c.data||[];}return <main id="content" className="auth-wrap"><OnboardingFlow profile={profile} preferences={preferences} interests={interests} categories={categories}/></main>;}
