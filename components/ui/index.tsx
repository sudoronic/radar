import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
export function Button({className="",...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className={`button ${className}`} {...props}/>;}
export function Input(props:InputHTMLAttributes<HTMLInputElement>){return <input {...props} className={`input ${props.className||""}`}/>;}
export function Select(props:SelectHTMLAttributes<HTMLSelectElement>){return <select {...props} className={`input ${props.className||""}`}/>;}
export function Chip({children}:{children:ReactNode}){return <span className="chip">{children}</span>;}
export const Badge=Chip;
export function Card({children,className=""}:{children:ReactNode;className?:string}){return <article className={`card ${className}`}>{children}</article>;}
export function EmptyState({title,children}:{title:string;children?:ReactNode}){return <div className="empty"><span className="empty-orbit">◎</span><h2>{title}</h2><div className="muted">{children}</div></div>;}
export function Skeleton(){return <div className="skeleton" aria-label="Loading"/>;}
export function Checkbox(props:InputHTMLAttributes<HTMLInputElement>){return <input {...props} type="checkbox"/>;}
export function Radio(props:InputHTMLAttributes<HTMLInputElement>){return <input {...props} type="radio"/>;}
export function Avatar({name}:{name:string}){return <span className="avatar" aria-label={name}>{name.slice(0,2).toUpperCase()}</span>;}
export function Tooltip({label,children}:{label:string;children:ReactNode}){return <span title={label}>{children}</span>;}
export function Toast({children}:{children:ReactNode}){return <p role="status" className="notice">{children}</p>;}
export function SearchBox({value=""}:{value?:string}){return <Input name="q" type="search" defaultValue={value} placeholder="Search opportunities, topics, or organizers" aria-label="Search opportunities"/>;}
