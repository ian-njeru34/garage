import { PageShell } from "@/components/Site";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
export default function ContactPage(){
 const phone=process.env.NEXT_PUBLIC_GARAGE_PHONE||"+254 700 000 000";
 const email=process.env.NEXT_PUBLIC_GARAGE_EMAIL||"hello@joesgarage.co.ke";
 const loc=process.env.NEXT_PUBLIC_GARAGE_LOCATION||"Nairobi, Kenya";
 return <PageShell><div className="page-head"><div className="shell"><h1>Contact Joe’s Garage</h1><p>Questions about a repair, booking or spare part? Get in touch.</p></div></div><section className="section"><div className="shell cards">
 <article className="service-card"><div className="service-icon"><Phone/></div><h3>Call or WhatsApp</h3><p>{phone}</p><a className="text-link" href={`https://wa.me/${(process.env.NEXT_PUBLIC_GARAGE_WHATSAPP||"254700000000").replace(/\D/g,"")}`}>MESSAGE US →</a></article>
 <article className="service-card"><div className="service-icon"><MapPin/></div><h3>Location</h3><p>{loc}. Contact us for directions and workshop availability.</p></article>
 <article className="service-card"><div className="service-icon"><Clock/></div><h3>Opening hours</h3><p>Monday–Friday: 08:00–18:00<br/>Saturday: By appointment<br/>Sunday: Closed</p></article>
 <article className="service-card"><div className="service-icon"><Mail/></div><h3>Email</h3><p>{email}</p><a className="text-link" href={`mailto:${email}`}>SEND EMAIL →</a></article>
 </div></section></PageShell>;
}
