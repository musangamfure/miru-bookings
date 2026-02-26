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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
};

// ── Shared: WhatsApp Modal (bottom sheet on mobile, centered on desktop) ──────
function WhatsAppModal({ booking, onClose, isMobile }) {
  const [copied, setCopied] = useState(false);
  const msg = buildWhatsAppMessage(booking);
  const link = buildWaLink(booking);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const containerStyle = isMobile
    ? {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }
    : {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      };

  const panelStyle = isMobile
    ? {
        background: "#1a2e1a",
        borderRadius: "20px 20px 0 0",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
      }
    : {
        background: "#1a2e1a",
        borderRadius: 16,
        maxWidth: 480,
        width: "100%",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #2d4a2d",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      };

  return (
    <div
      style={containerStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={panelStyle}>
        {isMobile && (
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
        )}
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
              fontSize: 18,
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
              boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
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
              padding: "13px 0",
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
              padding: "13px 0",
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

// ── Shared: Delete Modal ───────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, isMobile }) {
  const containerStyle = isMobile
    ? {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
      }
    : {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };

  const panelStyle = isMobile
    ? {
        width: "100%",
        background: "#1a2e1a",
        borderRadius: "20px 20px 0 0",
        padding: "20px 20px calc(20px + env(safe-area-inset-bottom,0px))",
      }
    : {
        background: "#1a2e1a",
        border: "1px solid #4a7c59",
        borderRadius: 12,
        padding: 32,
        maxWidth: 360,
        width: "90%",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      };

  return (
    <div
      style={containerStyle}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          ...panelStyle,
          fontFamily: "Georgia, serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🗑</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#c8e6c9",
            marginBottom: 8,
          }}
        >
          Delete Booking?
        </div>
        <div style={{ fontSize: 14, color: "#6a9c6a", marginBottom: 24 }}>
          This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 10,
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
              padding: 13,
              borderRadius: 10,
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

// ── Shared: Toast ──────────────────────────────────────────────
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

// ── Shared: Booking Form ───────────────────────────────────────
function BookingForm({ form, setForm, editId, onSave, onCancel }) {
  const [errors, setErrors] = useState({});

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

  const fields = [
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
  ];

  const preview =
    form.name && form.tubes && form.bookingDate
      ? buildWhatsAppMessage({ ...form, tubes: Number(form.tubes) })
      : null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#c8e6c9" }}>
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
          padding: 20,
        }}
      >
        {fields.map((field) => (
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
              <div style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
                ⚠ {errors[field.key]}
              </div>
            )}
          </div>
        ))}

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
              style={{ fontSize: 16, fontWeight: "bold", color: "#4ade80" }}
            >
              RWF {(Number(form.tubes) * PRICE_PER_TUBE).toLocaleString()}
            </span>
          </div>
        )}

        {preview && (
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
              {preview}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              if (validate()) onSave(form);
            }}
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
            onClick={onCancel}
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
  );
}

// ── Mobile: Booking Card ───────────────────────────────────────
function MobileBookingCard({ b, onEdit, onDelete, onWhatsApp }) {
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
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#c8e6c9" }}>
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
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}
      >
        {[
          { icon: "📍", text: b.location },
          { icon: "📅", text: formatDate(b.bookingDate) },
          {
            icon: "📦",
            text: `Delivery: ${formatDate(getDeliveryDate(b.bookingDate))}`,
            green: true,
          },
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
              border: "1px solid #1a2e1a",
            }}
          >
            {chip.icon} {chip.text}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 8,
        }}
      >
        <button
          onClick={() => onWhatsApp(b)}
          style={{
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
        <button
          onClick={() => onEdit(b)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #2d4a2d",
            background: "transparent",
            color: "#9ab89a",
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
          }}
        >
          ✏
        </button>
        <button
          onClick={() => onDelete(b.id)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #7f1d1d",
            background: "transparent",
            color: "#f87171",
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ── Desktop: Booking Row ───────────────────────────────────────
function DesktopBookingRow({
  b,
  onEdit,
  onDelete,
  onWhatsApp,
  copiedId,
  setCopiedId,
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(buildWhatsAppMessage(b)).then(() => {
      setCopiedId(b.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div
      style={{
        background: "#1a2e1a",
        border: "1px solid #2d4a2d",
        borderRadius: 12,
        padding: 20,
        marginBottom: 10,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4a7c59")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2d4a2d")}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            minWidth: 200,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#2d4a2d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: "bold",
              color: "#4ade80",
              flexShrink: 0,
            }}
          >
            {b.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: "bold", color: "#c8e6c9", fontSize: 16 }}>
              {b.name}
            </div>
            <div style={{ fontSize: 12, color: "#6a9c6a" }}>📞 {b.phone}</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "#9ab89a" }}>
            📍 {b.location}
          </span>
          <span style={{ fontSize: 13, color: "#9ab89a" }}>
            📅 {formatDate(b.bookingDate)}
          </span>
          <span style={{ fontSize: 13, color: "#4ade80" }}>
            📦 {formatDate(getDeliveryDate(b.bookingDate))}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#4ade80" }}>
              {b.tubes.toLocaleString()} tubes
            </div>
            <div style={{ fontSize: 12, color: "#9ab89a" }}>
              RWF {(b.tubes * PRICE_PER_TUBE).toLocaleString()}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onWhatsApp(b)}
              style={{
                padding: "7px 12px",
                borderRadius: 7,
                border: "none",
                background: "#25D366",
                color: "white",
                fontSize: 12,
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "Georgia, serif",
              }}
            >
              💬 WhatsApp
            </button>
            <button
              onClick={handleCopy}
              style={{
                padding: "7px 12px",
                borderRadius: 7,
                border: "1px solid #2d4a2d",
                background: copiedId === b.id ? "#1a3d1a" : "transparent",
                color: copiedId === b.id ? "#4ade80" : "#9ab89a",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "Georgia, serif",
              }}
            >
              {copiedId === b.id ? "✓ Copied" : "📋 Copy"}
            </button>
            <button
              onClick={() => onEdit(b)}
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
              onClick={() => onDelete(b.id)}
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
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
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
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [waBooking, setWaBooking] = useState(null);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    localStorage.setItem("miru_bookings", JSON.stringify(bookings));
  }, [bookings]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (formData) => {
    if (editId !== null) {
      setBookings(
        bookings.map((b) =>
          b.id === editId
            ? { ...b, ...formData, tubes: Number(formData.tubes) }
            : b
        )
      );
      setEditId(null);
      showToast("Booking updated!");
    } else {
      setBookings([
        ...bookings,
        { ...formData, tubes: Number(formData.tubes), id: Date.now() },
      ]);
      showToast("Booking added!");
    }
    setForm(EMPTY_FORM);
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
    setView(isMobile ? "form" : "add");
  };

  const handleDelete = (id) => {
    setBookings(bookings.filter((b) => b.id !== id));
    setDeleteId(null);
    showToast("Booking deleted.", "error");
  };

  const goTo = (v) => {
    setView(v);
    if (v !== "add" && v !== "form") {
      setForm(EMPTY_FORM);
      setEditId(null);
    }
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

  const kpis = [
    {
      label: "Total Bookings",
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
      label: "Upcoming Deliveries",
      value: upcoming,
      icon: "📦",
      accent: "#3d5a3e",
    },
  ];

  // ── MOBILE LAYOUT ────────────────────────────────────────────
  if (isMobile) {
    const mView = view === "add" ? "form" : view;
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
            isMobile
            onConfirm={() => handleDelete(deleteId)}
            onCancel={() => setDeleteId(null)}
          />
        )}
        {waBooking && (
          <WhatsAppModal
            isMobile
            booking={waBooking}
            onClose={() => setWaBooking(null)}
          />
        )}

        {/* Sticky header */}
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

        <div style={{ padding: "16px 16px 0" }}>
          {mView === "dashboard" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {kpis.map((k) => (
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
                    <div style={{ fontSize: 20, marginBottom: 4 }}>
                      {k.icon}
                    </div>
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: "#c8e6c9",
                    }}
                  >
                    Recent Bookings
                  </div>
                  <button
                    onClick={() => goTo("bookings")}
                    style={{
                      fontSize: 12,
                      color: "#4a7c59",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    View All →
                  </button>
                </div>
                {bookings.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      color: "#4a7c59",
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
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

          {mView === "bookings" && (
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
                    <MobileBookingCard
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

          {mView === "form" && (
            <BookingForm
              form={form}
              setForm={setForm}
              editId={editId}
              onSave={handleSave}
              onCancel={() => {
                setForm(EMPTY_FORM);
                setEditId(null);
                goTo("bookings");
              }}
            />
          )}
        </div>

        {/* Bottom nav */}
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
            ["dashboard", "📊", "Dashboard"],
            ["bookings", "📋", "Bookings"],
            ["form", "➕", "Add"],
          ].map(([v, icon, label]) => (
            <button
              key={v}
              onClick={() => goTo(v)}
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
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span
                style={{
                  fontSize: 10,
                  color: mView === v ? "#4ade80" : "#6a9c6a",
                  fontFamily: "Georgia, serif",
                }}
              >
                {label}
              </span>
              {mView === v && (
                <div
                  style={{
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    background: "#4ade80",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <style>{`* { box-sizing: border-box; } @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } } input:focus { border-color: #4a7c59 !important; } input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }`}</style>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ───────────────────────────────────────────
  const dView = view === "form" ? "add" : view;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1a0f",
        fontFamily: "Georgia, serif",
        color: "#e8dcc8",
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

      {/* Desktop header */}
      <header
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
                style={{ fontSize: 18, fontWeight: "bold", color: "#c8e6c9" }}
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
                onClick={() => goTo(v)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "Georgia, serif",
                  background: dView === v ? "#4a7c59" : "transparent",
                  color: dView === v ? "#fff" : "#9ab89a",
                  fontWeight: dView === v ? "bold" : "normal",
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Dashboard */}
        {dView === "dashboard" && (
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {kpis.map((k) => (
                <div
                  key={k.label}
                  style={{
                    background: "#1a2e1a",
                    border: "1px solid #2d4a2d",
                    borderRadius: 12,
                    padding: 20,
                    borderLeft: `4px solid ${k.accent}`,
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
                      fontSize: 11,
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
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 16, color: "#c8e6c9" }}>
                  Recent Bookings
                </h2>
                <div style={{ display: "flex", gap: 10 }}>
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
                  <button
                    onClick={() => goTo("bookings")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#4a7c59",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    View All →
                  </button>
                </div>
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
                  <button
                    onClick={() => goTo("add")}
                    style={{
                      marginTop: 16,
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: "#4a7c59",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 14,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    ➕ Add First Booking
                  </button>
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
                        padding: "14px 0",
                        borderBottom: "1px solid #2d4a2d",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", color: "#c8e6c9" }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#6a9c6a" }}>
                          📍 {b.location} · 📅 {formatDate(b.bookingDate)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#4ade80", fontWeight: "bold" }}>
                          {b.tubes.toLocaleString()} tubes
                        </div>
                        <div style={{ fontSize: 12, color: "#6a9c6a" }}>
                          📦 {formatDate(getDeliveryDate(b.bookingDate))}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Add/Edit form */}
        {dView === "add" && (
          <div style={{ maxWidth: 600 }}>
            <BookingForm
              form={form}
              setForm={setForm}
              editId={editId}
              onSave={handleSave}
              onCancel={() => {
                setForm(EMPTY_FORM);
                setEditId(null);
                goTo("bookings");
              }}
            />
          </div>
        )}

        {/* Bookings list */}
        {dView === "bookings" && (
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
                  onClick={() => goTo("add")}
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
              [...filtered]
                .reverse()
                .map((b) => (
                  <DesktopBookingRow
                    key={b.id}
                    b={b}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onWhatsApp={setWaBooking}
                    copiedId={copiedId}
                    setCopiedId={setCopiedId}
                  />
                ))
            )}
          </div>
        )}
      </main>

      <style>{`* { box-sizing: border-box; } @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } } button:hover { opacity: 0.88; } a:hover { opacity: 0.88; } input:focus { border-color: #4a7c59 !important; } input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }`}</style>
    </div>
  );
}
