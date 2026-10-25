"use client";
import { useState } from "react";
import { PageShell } from "@/components/Site";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function QuotePage(){
 const [f,setF]=useState({name:"",email:"",phone:"",registration:"",make_model:"",service:"Mechanical Repairs",budget:"",description:""});
 const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 const upd=(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setF({...f,[e.target.name]:e.target.value});
 async function send(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");if(!supabaseConfigured){setMsg("Configure Supabase in .env.local before submitting online.");setBusy(false);return;}
 const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from("quote_requests").insert({customer_id:user?.id||null,customer_name:f.name,email:f.email,phone:f.phone,vehicle_registration:f.registration||null,vehicle_make_model:f.make_model||null,service_name:f.service,budget:f.budget||null,description:f.description,status:"new"});
 setMsg(error?error.message:"Quote request submitted. We’ll review the details and contact you.");if(!error)setF({name:"",email:"",phone:"",registration:"",make_model:"",service:"Mechanical Repairs",budget:"",description:""});setBusy(false);}
 return <PageShell><div className="page-head"><div className="shell"><h1>Request a quote</h1><p>Share the details so we can understand the work involved.</p></div></div><section className="section soft"><div className="shell form-wrap"><form className="form-grid" onSubmit={send}>
 <div className="field"><label>Your name *</label><input required name="name" value={f.name} onChange={upd}/></div><div className="field"><label>Email *</label><input required type="email" name="email" value={f.email} onChange={upd}/></div>
 <div className="field"><label>Phone *</label><input required name="phone" value={f.phone} onChange={upd}/></div><div className="field"><label>Registration</label><input name="registration" value={f.registration} onChange={upd}/></div>
 <div className="field"><label>Vehicle make/model</label><input name="make_model" value={f.make_model} onChange={upd}/></div><div className="field"><label>Service</label><select name="service" value={f.service} onChange={upd}>{["Mechanical Repairs","Diagnostics & Inspection","Auto Electrical","Restoration","Parts Sourcing","Other"].map(x=><option key={x}>{x}</option>)}</select></div>
 <div className="field full"><label>Approximate budget (optional)</label><input name="budget" value={f.budget} onChange={upd} placeholder="e.g. KES 15,000"/></div><div className="field full"><label>Describe the work needed *</label><textarea required rows={5} name="description" value={f.description} onChange={upd}/></div>
 <div className="field full"><button className="btn" disabled={busy}>{busy?"Submitting…":"Submit quote request"}</button>{msg&&<p className={msg.startsWith("Quote request")?"success":"error"}>{msg}</p>}</div></form></div></section></PageShell>;
}
