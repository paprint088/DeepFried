import React from "react";
import { Check, X, AlertTriangle, Package } from "lucide-react";
import { OrderLine, PaymentMethodId } from "../types.ts";

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  slipNo?: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  tendered: number;
  change: number;
  paymentMethod: PaymentMethodId;
  paymentNote?: string;
  orderLines: OrderLine[];
  customerName?: string;
}

function peso(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return "\u20B1" + Math.round(v).toLocaleString("en-PH");
}

export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  slipNo,
  total,
  subtotal,
  discountAmount,
  tendered,
  change,
  paymentMethod,
  paymentNote,
  orderLines,
  customerName,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const methodLabel =
    paymentMethod === "cash" ? "Cash" : paymentMethod === "ewallet" ? "E-wallet" : "Other";

  // Check if any tracked items are in the order and check for potential negative stock
  const trackedItems = orderLines.filter((l) => l.trackStock);
  const stockShortages = trackedItems.filter((l) => typeof l.stock === "number" && l.stock < l.qty);

  return (
    <div
      id="payment-confirm-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 80,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="payment-confirm-dialog"
        style={{
          background: "#F3F1EA",
          borderRadius: 14,
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
          border: "1px solid #262931",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#1B1D22",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#0EA5C4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Check size={16} strokeWidth={2.5} />
            </div>
            <h3 style={{ margin: 0, color: "#F3F1EA", fontSize: 16, fontWeight: 700 }}>
              Confirm Payment
            </h3>
          </div>
          <button
            id="close-confirm-modal-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 18px", maxHeight: "75vh", overflowY: "auto" }}>
          {slipNo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#1B1D22",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                border: "1px solid #33363E",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#9CA3AF", textTransform: "uppercase" }}>
                Order Slip Number
              </span>
              <span className="mono" style={{ background: "#0EA5C4", color: "#0F172A", padding: "2px 8px", borderRadius: 6, fontWeight: 800, fontSize: 13.5 }}>
                #{slipNo}
              </span>
            </div>
          )}

          {stockShortages.length > 0 && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 12,
                color: "#991B1B",
              }}
            >
              <AlertTriangle size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
              <div>
                <b>Warning: Low/Insufficient Stock!</b>
                {stockShortages.map((s) => (
                  <div key={s.id}>
                    {s.name}: ordering {s.qty}, only {s.stock ?? 0} in stock.
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#4B4F58", lineHeight: 1.4 }}>
            Mark transaction as <b>PAID</b> and finalize sale?
          </p>

          {/* Amount Box */}
          <div
            style={{
              background: "#E7E3D8",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#4B4F58", fontWeight: 600 }}>Total Due</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: "#1B1D22" }}>
                {peso(total)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#D6247A",
                  marginTop: 3,
                }}
              >
                <span>Discount applied</span>
                <span className="mono">-{peso(discountAmount)}</span>
              </div>
            )}

            <div
              style={{
                borderTop: "1px dashed #C9C4B5",
                margin: "8px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "#4B4F58",
              }}
            >
              <span>Payment Mode</span>
              <span style={{ fontWeight: 600, color: "#1B1D22" }}>
                {methodLabel}
                {paymentNote ? ` (${paymentNote})` : ""}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "#4B4F58",
                marginTop: 4,
              }}
            >
              <span>Amount Received</span>
              <span className="mono" style={{ fontWeight: 600, color: "#1B1D22" }}>
                {peso(tendered)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#1B1D22",
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              <span>Change to Customer</span>
              <span className="mono" style={{ color: change < 0 ? "#C0392B" : "#D6247A" }}>
                {peso(Math.max(0, change))}
              </span>
            </div>
          </div>

          {/* Customer info if present */}
          {customerName && (
            <div
              style={{
                fontSize: 12,
                color: "#4B4F58",
                marginBottom: 10,
                background: "#fff",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #E7E3D8",
              }}
            >
              Customer / Sold To: <b>{customerName}</b>
            </div>
          )}

          {/* Items breakdown */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              border: "1px solid #E7E3D8",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8A8D93",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Order Items ({orderLines.reduce((acc, l) => acc + l.qty, 0)})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {orderLines.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    color: "#1B1D22",
                  }}
                >
                  <span style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.qty}&times; {l.name}
                    {l.trackStock && (
                      <span
                        style={{
                          fontSize: 10.5,
                          marginLeft: 6,
                          color: "#0E9488",
                          fontWeight: 600,
                        }}
                      >
                        (stock: {l.stock ?? 0} &rarr; {Math.max(0, (l.stock ?? 0) - l.qty)})
                      </span>
                    )}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {peso(l.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {trackedItems.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                color: "#0E9488",
                marginBottom: 6,
              }}
            >
              <Package size={13} />
              <span>Stock for {trackedItems.length} physical merchandise item(s) will be deducted.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: "12px 18px",
            background: "#E7E3D8",
            display: "flex",
            gap: 10,
            borderTop: "1px solid #D6D3C7",
          }}
        >
          <button
            id="cancel-payment-btn"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid #B8BCC4",
              background: "#fff",
              color: "#4B4F58",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            id="confirm-payment-btn"
            onClick={onConfirm}
            style={{
              flex: 1.3,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "#1B1D22",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Check size={15} color="#0EA5C4" /> Confirm &amp; Tag Paid
          </button>
        </div>
      </div>
    </div>
  );
};
