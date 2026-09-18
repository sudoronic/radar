"use client";
import {useRef} from "react";
export function Modal({label,children,drawer=false}:{label:string;children:React.ReactNode;drawer?:boolean}){const ref=useRef<HTMLDialogElement>(null);return <><button type="button" className="button secondary" onClick={()=>ref.current?.showModal()}>{label}</button><dialog ref={ref} className={drawer?'modal drawer':'modal'} aria-label={label}><div className="dialog-header"><h2>{label}</h2><button type="button" className="icon-button" aria-label="Close dialog" onClick={()=>ref.current?.close()}>×</button></div>{children}</dialog></>;}
export function Drawer({label,children}:{label:string;children:React.ReactNode}){return <Modal label={label} drawer>{children}</Modal>;}
export function Dropdown({label,children}:{label:string;children:React.ReactNode}){return <details className="dropdown"><summary>{label}</summary>{children}</details>;}
