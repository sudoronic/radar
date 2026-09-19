"use client";
import {useEffect,useState} from "react";

function remaining(value:string){const ms=new Date(value).getTime()-Date.now();if(ms<=0)return "due now";const minutes=Math.ceil(ms/60000),hours=Math.floor(minutes/60),mins=minutes%60;return hours?`${hours}h ${mins}m`:`${mins}m`;}
export function AutomationTimer({nextRun,label}:{nextRun?:string|null;label:string}){const [now,setNow]=useState(Date.now);useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer);},[]);if(!nextRun)return <article className="card automation-timer"><span>Automation status</span><strong>No active source</strong><p>Enable a verified source after its first manual test.</p></article>;return <article className="card automation-timer"><span>Next automated check</span><strong>{now?remaining(nextRun):"Calculating…"}</strong><p>{label} · {new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(nextRun))}</p></article>;}
