"use client";
import { useState } from "react";
import { PageShell } from "@/components/Site";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function BookingPage() {
  const [form,setForm] = useState({name:"",email:"",phone:"",registration:"",make_model:"",service:"Mechanical Repairs",preferred_date:"",description:""});
  const [message,setMessage] = useState(""); const [busy,setBusy] = useState(false);
  const update=(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setForm({...form,[e.target.name]:e.target.value});
  async function submit(e:React.FormEvent){e.preventDefault();setMessage("");setBusy(true);
    if(!supabaseConfigured){setMessage("Supabase is not configured yet. Add your project URL and anon/publishable key to .env.local, then restart the app.");setBusy(false);return;}
    const {data:{user}}=await supabase.auth.getUser();
    const {error}=await supabase.from("bookings").insert({customer_id:user?.id||null,customer_name:form.name,email:form.email,phone:form.phone,vehicle_registration:form.registration||null,vehicle_make_model:form.make_model||null,service_name:form.service,preferred_date:form.preferred_date||null,description:form.description,status:"requested"});
    setMessage(error?error.message:"Booking request sent. The garage will contact you to confirm the appointment."); if(!error)setForm({name:"",email:"",phone:"",registration:"",make_model:"",service:"Mechanical Repairs",preferred_date:"",description:""});setBusy(false);
  }
  return <PageShell><div className="page-head"><div className="shell"><h1>Book a service</h1><p>Tell us about your vehicle and preferred appointment.</p></div></div><section className="section soft"><div className="shell form-wrap"><div className="notice" style={{marginBottom:20}}>Submitting a request does not confirm an appointment. The garage will contact you to confirm availability.</div><form onSubmit={submit} className="form-grid">
    <div className="field"><label>Your name *</label><input required name="name" value={form.name} onChange={update}/></div><div className="field"><label>Email *</label><input required type="email" name="email" value={form.email} onChange={update}/></div>
    <div className="field"><label>Phone / WhatsApp *</label><input required name="phone" value={form.phone} onChange={update}/></div><div className="field"><label>Vehicle registration</label><input name="registration" value={form.registration} onChange={update} placeholder="e.g. KDA 123A"/></div>
    <div className="field"><label>Vehicle make and model</label><input name="make_model" value={form.make_model} onChange={update} placeholder="e.g. Toyota Axio"/></div><div className="field"><label>Service required *</label><select required name="service" value={form.service} onChange={update}>{["Mechanical Repairs","Routine Service","Diagnostics & Inspection","Auto Electrical","Restoration","Parts Sourcing","Performance Upgrade","Other"].map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="field"><label>Preferred date</label><input type="date" min={new Date().toISOString().slice(0,10)} name="preferred_date" value={form.preferred_date} onChange={update}/></div><div className="field full"><label>Describe the issue or requested work</label><textarea rows={4} name="description" value={form.description} onChange={update} placeholder="Symptoms, warning lights, unusual sounds, or work needed…"/></div>
    <div className="field full"><button className="btn" disabled={busy}>{busy?"Sending…":"Send booking request"}</button>{message&&<p className={message.startsWith("Booking request")?"success":"error"}>{message}</p>}</div>
  </form></div></section></PageShell>;
}
