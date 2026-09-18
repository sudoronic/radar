"use client";
import {useActionState} from "react";
import {Bookmark} from "lucide-react";
import {toggleSave} from "@/app/saved/actions";
export function SaveButton({id,saved=false}:{id:string;saved?:boolean}){const [state,action,pending]=useActionState(toggleSave,{saved,error:''});return <form action={action}><input name="id" type="hidden" value={id}/><button className="icon-button" disabled={pending} aria-label={state.saved?'Remove from saved':'Save opportunity'} aria-pressed={state.saved}><Bookmark size={17} fill={state.saved?'currentColor':'none'}/></button>{state.error&&<span role="alert" className="save-error">{state.error}</span>}</form>;}
