"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/Site";
import { supabase, supabaseConfigured } from "@/lib/supabase";
type Booking={id:string;customer_name:string;email:string;phone:string;service_name:string;vehicle_registration:string|null;preferred_date:string|null;status:string;created_at:string};
export default function AdminPage(){
 const [rows,setRows]=useState<Booking[]>([]);const [msg,setMsg]=useState("Checking access…");const [allowed,setAllowed]=useState(false);const [loading,setLoading]=useState(true);const router=useRouter();
 async function load(){if(!supabaseConfigured){setMsg("Configure Supabase before opening the admin area.");setLoading(false);return;}
 const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/login");return;}
 const {data:profile,error:pError}=await supabase.from("profiles").select("role").eq("id",user.id).single();
 if(pError||!profile||!["admin","staff"].includes(profile.role)){setMsg("Access denied. An administrator must assign your account the admin or staff role.");setLoading(false);return;}
 setAllowed(true);const {data,error}=await supabase.from("bookings").select("id,customer_name,email,phone,service_name,vehicle_registration,preferred_date,status,created_at").order("created_at",{ascending:false});
 if(error)setMsg(error.message);else{setRows((data||[]) as Booking[]);setMsg("");}setLoading(false);}
 useEffect(()=>{load();},[]);
 async function setStatus(id:string,status:string){const {error}=await supabase.from("bookings").update({status}).eq("id",id);if(error){setMsg(error.message);return;}setRows(old=>old.map(r=>r.id===id?{...r,status}:r));}
 return <PageShell><div className="page-head"><div className="shell"><h1>Garage administration</h1><p>Review incoming booking requests and update their status.</p></div></div><section className="section soft"><div className="shell">{loading?<p>{msg}</p>:!allowed?<div className="form-wrap"><p className="error">{msg}</p><p style={{fontSize:13}}>To grant access, use the Supabase SQL instructions in <code>supabase/schema.sql</code> after creating your account.</p></div>:<><div className="notice">This initial admin view manages booking requests only. Add separate workflows for job cards, quotations, parts, invoices and payments before relying on this for full workshop operations.</div><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Service / vehicle</th><th>Date</th><th>Status</th><th>Update status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><strong>{r.customer_name}</strong><br/>{r.email}<br/>{r.phone}</td><td>{r.service_name}<br/>{r.vehicle_registration||"Vehicle not supplied"}</td><td>{r.preferred_date||"Not specified"}</td><td><span className="pill">{r.status}</span></td><td><select aria-label={`Update status for ${r.customer_name}`} value={r.status} onChange={e=>setStatus(r.id,e.target.value)}><option value="requested">Requested</option><option value="confirmed">Confirmed</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty">No booking requests found.</div>}</div>{msg&&<p className="error">{msg}</p>}</>}</div></section></PageShell>;
}
