import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Phone, CheckCircle2, Wrench } from "lucide-react";
import { PageShell, services } from "@/components/Site";

const phone = process.env.NEXT_PUBLIC_GARAGE_PHONE || "+254 700 000 000";
const location = process.env.NEXT_PUBLIC_GARAGE_LOCATION || "Nairobi, Kenya";

export default function Home() {
  return <PageShell>
    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow">Your car. Our craft.</div><h1><span className="gold">Fast & reliable</span> way to repair your car.</h1><p>From routine maintenance to complex diagnostics and restoration, we help keep you moving with practical advice and quality workmanship.</p><div className="actions"><Link className="btn" href="/quote">Get a Quote <ArrowRight size={16}/></Link><Link className="btn outline" href="/booking">Book a Service</Link></div></div>
        <div className="hero-image" role="img" aria-label="Vehicle being serviced in a professional garage"/>
      </section>
      <div className="shell info-strip">
        <div className="info-item"><div className="info-icon"><Clock size={21}/></div><div><strong>OPENING HOURS</strong><span>Mon–Fri · 08:00–18:00</span></div></div>
        <div className="info-item"><div className="info-icon"><Phone size={21}/></div><div><strong>HAVE A QUESTION?</strong><span>{phone}</span></div></div>
        <div className="info-item"><div className="info-icon"><MapPin size={21}/></div><div><strong>VISIT OUR GARAGE</strong><span>{location}</span></div></div>
      </div>
      <section className="section" id="services"><div className="shell"><div className="section-head"><div className="eyebrow">What we do</div><h2>Expert care for every <span className="gold">journey</span></h2><p>Practical automotive services with clear communication from inspection through completion.</p></div><div className="cards">{services.map(s=><article className="service-card" key={s.title}><div className="service-icon"><s.icon size={24}/></div><h3>{s.title}</h3><p>{s.desc}</p><Link className="text-link" href="/booking">BOOK THIS SERVICE →</Link></article>)}</div></div></section>
      <section className="section soft" id="about"><div className="shell split"><div className="feature-photo" role="img" aria-label="Technician working on a vehicle"/><div><div className="eyebrow">Why Joe’s Garage</div><h2>Good work starts with <span className="gold">honest advice.</span></h2><p>We believe customers should understand what their vehicle needs, what the work will cost, and what happens next. Our service process is designed around transparency and dependable care.</p><div className="checklist"><div className="check"><CheckCircle2 size={18}/><span>Clear quotations before additional work begins</span></div><div className="check"><CheckCircle2 size={18}/><span>Structured inspections and repair updates</span></div><div className="check"><CheckCircle2 size={18}/><span>Digital service history through your customer account</span></div><div className="check"><CheckCircle2 size={18}/><span>Support with sourcing suitable replacement parts</span></div></div><Link className="btn dark" href="/login">Open Customer Portal <ArrowRight size={16}/></Link></div></div></section>
      <section className="section"><div className="shell"><div className="cta"><div><h2>Ready to get back on the road?</h2><p>Tell us what your vehicle needs. We’ll help you plan the next step.</p></div><div className="actions" style={{margin:0}}><Link className="btn" href="/booking">Book an Appointment <CalendarDays size={16}/></Link><Link className="btn outline" href="/quote">Request a Quote</Link></div></div></div></section>
    </main>
  </PageShell>;
}
