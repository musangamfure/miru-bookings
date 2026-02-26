import { useState, useEffect, useRef } from "react";

const PRICE_PER_TUBE = 600;

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const deliveryDate = (bookingDate) => {
  if (!bookingDate) return "";
  const d = new Date(bookingDate);
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

const buildWhatsAppMessage = (b) => {
  const delivery = formatDate(deliveryDate(b.bookingDate));
  const total = (b.tubes * PRICE_PER_TUBE).toLocaleString();
  return `🍄 Dear ${b.name},\nThank you for booking ${b.tubes} mushroom tube(s) with Miru Mushrooms! 🌿\n\n📦 Delivery Date: ${delivery}\n(30 days from your booking date)\n\n💰 Total Amount: RWF ${total}\n\n🙏 Thank you for trusting us - Miru Mushrooms Team 🍄`;
};

const buildWaLink = (b) => {
  const msg = buildWhatsAppMessage(b);
  const phone = b.phone.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

// Excel export using SheetJS
const exportToExcel = (bookings) => {
  import("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
    .then(() => {
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();
      const headers = [
        "No.",
        "Farmer Name",
        "Telephone",
        "Tubes Booked",
        "Amount Paid (RWF)",
        "Booking Date",
        "Farm Location",
        "Delivery Date",
      ];
      const rows = bookings.map((b, i) => [
        i + 1,
        b.name,
        b.phone,
        b.tubes,
        b.tubes * PRICE_PER_TUBE,
        formatDate(b.bookingDate),
        b.location,
        formatDate(deliveryDate(b.bookingDate)),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 20 },
        { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, "Miru_Mushrooms_Bookings.xlsx");
    })
    .catch(() => alert("Could not load Excel library. Please try again."));
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  tubes: "",
  bookingDate: new Date().toISOString().split("T")[0],
  location: "",
};

export default function App() {
  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("miru_bookings") || "[]");
    } catch {
      return [];
    }
  });
  const [view, setView] = useState("dashboard"); // dashboard | add | bookings
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("miru_bookings", JSON.stringify(bookings));
  }, [bookings]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    else if (!/^\d{9,15}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid number with country code";
    if (!form.tubes || isNaN(form.tubes) || Number(form.tubes) <= 0)
      e.tubes = "Enter a valid number";
    if (!form.bookingDate) e.bookingDate = "Required";
    if (!form.location.trim()) e.location = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editId !== null) {
      setBookings(
        bookings.map((b) =>
          b.id === editId ? { ...b, ...form, tubes: Number(form.tubes) } : b
        )
      );
      setEditId(null);
      showToast("Booking updated!");
    } else {
      const newBooking = { ...form, tubes: Number(form.tubes), id: Date.now() };
      setBookings([...bookings, newBooking]);
      showToast("Booking added!");
    }
    setForm(EMPTY_FORM);
    setErrors({});
    setView("bookings");
  };

  const handleEdit = (b) => {
    setForm({
      name: b.name,
      phone: b.phone,
      tubes: b.tubes,
      bookingDate: b.bookingDate,
      location: b.location,
    });
    setEditId(b.id);
    setView("add");
  };

  const handleDelete = (id) => {
    setBookings(bookings.filter((b) => b.id !== id));
    setDeleteId(null);
    showToast("Booking deleted.", "error");
  };

  const handleCopy = (b) => {
    navigator.clipboard.writeText(buildWhatsAppMessage(b)).then(() => {
      setCopiedId(b.id);
      showToast("Message copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = bookings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search)
  );

  const totalTubes = bookings.reduce((s, b) => s + b.tubes, 0);
  const totalRevenue = totalTubes * PRICE_PER_TUBE;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(
    (b) => deliveryDate(b.bookingDate) >= today
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1a0f",
        fontFamily: "'Georgia', serif",
        color: "#e8dcc8",
      }}
    >
      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === "error" ? "#7f1d1d" : "#1a3d1a",
            color: "#e8dcc8",
            padding: "12px 20px",
            borderRadius: 8,
            border: `1px solid ${
              toast.type === "error" ? "#dc2626" : "#4ade80"
            }`,
            fontSize: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.type === "error" ? "🗑 " : "✓ "}
          {toast.msg}
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1a2e1a",
              border: "1px solid #4a7c59",
              borderRadius: 12,
              padding: 32,
              maxWidth: 360,
              width: "90%",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
              Delete Booking?
            </div>
            <div style={{ fontSize: 14, color: "#9ab89a", marginBottom: 24 }}>
              This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "1px solid #4a7c59",
                  background: "transparent",
                  color: "#e8dcc8",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div
        style={{
          background: "#1a2e1a",
          borderBottom: "1px solid #2d4a2d",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🍄</span>
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#c8e6c9",
                  letterSpacing: 0.5,
                }}
              >
                Miru Mushrooms
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6a9c6a",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Booking Manager
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {[
              ["dashboard", "📊 Dashboard"],
              ["bookings", "📋 Bookings"],
              ["add", "➕ New Booking"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  if (v !== "add") {
                    setForm(EMPTY_FORM);
                    setEditId(null);
                    setErrors({});
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "Georgia, serif",
                  background: view === v ? "#4a7c59" : "transparent",
                  color: view === v ? "#fff" : "#9ab89a",
                  fontWeight: view === v ? "bold" : "normal",
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* ══════════ DASHBOARD ══════════ */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#c8e6c9",
                  margin: 0,
                }}
              >
                Overview
              </h1>
              <p style={{ color: "#6a9c6a", marginTop: 4, fontSize: 14 }}>
                Live summary of all bookings
              </p>
            </div>

            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {[
                {
                  label: "Total Bookings",
                  value: bookings.length,
                  icon: "📋",
                  color: "#4a7c59",
                },
                {
                  label: "Total Tubes Booked",
                  value: totalTubes.toLocaleString(),
                  icon: "🌱",
                  color: "#2d6a4f",
                },
                {
                  label: "Total Revenue (RWF)",
                  value: totalRevenue.toLocaleString(),
                  icon: "💰",
                  color: "#1b4332",
                },
                {
                  label: "Upcoming Deliveries",
                  value: upcoming,
                  icon: "📦",
                  color: "#3d5a3e",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  style={{
                    background: "#1a2e1a",
                    border: "1px solid #2d4a2d",
                    borderRadius: 12,
                    padding: 20,
                    borderLeft: `4px solid ${k.color}`,
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: "bold",
                      color: "#c8e6c9",
                    }}
                  >
                    {k.value}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6a9c6a",
                      marginTop: 4,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {k.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Bookings */}
            <div
              style={{
                background: "#1a2e1a",
                border: "1px solid #2d4a2d",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 16, color: "#c8e6c9" }}>
                  Recent Bookings
                </h2>
                <button
                  onClick={() => exportToExcel(bookings)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #4a7c59",
                    background: "transparent",
                    color: "#c8e6c9",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  ⬇ Download Excel
                </button>
              </div>
              {bookings.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#4a7c59",
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                  <div>No bookings yet. Add your first one!</div>
                </div>
              ) : (
                [...bookings]
                  .reverse()
                  .slice(0, 5)
                  .map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderBottom: "1px solid #2d4a2d",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", color: "#c8e6c9" }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#6a9c6a" }}>
                          {b.location} · {formatDate(b.bookingDate)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#4ade80", fontWeight: "bold" }}>
                          {b.tubes.toLocaleString()} tubes
                        </div>
                        <div style={{ fontSize: 12, color: "#6a9c6a" }}>
                          📦 {formatDate(deliveryDate(b.bookingDate))}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ══════════ ADD / EDIT FORM ══════════ */}
        {view === "add" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#c8e6c9",
                  margin: 0,
                }}
              >
                {editId ? "Edit Booking" : "New Booking"}
              </h1>
              <p style={{ color: "#6a9c6a", marginTop: 4, fontSize: 14 }}>
                {editId
                  ? "Update the booking details below."
                  : "Fill in the details to register a new booking."}
              </p>
            </div>

            <div
              style={{
                background: "#1a2e1a",
                border: "1px solid #2d4a2d",
                borderRadius: 12,
                padding: 28,
              }}
            >
              {[
                {
                  key: "name",
                  label: "Farmer Name",
                  placeholder: "e.g. Uwimana Claudette",
                  type: "text",
                },
                {
                  key: "phone",
                  label: "Telephone (with country code)",
                  placeholder: "e.g. 250788123456",
                  type: "tel",
                },
                {
                  key: "tubes",
                  label: "Number of Tubes Booked",
                  placeholder: "e.g. 500",
                  type: "number",
                },
                {
                  key: "bookingDate",
                  label: "Booking Date",
                  placeholder: "",
                  type: "date",
                },
                {
                  key: "location",
                  label: "Farm Location",
                  placeholder: "e.g. Musanze, Northern Province",
                  type: "text",
                },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: "#9ab89a",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => {
                      setForm({ ...form, [field.key]: e.target.value });
                      setErrors({ ...errors, [field.key]: null });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 8,
                      boxSizing: "border-box",
                      border: `1px solid ${
                        errors[field.key] ? "#dc2626" : "#2d4a2d"
                      }`,
                      background: "#0f1a0f",
                      color: "#e8dcc8",
                      fontSize: 15,
                      fontFamily: "Georgia, serif",
                      outline: "none",
                    }}
                  />
                  {errors[field.key] && (
                    <div
                      style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}
                    >
                      ⚠ {errors[field.key]}
                    </div>
                  )}
                </div>
              ))}

              {/* Preview */}
              {form.name && form.tubes && form.bookingDate && (
                <div
                  style={{
                    background: "#0a140a",
                    border: "1px solid #2d4a2d",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#4a7c59",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    WhatsApp Message Preview
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#9ab89a",
                      whiteSpace: "pre-line",
                      lineHeight: 1.7,
                    }}
                  >
                    {buildWhatsAppMessage({
                      ...form,
                      tubes: Number(form.tubes),
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: "13px 0",
                    borderRadius: 8,
                    border: "none",
                    background: "#4a7c59",
                    color: "white",
                    fontSize: 15,
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {editId ? "Update Booking" : "Save Booking"}
                </button>
                <button
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setEditId(null);
                    setErrors({});
                    setView("bookings");
                  }}
                  style={{
                    padding: "13px 20px",
                    borderRadius: 8,
                    border: "1px solid #2d4a2d",
                    background: "transparent",
                    color: "#9ab89a",
                    fontSize: 15,
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ BOOKINGS TABLE ══════════ */}
        {view === "bookings" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#c8e6c9",
                    margin: 0,
                  }}
                >
                  All Bookings
                </h1>
                <p style={{ color: "#6a9c6a", marginTop: 4, fontSize: 14 }}>
                  {bookings.length} booking{bookings.length !== 1 ? "s" : ""}{" "}
                  registered
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  placeholder="🔍 Search name, location, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #2d4a2d",
                    background: "#1a2e1a",
                    color: "#e8dcc8",
                    fontSize: 13,
                    fontFamily: "Georgia, serif",
                    width: 240,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => exportToExcel(bookings)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid #4a7c59",
                    background: "transparent",
                    color: "#c8e6c9",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  ⬇ Excel
                </button>
                <button
                  onClick={() => {
                    setForm(EMPTY_FORM);
                    setEditId(null);
                    setErrors({});
                    setView("add");
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#4a7c59",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "Georgia, serif",
                    fontWeight: "bold",
                  }}
                >
                  ➕ Add Booking
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#4a7c59",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
                <div style={{ fontSize: 18 }}>
                  {search
                    ? "No bookings match your search."
                    : "No bookings yet."}
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[...filtered].reverse().map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      background: "#1a2e1a",
                      border: "1px solid #2d4a2d",
                      borderRadius: 12,
                      padding: 20,
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#4a7c59")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#2d4a2d")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      {/* Left: info */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "#2d4a2d",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: "bold",
                              color: "#4ade80",
                            }}
                          >
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#c8e6c9",
                                fontSize: 16,
                              }}
                            >
                              {b.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#6a9c6a" }}>
                              📞 {b.phone}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
                        >
                          <span style={{ fontSize: 13, color: "#9ab89a" }}>
                            📍 {b.location}
                          </span>
                          <span style={{ fontSize: 13, color: "#9ab89a" }}>
                            📅 Booked: {formatDate(b.bookingDate)}
                          </span>
                          <span style={{ fontSize: 13, color: "#4ade80" }}>
                            📦 Delivery:{" "}
                            {formatDate(deliveryDate(b.bookingDate))}
                          </span>
                        </div>
                      </div>

                      {/* Right: stats + actions */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 8,
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: "bold",
                              color: "#4ade80",
                            }}
                          >
                            {b.tubes.toLocaleString()} tubes
                          </div>
                          <div style={{ fontSize: 13, color: "#9ab89a" }}>
                            RWF {(b.tubes * PRICE_PER_TUBE).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <a
                            href={buildWaLink(b)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "7px 12px",
                              borderRadius: 7,
                              background: "#25D366",
                              color: "white",
                              fontSize: 12,
                              fontWeight: "bold",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            💬 WhatsApp
                          </a>
                          <button
                            onClick={() => handleCopy(b)}
                            style={{
                              padding: "7px 12px",
                              borderRadius: 7,
                              border: "1px solid #2d4a2d",
                              background:
                                copiedId === b.id ? "#1a3d1a" : "transparent",
                              color: copiedId === b.id ? "#4ade80" : "#9ab89a",
                              fontSize: 12,
                              cursor: "pointer",
                              fontFamily: "Georgia, serif",
                            }}
                          >
                            {copiedId === b.id ? "✓ Copied" : "📋 Copy"}
                          </button>
                          <button
                            onClick={() => handleEdit(b)}
                            style={{
                              padding: "7px 12px",
                              borderRadius: 7,
                              border: "1px solid #2d4a2d",
                              background: "transparent",
                              color: "#9ab89a",
                              fontSize: 12,
                              cursor: "pointer",
                              fontFamily: "Georgia, serif",
                            }}
                          >
                            ✏ Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(b.id)}
                            style={{
                              padding: "7px 12px",
                              borderRadius: 7,
                              border: "1px solid #7f1d1d",
                              background: "transparent",
                              color: "#f87171",
                              fontSize: 12,
                              cursor: "pointer",
                              fontFamily: "Georgia, serif",
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        button:hover { opacity: 0.88; }
        a:hover { opacity: 0.88; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
