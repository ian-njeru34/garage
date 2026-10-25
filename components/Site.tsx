import Link from "next/link";
import { Wrench, CalendarDays, MapPin, Phone, Clock, CarFront, Settings, Zap, Search, ShieldCheck, ArrowRight, Menu } from "lucide-react";

const phone = process.env.NEXT_PUBLIC_GARAGE_PHONE || "+254 700 000 000";
const location = process.env.NEXT_PUBLIC_GARAGE_LOCATION || "Nairobi, Kenya";

export function Header() {
  return <header className="topbar"><div className="shell nav">
    <Link href="/" className="brand"><span className="brand-mark"><Wrench size={22}/></span><span>JOE’S GARAGE<small>REPAIR · RESTORE · DRIVE</small></span></Link>
    <nav className="navlinks"><Link href="/">Home</Link><a href="/#services">Services</a><a href="/#about">About</a><Link href="/booking">Book a Service</Link><Link href="/contact">Contact</Link></nav>
    <div style={{display:"flex",gap:10,alignItems:"center"}}><Link className="btn" href="/booking">Appointment <CalendarDays size={15}/></Link><Link className="mobile-menu" href="/booking" aria-label="Book appointment"><Menu size={22}/></Link></div>
  </div></header>;
}

export function Footer() {
  return <footer className="footer"><div className="shell"><div className="footer-grid">
    <div><Link href="/" className="brand"><span className="brand-mark"><Wrench size={22}/></span><span>JOE’S GARAGE<small>REPAIR · RESTORE · DRIVE</small></span></Link><p>Dependable automotive care, clear communication, and workmanship you can trust.</p></div>
    <div><h4>Explore</h4><div className="footer-links"><Link href="/#services">Our services</Link><Link href="/booking">Book a service</Link><Link href="/quote">Request a quote</Link><Link href="/login">Customer portal</Link></div></div>
    <div><h4>Get in touch</h4><p><Phone size={13} style={{display:"inline",marginRight:7}}/>{phone}<br/><MapPin size={13} style={{display:"inline",marginRight:7}}/>{location}<br/><Clock size={13} style={{display:"inline",marginRight:7}}/>Mon–Fri: 8:00–18:00</p></div>
  </div><div className="copyright">© {new Date().getFullYear()} Joe’s Garage. All rights reserved. <span style={{float:"right"}}>Built for better vehicle care.</span></div></div></footer>;
}

export function PageShell({children}: {children: React.ReactNode}) {
  return <><Header/>{children}<Footer/></>;
}

export const services = [
  {icon:Settings,title:"Mechanical Repairs",desc:"Routine servicing, engine repairs, brakes, suspension and general mechanical work."},
  {icon:Search,title:"Diagnostics & Inspection",desc:"Structured fault-finding, diagnostic scans and practical recommendations."},
  {icon:Zap,title:"Auto Electrical",desc:"Electrical troubleshooting, battery and charging systems, wiring and component checks."},
  {icon:CarFront,title:"Restoration & Care",desc:"Careful restoration planning, maintenance and cosmetic improvement projects."},
  {icon:Wrench,title:"Parts Sourcing",desc:"Request parts by vehicle details, part number or photo and receive a quote."},
  {icon:ShieldCheck,title:"Performance & Quality Checks",desc:"Selected upgrades, post-repair checks and roadworthiness-focused inspections."}
];
