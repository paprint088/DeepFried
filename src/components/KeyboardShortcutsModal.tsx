import React, { useEffect } from "react";
import { Keyboard, X, Command } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F1" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "Checkout & POS Actions",
      items: [
        { keys: ["F4", "or", "Ctrl", "Enter"], desc: "Tag Transaction as Paid (open checkout modal)" },
        { keys: ["Enter"], desc: "Confirm payment & finalize order (inside payment modal)" },
        { keys: ["Ctrl", "H"], desc: "Hold active order to serve another customer" },
        { keys: ["Alt", "O"], desc: "Open Held Orders drawer" },
        { keys: ["Ctrl", "Shift", "X"], desc: "Clear active order (with confirmation & undo)" },
        { keys: ["Ctrl", "Z"], desc: "Undo last destructive action (restore item, order, category)" },
      ],
    },
    {
      title: "Catalog & Navigation",
      items: [
        { keys: ["1"], desc: "Switch to 1st category (Print)" },
        { keys: ["2"], desc: "Switch to 2nd category (Photocopy)" },
        { keys: ["3"], desc: "Switch to 3rd category (ID Picture)" },
        { keys: ["4"], desc: "Switch to 4th category (Others)" },
        { keys: ["5"], desc: "Switch to 5th category (Stationary)" },
        { keys: ["F2", "or", "/"], desc: "Quickly focus search field in item menu" },
        { keys: ["Esc"], desc: "Close any modal, drawer, or clear search" },
        { keys: ["?"], desc: "Show this Keyboard Shortcuts cheat sheet" },
      ],
    },
  ];

  return (
    <div
      id="keyboard-shortcuts-backdrop"
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="keyboard-shortcuts-modal"
        style={{
          background: "#1E2128",
          color: "#F3F1EA",
          width: "100%",
          maxWidth: 540,
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "rgba(14, 165, 196, 0.15)",
                color: "#0EA5C4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>Keyboard Shortcuts</h3>
              <p style={{ margin: 0, fontSize: 11.5, color: "#9CA3AF" }}>Fast cashier hotkeys for speed & efficiency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "18px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#0EA5C4",
                  marginBottom: 8,
                }}
              >
                {group.title}
              </div>
              <div
                style={{
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 12px",
                      borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ color: "#E5E7EB" }}>{item.desc}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 12 }}>
                      {item.keys.map((k, kidx) => {
                        if (k === "or") {
                          return (
                            <span key={kidx} style={{ fontSize: 11, color: "#9CA3AF", padding: "0 2px" }}>
                              or
                            </span>
                          );
                        }
                        return (
                          <kbd
                            key={kidx}
                            style={{
                              background: "#2D313A",
                              color: "#F3F1EA",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 5,
                              padding: "2px 7px",
                              fontSize: 11,
                              fontFamily: "monospace",
                              fontWeight: 700,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            }}
                          >
                            {k}
                          </kbd>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px 20px",
            background: "rgba(0,0,0,0.2)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11.5, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 5 }}>
            <Command size={13} /> Press <kbd style={{ padding: "1px 5px", background: "#2D313A", borderRadius: 4, fontSize: 10 }}>?</kbd> anytime to open this list
          </span>
          <button
            onClick={onClose}
            style={{
              background: "#0EA5C4",
              border: "none",
              color: "#0F172A",
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
