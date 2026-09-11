import React, { useState, useMemo } from "react";
import { Package, AlertCircle, CheckCircle2, AlertTriangle, Plus, Minus, Search } from "lucide-react";
import { Category, MenuState, MenuItem } from "../types.ts";

interface StockTrackingTabProps {
  categories: Category[];
  menu: MenuState;
  onUpdateItemStock: (catId: string, itemId: string, updates: Partial<MenuItem>) => void;
  ink: Record<string, string>;
}

export const StockTrackingTab: React.FC<StockTrackingTabProps> = ({
  categories,
  menu,
  onUpdateItemStock,
  ink,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"sales" | "all" | "alert">("sales");

  // Flatten all items with their category info
  const itemsWithCategory = useMemo(() => {
    return Object.entries(menu).flatMap(([catId, items]) => {
      const cat = categories.find((c) => c.id === catId);
      const itemList = (items || []) as MenuItem[];
      return itemList.map((it) => ({
        ...it,
        catId,
        catName: cat?.name || "Uncategorized",
        catColor: cat?.color || ink.teal,
      }));
    });
  }, [menu, categories, ink.teal]);

  // Derived counts for overview summary
  const summary = useMemo(() => {
    let trackedCount = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    itemsWithCategory.forEach((it) => {
      if (it.trackStock) {
        trackedCount++;
        const s = it.stock ?? 0;
        const thresh = it.lowStockThreshold ?? 5;
        if (s <= 0) {
          outOfStockCount++;
        } else if (s <= thresh) {
          lowStockCount++;
        } else {
          inStockCount++;
        }
      }
    });

    return { trackedCount, inStockCount, lowStockCount, outOfStockCount };
  }, [itemsWithCategory]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return itemsWithCategory.filter((it) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = it.name.toLowerCase().includes(q);
        const matchCat = it.catName.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }

      // Filter tabs
      if (filterMode === "sales") {
        // Physical merchandise: either account is sales or tracking is on
        return it.account === "sales" || it.trackStock;
      }
      if (filterMode === "alert") {
        const s = it.stock ?? 0;
        const thresh = it.lowStockThreshold ?? 5;
        return it.trackStock && s <= thresh;
      }
      return true;
    });
  }, [itemsWithCategory, searchQuery, filterMode]);

  return (
    <div id="stock-tracking-tab-container" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Intro info */}
      <div style={{ fontSize: 12, color: "#6B6F76", lineHeight: 1.4 }}>
        Manage inventory counts, low-stock thresholds, and tracking toggles for physical merchandise and items.
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: "8px 10px",
            border: `1px solid ${ink.paperDim}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10.5, color: "#7D818A", textTransform: "uppercase", fontWeight: 700 }}>
            Tracked
          </div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: ink.key, marginTop: 2 }}>
            {summary.trackedCount}
          </div>
        </div>

        <div
          style={{
            background: summary.lowStockCount > 0 ? "#FEF3C7" : "#fff",
            borderRadius: 8,
            padding: "8px 10px",
            border: `1px solid ${summary.lowStockCount > 0 ? "#FCD34D" : ink.paperDim}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: summary.lowStockCount > 0 ? "#92400E" : "#7D818A",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Low Stock
          </div>
          <div
            className="mono"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: summary.lowStockCount > 0 ? "#B45309" : ink.key,
              marginTop: 2,
            }}
          >
            {summary.lowStockCount}
          </div>
        </div>

        <div
          style={{
            background: summary.outOfStockCount > 0 ? "#FEE2E2" : "#fff",
            borderRadius: 8,
            padding: "8px 10px",
            border: `1px solid ${summary.outOfStockCount > 0 ? "#FCA5A5" : ink.paperDim}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: summary.outOfStockCount > 0 ? "#991B1B" : "#7D818A",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Out of Stock
          </div>
          <div
            className="mono"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: summary.outOfStockCount > 0 ? "#DC2626" : ink.key,
              marginTop: 2,
            }}
          >
            {summary.outOfStockCount}
          </div>
        </div>
      </div>

      {/* Filter Mode & Search */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          <button
            id="filter-merchandise-btn"
            onClick={() => setFilterMode("sales")}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 7,
              border: filterMode === "sales" ? `1px solid ${ink.key}` : `1px solid ${ink.paperDim}`,
              background: filterMode === "sales" ? ink.key : "#fff",
              color: filterMode === "sales" ? "#fff" : "#6B6F76",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Merchandise &amp; Sales
          </button>
          <button
            id="filter-all-items-btn"
            onClick={() => setFilterMode("all")}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 7,
              border: filterMode === "all" ? `1px solid ${ink.key}` : `1px solid ${ink.paperDim}`,
              background: filterMode === "all" ? ink.key : "#fff",
              color: filterMode === "all" ? "#fff" : "#6B6F76",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            All Items
          </button>
          <button
            id="filter-alerts-btn"
            onClick={() => setFilterMode("alert")}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: 7,
              border: filterMode === "alert" ? `1px solid #C0392B` : `1px solid ${ink.paperDim}`,
              background: filterMode === "alert" ? "#C0392B" : "#fff",
              color: filterMode === "alert" ? "#fff" : "#6B6F76",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Alerts Only ({summary.lowStockCount + summary.outOfStockCount})
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={14}
            color="#8A8D93"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            id="stock-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchandise..."
            style={{
              width: "100%",
              padding: "7px 10px 7px 30px",
              borderRadius: 8,
              border: `1px solid ${ink.paperDim}`,
              background: "#fff",
              fontSize: 12.5,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Item List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "18px 12px",
              borderRadius: 9,
              textAlign: "center",
              fontSize: 12.5,
              color: "#8A8D93",
              border: `1px solid ${ink.paperDim}`,
            }}
          >
            No items matching the filter.
          </div>
        ) : (
          filteredItems.map((it) => {
            const isTracked = !!it.trackStock;
            const currentStock = it.stock ?? 0;
            const threshold = it.lowStockThreshold ?? 5;
            const isOutOfStock = isTracked && currentStock <= 0;
            const isLowStock = isTracked && currentStock > 0 && currentStock <= threshold;

            return (
              <div
                key={it.id}
                id={`stock-item-${it.id}`}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 12px",
                  border: isOutOfStock
                    ? "1px solid #FCA5A5"
                    : isLowStock
                    ? "1px solid #FCD34D"
                    : `1px solid ${ink.paperDim}`,
                  boxShadow: isOutOfStock ? "0 1px 4px rgba(220, 38, 38, 0.08)" : "none",
                }}
              >
                {/* Header Row: Name, Category, Badges */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: ink.key }}>
                        {it.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: it.catColor + "20",
                          color: it.catColor,
                        }}
                      >
                        {it.catName}
                      </span>

                      {/* INLINE STATUS BADGES */}
                      {isTracked && isOutOfStock && (
                        <span
                          id={`badge-out-of-stock-${it.id}`}
                          className="mono"
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: "#FEE2E2",
                            color: "#DC2626",
                            border: "1px solid #FCA5A5",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <AlertCircle size={11} strokeWidth={2.5} /> Out of stock
                        </span>
                      )}

                      {isTracked && isLowStock && (
                        <span
                          id={`badge-low-stock-${it.id}`}
                          className="mono"
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #FCD34D",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <AlertTriangle size={11} strokeWidth={2.5} /> Low Stock ({currentStock} left)
                        </span>
                      )}

                      {isTracked && !isOutOfStock && !isLowStock && (
                        <span
                          id={`badge-in-stock-${it.id}`}
                          className="mono"
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: "#D1FAE5",
                            color: "#047857",
                            border: "1px solid #A7F3D0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <CheckCircle2 size={11} strokeWidth={2.5} /> In Stock ({currentStock})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tracking Toggle Switch */}
                  <label
                    id={`toggle-tracking-${it.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: isTracked ? ink.teal : "#8A8D93",
                      cursor: "pointer",
                      userSelect: "none",
                      flex: "0 0 auto",
                    }}
                  >
                    <span>{isTracked ? "Tracked" : "Untracked"}</span>
                    <input
                      type="checkbox"
                      checked={isTracked}
                      onChange={(e) => {
                        onUpdateItemStock(it.catId, it.id, {
                          trackStock: e.target.checked,
                          stock: e.target.checked ? (it.stock ?? 10) : it.stock,
                          lowStockThreshold: it.lowStockThreshold ?? 5,
                        });
                      }}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: ink.teal,
                        cursor: "pointer",
                      }}
                    />
                  </label>
                </div>

                {/* Tracking controls (active when toggle is ON) */}
                {isTracked && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: `1px dashed ${ink.paperDim}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {/* Current Stock Stepper */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B6F76", marginBottom: 3 }}>
                          Current Stock:
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <button
                            id={`stock-minus-${it.id}`}
                            onClick={() => {
                              const next = Math.max(0, currentStock - 1);
                              onUpdateItemStock(it.catId, it.id, { stock: next });
                            }}
                            disabled={currentStock <= 0}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              border: "none",
                              background: currentStock <= 0 ? "#E2DFD5" : ink.graphite,
                              color: currentStock <= 0 ? "#A9A69B" : "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: currentStock <= 0 ? "default" : "pointer",
                            }}
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            id={`stock-input-${it.id}`}
                            type="number"
                            min="0"
                            className="mono"
                            value={currentStock}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              onUpdateItemStock(it.catId, it.id, { stock: val });
                            }}
                            style={{
                              width: 52,
                              height: 44,
                              textAlign: "center",
                              fontSize: 14,
                              fontWeight: 700,
                              color: isOutOfStock ? "#DC2626" : ink.key,
                              border: isOutOfStock ? "1px solid #F87171" : `1px solid ${ink.paperDim}`,
                              borderRadius: 8,
                              padding: "0",
                              background: isOutOfStock ? "#FEF2F2" : "#fff",
                            }}
                          />

                          <button
                            id={`stock-plus-${it.id}`}
                            onClick={() => {
                              onUpdateItemStock(it.catId, it.id, { stock: currentStock + 1 });
                            }}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              border: "none",
                              background: ink.graphite,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Plus size={16} />
                          </button>

                          {/* Quick Restock Pills */}
                          <button
                            id={`quick-add-5-${it.id}`}
                            onClick={() => onUpdateItemStock(it.catId, it.id, { stock: currentStock + 5 })}
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "3px 6px",
                              borderRadius: 5,
                              border: `1px solid ${ink.paperDim}`,
                              background: "#F9F8F5",
                              color: "#4B4F58",
                              cursor: "pointer",
                            }}
                          >
                            +5
                          </button>
                          <button
                            id={`quick-add-10-${it.id}`}
                            onClick={() => onUpdateItemStock(it.catId, it.id, { stock: currentStock + 10 })}
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: "3px 6px",
                              borderRadius: 5,
                              border: `1px solid ${ink.paperDim}`,
                              background: "#F9F8F5",
                              color: "#4B4F58",
                              cursor: "pointer",
                            }}
                          >
                            +10
                          </button>
                        </div>
                      </div>

                      {/* Low-stock threshold setting */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B6F76", marginBottom: 3 }}>
                          Alert Threshold:
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#8A8D93" }}>Alert at &le;</span>
                          <input
                            id={`threshold-input-${it.id}`}
                            type="number"
                            min="1"
                            max="999"
                            className="mono"
                            value={threshold}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              onUpdateItemStock(it.catId, it.id, { lowStockThreshold: val });
                            }}
                            style={{
                              width: 44,
                              textAlign: "center",
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: ink.key,
                              border: `1px solid ${ink.paperDim}`,
                              borderRadius: 6,
                              padding: "4px 0",
                              background: "#fff",
                            }}
                          />
                          <span style={{ fontSize: 11, color: "#8A8D93" }}>units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
