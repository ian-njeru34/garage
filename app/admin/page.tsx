
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/Site";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  service_name: string;
  vehicle_registration: string | null;
  preferred_date: string | null;
  status: string;
  created_at: string;
};

type QuoteRequest = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  service_name: string;
  vehicle_registration: string | null;
  vehicle_make_model: string | null;
  description: string;
  budget: string | null;
  status: string;
  created_at: string;
  quoted_price: number | null;
  quote_details: string | null;
  decision: string;
};

type QuoteDraft = {
  price: string;
  details: string;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuoteDraft>>({});
  const [msg, setMsg] = useState("Checking access…");
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [routerReady, setRouterReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setRouterReady(true);
  }, []);

  useEffect(() => {
    if (!routerReady) return;
    let active = true;

    async function load() {
      if (!supabaseConfigured) {
        setMsg("Configure Supabase before opening the admin area.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (
        profileError ||
        !profile ||
        !["admin", "staff"].includes(profile.role)
      ) {
        setMsg(
          "Access denied. An administrator must assign your account the admin or staff role."
        );
        setLoading(false);
        return;
      }

      setAllowed(true);

      const [bookingResult, quoteResult] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id,customer_name,email,phone,service_name,vehicle_registration,preferred_date,status,created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("quote_requests")
          .select(
            "id,customer_name,email,phone,service_name,vehicle_registration,vehicle_make_model,description,budget,status,created_at,quoted_price,quote_details,decision"
          )
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (bookingResult.error) {
        setMsg(`Bookings: ${bookingResult.error.message}`);
      } else {
        setRows((bookingResult.data || []) as Booking[]);
      }

      if (quoteResult.error) {
        setMsg((previous) =>
          previous
            ? `${previous} | Quotations: ${quoteResult.error.message}`
            : `Quotations: ${quoteResult.error.message}`
        );
      } else {
        const loadedQuotes = (quoteResult.data || []) as QuoteRequest[];
        setQuotes(loadedQuotes);

        const initialDrafts: Record<string, QuoteDraft> = {};
        for (const quote of loadedQuotes) {
          initialDrafts[quote.id] = {
            price: quote.quoted_price == null
              ? ""
              : String(quote.quoted_price),
            details: quote.quote_details || "",
          };
        }
        setDrafts(initialDrafts);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [router, routerReady]);

  async function setBookingStatus(id: string, status: string) {
    setMsg("");

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setRows((old) =>
      old.map((row) => (row.id === id ? { ...row, status } : row))
    );
  }

  function updateDraft(
    id: string,
    field: keyof QuoteDraft,
    value: string
  ) {
    setDrafts((old) => ({
      ...old,
      [id]: {
        price: old[id]?.price || "",
        details: old[id]?.details || "",
        [field]: value,
      },
    }));
  }

  async function saveQuote(quote: QuoteRequest) {
    const draft = drafts[quote.id];
    const price = Number(draft?.price);

    if (
      !draft?.price.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setMsg("Enter a valid quotation price greater than zero.");
      return;
    }

    if (!draft.details.trim()) {
      setMsg("Enter the repair details before saving the quotation.");
      return;
    }

    setSavingId(quote.id);
    setMsg("");

    const { error } = await supabase
      .from("quote_requests")
      .update({
        quoted_price: price,
        quote_details: draft.details.trim(),
      })
      .eq("id", quote.id);

    setSavingId("");

    if (error) {
      setMsg(`Could not save quotation: ${error.message}`);
      return;
    }

    setQuotes((old) =>
      old.map((item) =>
        item.id === quote.id
          ? {
              ...item,
              quoted_price: price,
              quote_details: draft.details.trim(),
            }
          : item
      )
    );

    setMsg(
      "Quotation saved. The customer can review it when the customer dashboard is updated to display the new fields."
    );
  }

  return (
    <PageShell>
      <div className="page-head">
        <div className="shell">
          <h1>Garage administration</h1>
          <p>
            Manage service bookings and prepare customer quotations.
          </p>
        </div>
      </div>

      <section className="section soft">
        <div className="shell">
          {loading ? (
            <p>{msg}</p>
          ) : !allowed ? (
            <div className="form-wrap">
              <p className="error">{msg}</p>
              <p style={{ fontSize: 13 }}>
                Only authorized admin and staff accounts can access this
                area.
              </p>
            </div>
          ) : (
            <>
              {msg && <p className="error">{msg}</p>}

              <h2 style={{ fontFamily: "Montserrat" }}>
                Service bookings
              </h2>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Service / vehicle</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Update status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.customer_name}</strong>
                          <br />
                          {row.email}
                          <br />
                          {row.phone}
                        </td>
                        <td>
                          {row.service_name}
                          <br />
                          {row.vehicle_registration ||
                            "Vehicle not supplied"}
                        </td>
                        <td>{row.preferred_date || "Not specified"}</td>
                        <td>
                          <span className="pill">{row.status}</span>
                        </td>
                        <td>
                          <select
                            aria-label={`Update status for ${row.customer_name}`}
                            value={row.status}
                            onChange={(event) =>
                              setBookingStatus(
                                row.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="requested">Requested</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {rows.length === 0 && (
                  <div className="empty">No booking requests found.</div>
                )}
              </div>

              <h2
                style={{
                  fontFamily: "Montserrat",
                  marginTop: 36,
                }}
              >
                Quotation management
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Review each request, enter your price and explain the
                proposed repair work. Saving a quote does not authorize
                the repair; the customer must approve it.
              </p>

              {quotes.length === 0 ? (
                <div className="empty">
                  No quotation requests found.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 20,
                    marginTop: 20,
                  }}
                >
                  {quotes.map((quote) => (
                    <article
                      key={quote.id}
                      className="form-wrap"
                      style={{
                        width: "100%",
                        maxWidth: "none",
                        padding: 20,
                      }}
                    >
                      <h3 style={{ marginTop: 0 }}>
                        {quote.service_name}
                      </h3>

                      <p style={{ fontSize: 13 }}>
                        <strong>Customer:</strong> {quote.customer_name}
                        <br />
                        <strong>Email:</strong> {quote.email}
                        <br />
                        <strong>Phone:</strong> {quote.phone}
                        <br />
                        <strong>Vehicle:</strong>{" "}
                        {quote.vehicle_registration || "Not provided"}
                        {quote.vehicle_make_model
                          ? ` — ${quote.vehicle_make_model}`
                          : ""}
                        <br />
                        <strong>Request:</strong> {quote.description}
                        <br />
                        <strong>Customer budget:</strong>{" "}
                        {quote.budget || "Not specified"}
                        <br />
                        <strong>Submitted:</strong>{" "}
                        {new Date(quote.created_at).toLocaleDateString(
                          "en-KE"
                        )}
                        <br />
                        <strong>Customer decision:</strong>{" "}
                        {quote.decision}
                      </p>

                      {quote.quoted_price != null && (
                        <p>
                          <strong>Current quote:</strong>{" "}
                          KES {quote.quoted_price.toLocaleString("en-KE")}
                        </p>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          marginTop: 16,
                        }}
                      >
                        <label htmlFor={`price-${quote.id}`}>
                          Quotation price (KES)
                        </label>
                        <input
                          id={`price-${quote.id}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={drafts[quote.id]?.price || ""}
                          onChange={(event) =>
                            updateDraft(
                              quote.id,
                              "price",
                              event.target.value
                            )
                          }
                          placeholder="e.g. 15000"
                        />

                        <label htmlFor={`details-${quote.id}`}>
                          Repair details and quotation terms
                        </label>
                        <textarea
                          id={`details-${quote.id}`}
                          rows={4}
                          value={drafts[quote.id]?.details || ""}
                          onChange={(event) =>
                            updateDraft(
                              quote.id,
                              "details",
                              event.target.value
                            )
                          }
                          placeholder="Describe the proposed repairs, parts and labour included."
                        />

                        <button
                          type="button"
                          disabled={savingId === quote.id}
                          onClick={() => saveQuote(quote)}
                          style={{ marginTop: 8 }}
                        >
                          {savingId === quote.id
                            ? "Saving…"
                            : "Save quotation"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
