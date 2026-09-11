import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        // Prevent enter from triggering underlying forms
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      id="confirm-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 95,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        id="confirm-modal-content"
        style={{
          background: "#1E2128",
          color: "#F3F1EA",
          width: "100%",
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          overflow: "hidden",
          animation: "confirmFadeIn 0.15s ease-out",
        }}
      >
        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: isDanger ? "rgba(220, 38, 38, 0.15)" : "rgba(201, 138, 0, 0.15)",
              color: isDanger ? "#EF4444" : "#FBBF24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                {title}
              </h3>
              <button
                onClick={onCancel}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  borderRadius: 6,
                }}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "#D1D5DB",
              }}
            >
              {description}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "14px 22px 18px",
            background: "rgba(0, 0, 0, 0.2)",
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            id="confirm-modal-cancel-btn"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              color: "#E5E7EB",
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {cancelLabel}
          </button>

          <button
            id="confirm-modal-action-btn"
            onClick={onConfirm}
            autoFocus
            style={{
              background: isDanger ? "#DC2626" : "#D97706",
              border: "none",
              color: "#FFFFFF",
              padding: "9px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isDanger ? "0 2px 8px rgba(220, 38, 38, 0.4)" : "0 2px 8px rgba(217, 119, 6, 0.4)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
