"use client";
import {Button} from "@/components/ui";
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="content" className="auth-wrap"><div><h1>We couldn’t load your Radar.</h1><p>Check your connection or try again. If setup is incomplete, follow the README.</p><Button onClick={reset}>Try again</Button></div></main>;}
