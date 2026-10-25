"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/Site";
import { supabase, supabaseConfigured } from "@/lib/supabase";
export default function LoginPage(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 async function signIn(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");if(!supabaseConfigured){setMsg("Supabase is not configured. Follow the README setup steps.");setBusy(false);return;}
 const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setMsg(error.message);setBusy(false);return;}router.push("/dashboard");router.refresh();}
 async function signUp(){setBusy(true);setMsg("");if(!supabaseConfigured){setMsg("Configure Supabase first using the README.");setBusy(false);return;}
 const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/dashboard"}});setMsg(error?error.message:"Account created. Check your email if email confirmation is enabled, then sign in.");setBusy(false);}
 return <PageShell><section className="section soft"><div className="shell"><div className="auth-card"><div className="eyebrow">Customer portal</div><h1>Welcome back</h1><p style={{color:"var(--muted)",fontSize:13,lineHeight:1.6}}>Sign in to manage your vehicles, bookings and service history.</p><form onSubmit={signIn} className="form-grid" style={{gridTemplateColumns:"1fr"}}><div className="field"><label>Email address</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Password</label><input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/></div><button className="btn" disabled={busy}>Sign in</button><button type="button" className="btn outline" disabled={busy} onClick={signUp}>Create customer account</button>{msg&&<p className="error">{msg}</p>}</form><p style={{fontSize:12,color:"var(--muted)"}}>Need a service first? <Link href="/booking" className="text-link">Request a booking</Link></p></div></div></section></PageShell>;
}
