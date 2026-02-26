import { useState, useEffect } from "react";

const PRICE_PER_TUBE = 600;

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const getDeliveryDate = (bookingDate) => {
  if (!bookingDate) return "";
  const d = new Date(bookingDate);
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

const buildWhatsAppMessage = (b) => {
  const delivery = formatDate(getDeliveryDate(b.bookingDate));
  const total = (b.tubes * PRICE_PER_TUBE).toLocaleString();
  return (
    `🍄 Dear ${b.name},\n` +
    `Thank you for booking ${b.tubes} mushroom tube(s) with Miru Mushrooms! 🌿\n\n` +
    `📦 Delivery Date: ${delivery}\n` +
    `(30 days from your booking date)\n\n` +
    `💰 Total Amount: RWF ${total}\n\n` +
    `🙏 Thank you for trusting us - Miru Mushrooms Team 🍄`
  );
};

const buildWaLink = (b) => {
  const msg = buildWhatsAppMessage(b);
  const phone = b.phone.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

const exportToExcel = (bookings) => {
  import(
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
  ).then(() => {
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
      formatDate(getDeliveryDate(b.bookingDate)),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [5, 25, 18, 14, 18, 14, 20, 14].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "Miru_Mushrooms_Bookings.xlsx");
  });
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  tubes: "",
  bookingDate: new Date().toISOString().split("T")[0],
  location: "",
};

// ── WhatsApp Modal ─────────────────────────────────────────────
function WhatsAppModal({ booking, onClose }) {
  const [copied, setCopied] = useState(false);
  const msg = buildWhatsAppMessage(booking);
  const link = buildWaLink(booking);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          background: "#1a2e1a",
          borderRadius: "20px 20px 0 0",
          padding: "0 0 env(safe-area-inset-bottom,16px)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 0",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "#4a7c59",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid #2d4a2d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: "bold", color: "#c8e6c9" }}>
              💬 WhatsApp Message
            </div>
            <div style={{ fontSize: 12, color: "#6a9c6a", marginTop: 2 }}>
              For {booking.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "#2d4a2d",
              color: "#c8e6c9",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* TOP WhatsApp button */}
        <div style={{ padding: "14px 20px 0" }}>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "14px 0",
              borderRadius: 12,
              background: "#25D366",
              color: "white",
              fontWeight: "bold",
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(37,211,102,0.35)",
            }}
          >
            <span style={{ fontSize: 20 }}>💬</span> Open in WhatsApp
          </a>
        </div>

        {/* Message preview */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div
            style={{
              fontSize: 11,
              color: "#4a7c59",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Message Preview
          </div>
          <div
            style={{
              background: "#0f1a0f",
              border: "1px solid #2d4a2d",
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              color: "#c8e6c9",
              whiteSpace: "pre-line",
              lineHeight: 1.8,
            }}
          >
            {msg}
          </div>
        </div>

        {/* BOTTOM buttons */}
        <div style={{ padding: "0 20px 16px", display: "flex", gap: 10 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 12,
              border: "1px solid #4a7c59",
              background: copied ? "#1a3d1a" : "transparent",
              color: copied ? "#4ade80" : "#c8e6c9",
              fontSize: 15,
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Message"}
          </button>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 12,
              background: "#25D366",
              color: "white",
              fontWeight: "bold",
              fontSize: 15,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            💬 Send
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ───────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#1a2e1a",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom,0px))",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🗑</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#c8e6c9" }}>
            Delete Booking?
          </div>
          <div style={{ fontSize: 14, color: "#6a9c6a", marginTop: 6 }}>
            This cannot be undone.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              border: "1px solid #4a7c59",
              background: "transparent",
              color: "#c8e6c9",
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: "#dc2626",
              color: "white",
              fontSize: 15,
              fontWeight: "bold",
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        background: type === "error" ? "#7f1d1d" : "#1a3d1a",
        color: "#e8dcc8",
        padding: "12px 20px",
        borderRadius: 24,
        fontSize: 14,
        fontFamily: "Georgia, serif",
        border: `1px solid ${type === "error" ? "#dc2626" : "#4ade80"}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {type === "error" ? "🗑 " : "✓ "}
      {msg}
    </div>
  );
}

// ── Booking Card ───────────────────────────────────────────────
function BookingCard({ b, onEdit, onDelete, onWhatsApp }) {
  const delivery = formatDate(getDeliveryDate(b.bookingDate));
  const isUpcoming =
    getDeliveryDate(b.bookingDate) >= new Date().toISOString().split("T")[0];

  return (
    <div
      style={{
        background: "#1a2e1a",
        border: "1px solid #2d4a2d",
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#2d4a2d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: "bold",
              color: "#4ade80",
              flexShrink: 0,
            }}
          >
            {b.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#c8e6c9" }}>
              {b.name}
            </div>
            <div style={{ fontSize: 12, color: "#6a9c6a" }}>📞 {b.phone}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#4ade80" }}>
            {b.tubes.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#6a9c6a" }}>tubes</div>
        </div>
      </div>

      {/* Info chips */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}
      >
        {[
          { icon: "📍", text: b.location },
          { icon: "📅", text: formatDate(b.bookingDate) },
          { icon: "📦", text: `Delivery: ${delivery}`, green: true },
          {
            icon: "💰",
            text: `RWF ${(b.tubes * PRICE_PER_TUBE).toLocaleString()}`,
          },
        ].map((chip) => (
          <span
            key={chip.text}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 20,
              background: "#0f1a0f",
              color: chip.green ? "#4ade80" : "#9ab89a",
              border: `1px solid ${chip.green ? "#2d4a2d" : "#1a2e1a"}`,
            }}
          >
            {chip.icon} {chip.text}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        <button
          onClick={() => onWhatsApp(b)}
          style={{
            gridColumn: "1 / 3",
            padding: "12px 0",
            borderRadius: 10,
            border: "none",
            background: "#25D366",
            color: "white",
            fontSize: 14,
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: "Georgia, serif",
          }}
        >
          💬 WhatsApp
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onEdit(b)}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid #2d4a2d",
              background: "transparent",
              color: "#9ab89a",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            ✏
          </button>
          <button
            onClick={() => onDelete(b.id)}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid #7f1d1d",
              background: "transparent",
              color: "#f87171",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("miru_bookings") || "[]");
    } catch {
      return [];
    }
  });
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [waBooking, setWaBooking] = useState(null);
  const [search, setSearch] = useState("");

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
      setBookings([
        ...bookings,
        { ...form, tubes: Number(form.tubes), id: Date.now() },
      ]);
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
    setView("form");
  };

  const handleDelete = (id) => {
    setBookings(bookings.filter((b) => b.id !== id));
    setDeleteId(null);
    showToast("Booking deleted.", "error");
  };

  const totalTubes = bookings.reduce((s, b) => s + b.tubes, 0);
  const totalRevenue = totalTubes * PRICE_PER_TUBE;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(
    (b) => getDeliveryDate(b.bookingDate) >= today
  ).length;
  const filtered = bookings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search)
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1a0f",
        fontFamily: "Georgia, serif",
        color: "#e8dcc8",
        paddingBottom: 80,
      }}
    >
      {toast && <Toast {...toast} />}
      {deleteId && (
        <DeleteModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {waBooking && (
        <WhatsAppModal booking={waBooking} onClose={() => setWaBooking(null)} />
      )}

      {/* ── Header ── */}
      <div
        style={{
          background: "#1a2e1a",
          borderBottom: "1px solid #2d4a2d",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🍄</span>
            <div>
              <div
                style={{ fontSize: 15, fontWeight: "bold", color: "#c8e6c9" }}
              >
                Miru Mushrooms
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#6a9c6a",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Booking Manager
              </div>
            </div>
          </div>
          <button
            onClick={() => exportToExcel(bookings)}
            style={{
              padding: "8px 14px",
              borderRadius: 20,
              border: "1px solid #4a7c59",
              background: "transparent",
              color: "#c8e6c9",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            ⬇ Excel
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "16px 16px 0" }}>
        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                {
                  label: "Bookings",
                  value: bookings.length,
                  icon: "📋",
                  accent: "#4a7c59",
                },
                {
                  label: "Tubes Booked",
                  value: totalTubes.toLocaleString(),
                  icon: "🌱",
                  accent: "#2d6a4f",
                },
                {
                  label: "Revenue (RWF)",
                  value: totalRevenue.toLocaleString(),
                  icon: "💰",
                  accent: "#1b4332",
                },
                {
                  label: "Upcoming",
                  value: upcoming,
                  icon: "📦",
                  accent: "#3d5a3e",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  style={{
                    background: "#1a2e1a",
                    border: "1px solid #2d4a2d",
                    borderRadius: 12,
                    padding: 14,
                    borderLeft: `3px solid ${k.accent}`,
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{k.icon}</div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#c8e6c9",
                    }}
                  >
                    {k.value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6a9c6a",
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {k.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#1a2e1a",
                border: "1px solid #2d4a2d",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#c8e6c9",
                  marginBottom: 12,
                }}
              >
                Recent Bookings
              </div>
              {bookings.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 0",
                    color: "#4a7c59",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
                  <div style={{ fontSize: 14 }}>No bookings yet</div>
                </div>
              ) : (
                [...bookings]
                  .reverse()
                  .slice(0, 3)
                  .map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: "1px solid #2d4a2d",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#c8e6c9",
                            fontSize: 14,
                          }}
                        >
                          {b.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6a9c6a" }}>
                          📍 {b.location}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            color: "#4ade80",
                            fontWeight: "bold",
                            fontSize: 14,
                          }}
                        >
                          {b.tubes.toLocaleString()} tubes
                        </div>
                        <div style={{ fontSize: 11, color: "#6a9c6a" }}>
                          📦 {formatDate(getDeliveryDate(b.bookingDate))}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS LIST */}
        {view === "bookings" && (
          <div>
            <input
              placeholder="🔍 Search name, location, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #2d4a2d",
                background: "#1a2e1a",
                color: "#e8dcc8",
                fontSize: 14,
                fontFamily: "Georgia, serif",
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
              }}
            />
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 0",
                  color: "#4a7c59",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                <div>{search ? "No results found." : "No bookings yet."}</div>
              </div>
            ) : (
              [...filtered]
                .reverse()
                .map((b) => (
                  <BookingCard
                    key={b.id}
                    b={b}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onWhatsApp={setWaBooking}
                  />
                ))
            )}
          </div>
        )}

        {/* FORM */}
        {view === "form" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div
                style={{ fontSize: 20, fontWeight: "bold", color: "#c8e6c9" }}
              >
                {editId ? "Edit Booking" : "New Booking"}
              </div>
              <div style={{ fontSize: 13, color: "#6a9c6a", marginTop: 4 }}>
                {editId
                  ? "Update the details below."
                  : "Fill in the farmer's details."}
              </div>
            </div>

            <div
              style={{
                background: "#1a2e1a",
                border: "1px solid #2d4a2d",
                borderRadius: 14,
                padding: 18,
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
                  label: "Tubes Booked",
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
                  placeholder: "e.g. Musanze",
                  type: "text",
                },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#9ab89a",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
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
                      padding: "13px 14px",
                      borderRadius: 10,
                      border: `1px solid ${
                        errors[field.key] ? "#dc2626" : "#2d4a2d"
                      }`,
                      background: "#0f1a0f",
                      color: "#e8dcc8",
                      fontSize: 15,
                      fontFamily: "Georgia, serif",
                      outline: "none",
                      boxSizing: "border-box",
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

              {/* Amount preview */}
              {form.tubes && Number(form.tubes) > 0 && (
                <div
                  style={{
                    background: "#0a140a",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#6a9c6a" }}>
                    Amount to pay
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#4ade80",
                    }}
                  >
                    RWF {(Number(form.tubes) * PRICE_PER_TUBE).toLocaleString()}
                  </span>
                </div>
              )}

              {/* WhatsApp preview */}
              {form.name && form.tubes && form.bookingDate && (
                <div
                  style={{
                    background: "#0a140a",
                    border: "1px solid #2d4a2d",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#4a7c59",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    💬 Message Preview
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#9ab89a",
                      whiteSpace: "pre-line",
                      lineHeight: 1.8,
                    }}
                  >
                    {buildWhatsAppMessage({
                      ...form,
                      tubes: Number(form.tubes),
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 10,
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
                    padding: "14px 18px",
                    borderRadius: 10,
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
      </div>

      {/* ── Bottom Nav ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#1a2e1a",
          borderTop: "1px solid #2d4a2d",
          display: "flex",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {[
          { v: "dashboard", icon: "📊", label: "Dashboard" },
          { v: "bookings", icon: "📋", label: "Bookings" },
          { v: "form", icon: "➕", label: "Add" },
        ].map((tab) => (
          <button
            key={tab.v}
            onClick={() => {
              setView(tab.v);
              if (tab.v !== "form") {
                setForm(EMPTY_FORM);
                setEditId(null);
                setErrors({});
              }
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 10,
                color: view === tab.v ? "#4ade80" : "#6a9c6a",
                fontFamily: "Georgia, serif",
                letterSpacing: 0.5,
              }}
            >
              {tab.label}
            </span>
            {view === tab.v && (
              <div
                style={{
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  background: "#4ade80",
                  marginTop: 1,
                }}
              />
            )}
          </button>
        ))}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        input:focus { border-color: #4a7c59 !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f1a0f; } ::-webkit-scrollbar-thumb { background: #2d4a2d; border-radius: 2px; }
      `}</style>
    </div>
  );
}
