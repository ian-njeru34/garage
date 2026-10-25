"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/Site";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Booking = {
  id: string;
  service_name: string;
  vehicle_registration: string | null;
  preferred_date: string | null;
  status: string;
  created_at: string;
};

type QuoteRequest = {
  id: string;
  customer_name: string | null;
  vehicle_registration: string | null;
  vehicle_make_model: string | null;
  service_name: string | null;
  description: string | null;
  budget: string | number | null;
  status: string;
  created_at: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!supabaseConfigured) {
        setMsg("Supabase is not configured yet. Follow the README.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      if (!active) return;
      setEmail(user.email || "");

      const [bookingResult, quoteResult] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id,service_name,vehicle_registration,preferred_date,status,created_at"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("quote_requests")
          .select(
            "id,customer_name,vehicle_registration,vehicle_make_model,service_name,description,budget,status,created_at"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (bookingResult.error) {
        setMsg(`Bookings: ${bookingResult.error.message}`);
      } else {
        setBookings((bookingResult.data || []) as Booking[]);
      }

      if (quoteResult.error) {
        setMsg((previous) =>
          previous
            ? `${previous} | Quotations: ${quoteResult.error.message}`
            : `Quotations: ${quoteResult.error.message}`
        );
      } else {
        setQuotes((quoteResult.data || []) as QuoteRequest[]);
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const pendingBookings = bookings.filter((booking) =>
    ["requested", "pending"].includes(booking.status.toLowerCase())
  ).length;

  const activeBookings = bookings.filter((booking) =>
    ["in_progress", "in progress"].includes(booking.status.toLowerCase())
  ).length;

  return (
    <PageShell>
      <div className="page-head">
        <div className="shell">
          <h1>My Garage</h1>
          <p>Your bookings, quotations and vehicle service requests.</p>
        </div>
      </div>

      <section className="section soft">
        <div className="shell dashboard-grid">
          <aside className="side-menu">
            <Link className="active" href="/dashboard">
              Overview
            </Link>
            <Link href="/booking">Book a service</Link>
            <Link href="/quote">Request a quote</Link>
            <button
              onClick={logout}
              style={{
                border: 0,
                background: "transparent",
                padding: 11,
                fontSize: 13,
                textAlign: "left",
                width: "100%",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </aside>

          <div>
            <h2 style={{ fontFamily: "Montserrat" }}>
              Welcome{email ? `, ${email}` : ""}
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Keep track of your requests from one place.
            </p>

            <div className="stat-grid">
              <div className="stat">
                <span>Total requests</span>
                <strong>{bookings.length + quotes.length}</strong>
              </div>
              <div className="stat">
                <span>Awaiting confirmation</span>
                <strong>{pendingBookings}</strong>
              </div>
              <div className="stat">
                <span>In progress</span>
                <strong>{activeBookings}</strong>
              </div>
            </div>

            {msg && <p className="error">{msg}</p>}

            <h2 style={{ fontFamily: "Montserrat", marginTop: 28 }}>
              Service Bookings
            </h2>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Vehicle</th>
                    <th>Preferred date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.service_name}</td>
                      <td>
                        {booking.vehicle_registration || "Not provided"}
                      </td>
                      <td>
                        {booking.preferred_date || "To be arranged"}
                      </td>
                      <td>
                        <span className="pill">
                          {formatStatus(booking.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && bookings.length === 0 && (
                <div className="empty">
                  No booking requests yet.{" "}
                  <Link className="text-link" href="/booking">
                    Book your first service →
                  </Link>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 32,
                marginBottom: 14,
              }}
            >
              <h2 style={{ fontFamily: "Montserrat", margin: 0 }}>
                Quotation Requests
              </h2>
              <Link className="text-link" href="/quote">
                Request another quote →
              </Link>
            </div>

            {quotes.length === 0 && !loading ? (
              <div className="empty">
                No quotation requests found for your account.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Vehicle</th>
                      <th>Description</th>
                      <th>Submitted</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => (
                      <tr key={quote.id}>
                        <td>{quote.service_name || "General enquiry"}</td>
                        <td>
                          {quote.vehicle_registration ||
                            quote.vehicle_make_model ||
                            "Not provided"}
                        </td>
                        <td>{quote.description || "—"}</td>
                        <td>{formatDate(quote.created_at)}</td>
                        <td>
                          <span className="pill">
                            {formatStatus(quote.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {loading && (
              <div className="empty">Loading your requests…</div>
            )}

            <div className="notice" style={{ marginTop: 20 }}>
              Your dashboard shows your service bookings and quotation
              requests. Job tracking, quote approvals, invoices and payments
              can be added as the next stage.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
