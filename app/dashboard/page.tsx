
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
  quoted_price: number | null;
  quote_details: string | null;
  decision: "pending" | "approved" | "declined";
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

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [savingQuote, setSavingQuote] = useState<string | null>(null);
  const router = useRouter();

  async function loadDashboard() {
    if (!supabaseConfigured) {
      setMsg("Supabase is not configured yet.");
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
          "id,customer_name,vehicle_registration,vehicle_make_model,service_name,description,budget,status,created_at,quoted_price,quote_details,decision"
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

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

  useEffect(() => {
    let active = true;

    async function load() {
      await loadDashboard();
      if (!active) return;
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function decideQuote(
    quoteId: string,
    decision: "approved" | "declined"
  ) {
    const confirmed = window.confirm(
      decision === "approved"
        ? "Approve this quotation? This confirms your acceptance of the quoted price and repair details."
        : "Decline this quotation?"
    );

    if (!confirmed) return;

    setSavingQuote(quoteId);
    setMsg("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMsg("Your session has expired. Please sign in again.");
      setSavingQuote(null);
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("quote_requests")
      .update({
        decision,
        decided_at: new Date().toISOString(),
      })
      .eq("id", quoteId)
      .eq("customer_id", userData.user.id)
      .eq("decision", "pending")
      .select("id,decision")
      .maybeSingle();

    if (error) {
      setMsg(`Could not save your decision: ${error.message}`);
    } else if (!data) {
      setMsg(
        "Your decision was not saved. The quotation may already have been decided, or your account may not have permission to update it. Refresh the page and try again."
      );
      await loadDashboard();
    } else {
      setQuotes((previous) =>
        previous.map((quote) =>
          quote.id === quoteId
            ? { ...quote, decision }
            : quote
        )
      );
      setMsg(
        decision === "approved"
          ? "Quotation approved successfully."
          : "Quotation declined successfully."
      );
    }

    setSavingQuote(null);
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
            <Link className="active" href="/dashboard">Overview</Link>
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

            {msg && <p className="notice" role="status">{msg}</p>}

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
                      <td>{booking.vehicle_registration || "Not provided"}</td>
                      <td>{booking.preferred_date || "To be arranged"}</td>
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

            {!loading && quotes.length === 0 ? (
              <div className="empty">
                No quotation requests found for your account.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Service / request</th>
                      <th>Vehicle</th>
                      <th>Submitted</th>
                      <th>Request status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote) => (
                      <tr key={quote.id}>
                        <td>{quote.service_name || "General enquiry"}</td>
                        <td>
                          {quote.vehicle_registration || "Not provided"}
                          {quote.vehicle_make_model && (
                            <>
                              <br />
                              {quote.vehicle_make_model}
                            </>
                          )}
                        </td>
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

            <h2 style={{ fontFamily: "Montserrat", marginTop: 32 }}>
              Your Quotations
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Review the proposed work and price before making a decision.
              Approving a quotation records your acceptance; contact the garage
              if you need clarification.
            </p>

            {quotes.map((quote) => (
              <article
                key={`quotation-${quote.id}`}
                className="service-card"
                style={{ marginBottom: 16 }}
              >
                <h3>{quote.service_name || "Vehicle repair quotation"}</h3>
                <p>
                  <strong>Vehicle:</strong>{" "}
                  {quote.vehicle_registration || "Not provided"}
                  {quote.vehicle_make_model
                    ? ` — ${quote.vehicle_make_model}`
                    : ""}
                </p>
                <p>
                  <strong>Your request:</strong>{" "}
                  {quote.description || "No description supplied"}
                </p>

                {quote.quoted_price !== null ? (
                  <p style={{ fontSize: 22, fontWeight: 700 }}>
                    Quoted price: {formatMoney(Number(quote.quoted_price))}
                  </p>
                ) : (
                  <p>The garage has not provided a price yet.</p>
                )}

                {quote.quote_details && (
                  <div>
                    <strong>Proposed repairs and terms</strong>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {quote.quote_details}
                    </p>
                  </div>
                )}

                <p>
                  <strong>Decision:</strong>{" "}
                  {formatStatus(quote.decision || "pending")}
                </p>

                {quote.quoted_price !== null &&
                  quote.quote_details?.trim() &&
                  quote.decision === "pending" && (
                    <div
                      className="actions"
                      style={{ marginTop: 16, flexWrap: "wrap" }}
                    >
                      <button
                        className="btn"
                        disabled={savingQuote === quote.id}
                        onClick={() => decideQuote(quote.id, "approved")}
                      >
                        {savingQuote === quote.id
                          ? "Saving…"
                          : "Approve quotation"}
                      </button>
                      <button
                        className="btn outline"
                        disabled={savingQuote === quote.id}
                        onClick={() => decideQuote(quote.id, "declined")}
                      >
                        Decline quotation
                      </button>
                    </div>
                  )}

                {quote.decision !== "pending" && (
                  <p className="notice">
                    You have {quote.decision} this quotation. Contact the
                    garage if you need to discuss a change.
                  </p>
                )}

                {quote.quoted_price !== null &&
                  !quote.quote_details?.trim() &&
                  quote.decision === "pending" && (
                    <p className="notice">
                      The garage is preparing the repair details. You can
                      respond once the complete quotation is available.
                    </p>
                  )}
              </article>
            ))}

            {loading && <div className="empty">Loading your requests…</div>}

            <div className="notice" style={{ marginTop: 20 }}>
              A quotation approval records your decision. Do not begin repairs
              until the garage confirms the next steps.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
