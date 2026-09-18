import Link from "next/link";
import {Bell,Search,MapPin} from "lucide-react";
import {Navigation} from "./nav";
import {Avatar} from "@/components/ui";
import {demoEnabled} from "@/lib/demo";
export function Shell({children,city="Your world",name="You",unread=0}:{children:React.ReactNode;city?:string;name?:string;unread?:number}){return <div className="app-shell"><Navigation/><div className="workspace"><header className="topbar"><span className="location"><MapPin size={14}/>{city}<span className="muted"> & online</span></span><div><Link href="/explore" aria-label="Search"><Search size={18}/></Link><Link href="/notifications" aria-label={`Notifications, ${unread} unread`} className="notification-icon"><Bell size={18}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</Link><Link href="/profile"><Avatar name={name}/></Link></div></header><main id="content" className="main-content">{demoEnabled()&&<p className="notice demo-notice">Development preview · All opportunities are fictional. Sign-in, saves, and applications require a connected Supabase project.</p>}{children}</main></div></div>;}
