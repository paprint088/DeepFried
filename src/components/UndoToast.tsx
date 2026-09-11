import React, { useEffect, useState } from "react";
import { RotateCcw, X, Check } from "lucide-react";

export interface UndoItem {
  id: string;
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoToastProps {
  undoItem: UndoItem | null;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ undoItem, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!undoItem) {
      setProgress(100);
      return;
    }

    const duration = undoItem.durationMs || 7000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [undoItem, onDismiss]);

  if (!undoItem) return null;

  return (
    <div
      id="undo-toast-banner"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 92,
        background: "#1E2128",
        color: "#F3F1EA",
        borderRadius: 12,
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
        maxWidth: 420,
        minWidth: 320,
        animation: "slideInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(214, 36, 122, 0.18)",
              color: "#D6247A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={16} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#F3F1EA",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {undoItem.message}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button
            id="undo-toast-btn"
            onClick={() => {
              undoItem.onUndo();
              onDismiss();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "#D6247A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 7,
              padding: "6px 11px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(214, 36, 122, 0.4)",
            }}
            title="Press Ctrl+Z to undo"
          >
            <RotateCcw size={13} strokeWidth={2.5} /> Undo
          </button>
          <button
            onClick={onDismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              borderRadius: 6,
            }}
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar indicating time remaining to undo */}
      <div style={{ height: 3, background: "rgba(255, 255, 255, 0.08)", width: "100%" }}>
        <div
          style={{
            height: "100%",
            background: "#D6247A",
            width: `${progress}%`,
            transition: "width 0.05s linear",
          }}
        />
      </div>
    </div>
  );
};
