import React, { useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  Plus,
  Check,
  ChevronUp,
  ChevronDown,
  Layers,
  Package,
} from "lucide-react";
import { Category, MenuState, MenuItem, AccountId } from "../types.ts";
import { StockTrackingTab } from "./StockTrackingTab.tsx";
import { ConfirmModal } from "./ConfirmModal.tsx";

interface ManageMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  menu: MenuState;
  selectedCatId: string;
  onSelectCat: (id: string) => void;
  onAddCategory: (name: string, icon: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onMoveCategory: (id: string, dir: number) => void;
  onAddItem: (catId: string, name: string, price: number, account: AccountId) => void;
  onSaveEditItem: (catId: string, itemId: string, name: string, price: number, account: AccountId) => void;
  onDeleteItem: (catId: string, itemId: string) => void;
  onMoveItem: (catId: string, itemId: string, dir: number) => void;
  onUpdateItemStock: (catId: string, itemId: string, updates: Partial<MenuItem>) => void;
  iconsMap: Record<string, React.ComponentType<{ size?: number; color?: string }>>;
  iconKeys: string[];
  accounts: { id: AccountId; label: string; color: string }[];
  ink: Record<string, string>;
  peso: (n: number) => string;
}

export const ManageMenuDrawer: React.FC<ManageMenuDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  menu,
  selectedCatId,
  onSelectCat,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onMoveCategory,
  onAddItem,
  onSaveEditItem,
  onDeleteItem,
  onMoveItem,
  onUpdateItemStock,
  iconsMap,
  iconKeys,
  accounts,
  ink,
  peso,
}) => {
  const [activeTab, setActiveTab] = useState<"menu" | "stock">("menu");

  // Category state
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catEditName, setCatEditName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Tag");

  // Item state
  const [itemEditId, setItemEditId] = useState<string | null>(null);
  const [itemEditName, setItemEditName] = useState("");
  const [itemEditPrice, setItemEditPrice] = useState("");
  const [itemEditAccount, setItemEditAccount] = useState<AccountId>("service");

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemAccount, setNewItemAccount] = useState<AccountId>("service");

  // Confirmation dialog states
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ catId: string; item: MenuItem } | null>(null);

  if (!isOpen) return null;

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const activeItems = (activeCategory && menu[activeCategory.id]) || [];

  function handleStartEditItem(it: MenuItem) {
    setItemEditId(it.id);
    setItemEditName(it.name);
    setItemEditPrice(String(it.price));
    setItemEditAccount(it.account || "service");
  }

  function handleSaveItem() {
    const price = parseFloat(itemEditPrice);
    if (!itemEditName.trim() || isNaN(price) || price < 0 || !itemEditId) return;
    onSaveEditItem(activeCategory.id, itemEditId, itemEditName.trim(), price, itemEditAccount);
    setItemEditId(null);
  }

  function handleAddItem() {
    const price = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(price) || price < 0) return;
    onAddItem(activeCategory.id, newItemName.trim(), price, newItemAccount);
    setNewItemName("");
    setNewItemPrice("");
  }

  function handleAddCategory() {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatIcon);
    setNewCatName("");
  }

  function handleRenameCategory(id: string) {
    if (!catEditName.trim()) return;
    onRenameCategory(id, catEditName.trim());
    setCatEditId(null);
  }

  return (
    <div
      id="manage-menu-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 60,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        id="manage-menu-drawer"
        style={{
          width: "100%",
          maxWidth: 440,
          background: ink.paper,
          height: "100%",
          overflowY: "auto",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ink.key }}>Manage Menu</h2>
          <button
            id="close-manage-drawer-btn"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6F76", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector: Menu & Items vs Stock Tracking */}
        <div
          id="manage-menu-tabs"
          style={{
            display: "flex",
            background: "#E2DFD5",
            borderRadius: 9,
            padding: 3,
            marginBottom: 16,
            gap: 4,
          }}
        >
          <button
            id="tab-btn-menu-items"
            onClick={() => setActiveTab("menu")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: 7,
              border: "none",
              background: activeTab === "menu" ? ink.key : "transparent",
              color: activeTab === "menu" ? "#fff" : "#4B4F58",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            <Layers size={14} /> Menu &amp; Items
          </button>
          <button
            id="tab-btn-stock-tracking"
            onClick={() => setActiveTab("stock")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 10px",
              borderRadius: 7,
              border: "none",
              background: activeTab === "stock" ? ink.key : "transparent",
              color: activeTab === "stock" ? "#fff" : "#4B4F58",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            <Package size={14} /> Stock Tracking
          </button>
        </div>

        {/* Tab 1: Menu & Items */}
        {activeTab === "menu" ? (
          <div>
            {/* Categories Section */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4B4F58",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Categories
            </div>

            {categories.map((cat, idx) => {
              const Icon = iconsMap[cat.icon] || iconsMap.Tag;
              const isEditing = catEditId === cat.id;

              return (
                <div
                  key={cat.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#fff",
                    borderRadius: 9,
                    padding: "8px 10px",
                    marginBottom: 8,
                    border: `1px solid ${ink.paperDim}`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", flex: "0 0 auto" }}>
                    <button
                      onClick={() => onMoveCategory(cat.id, -1)}
                      disabled={idx === 0}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: idx === 0 ? "default" : "pointer",
                        color: idx === 0 ? "#D6D3C7" : "#8A8D93",
                        padding: 0,
                        lineHeight: 0,
                      }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => onMoveCategory(cat.id, 1)}
                      disabled={idx === categories.length - 1}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: idx === categories.length - 1 ? "default" : "pointer",
                        color: idx === categories.length - 1 ? "#D6D3C7" : "#8A8D93",
                        padding: 0,
                        lineHeight: 0,
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: cat.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    <Icon size={13} color="#fff" />
                  </div>

                  {isEditing ? (
                    <input
                      autoFocus
                      value={catEditName}
                      onChange={(e) => setCatEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameCategory(cat.id)}
                      style={{
                        flex: 1,
                        fontSize: 13,
                        padding: "5px 7px",
                        border: `1px solid ${ink.paperDim}`,
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => onSelectCat(cat.id)}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        fontSize: 13.5,
                        fontWeight: selectedCatId === cat.id ? 700 : 500,
                        color: ink.key,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {cat.name}
                      {selectedCatId === cat.id && (
                        <span style={{ fontSize: 11, color: ink.cyan, marginLeft: 6 }}>
                          (selected)
                        </span>
                      )}
                    </button>
                  )}

                  {isEditing ? (
                    <button
                      onClick={() => handleRenameCategory(cat.id)}
                      style={{ background: "none", border: "none", color: ink.teal, cursor: "pointer" }}
                    >
                      <Check size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCatEditId(cat.id);
                        setCatEditName(cat.name);
                      }}
                      style={{ background: "none", border: "none", color: "#8A8D93", cursor: "pointer" }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  <button
                    id={`delete-cat-${cat.id}`}
                    onClick={() => setConfirmDeleteCat(cat)}
                    style={{ background: "none", border: "none", color: ink.danger, cursor: "pointer" }}
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

            {/* Add Category Row */}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <select
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                style={{
                  border: `1px solid ${ink.paperDim}`,
                  borderRadius: 7,
                  fontSize: 12.5,
                  padding: "0 4px",
                  color: ink.key,
                }}
              >
                {iconKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                style={{
                  flex: 1,
                  fontSize: 13,
                  padding: "7px 9px",
                  border: `1px solid ${ink.paperDim}`,
                  borderRadius: 7,
                }}
              />
              <button
                onClick={handleAddCategory}
                style={{
                  background: ink.key,
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "0 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Items in Active Category Section */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4B4F58",
                margin: "22px 0 8px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Items &mdash; {activeCategory?.name}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#8A8D93" }}>
                {activeItems.length} item(s)
              </span>
            </div>

            {activeItems.map((it, idx) => {
              const isEditing = itemEditId === it.id;
              const account = accounts.find((a) => a.id === it.account) || accounts[1];

              return (
                <div
                  key={it.id}
                  style={{
                    background: "#fff",
                    borderRadius: 9,
                    padding: "9px 10px",
                    marginBottom: 8,
                    border: `1px solid ${ink.paperDim}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: "0 0 auto" }}>
                      <button
                        onClick={() => onMoveItem(activeCategory.id, it.id, -1)}
                        disabled={idx === 0}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: idx === 0 ? "default" : "pointer",
                          color: idx === 0 ? "#D6D3C7" : "#8A8D93",
                          padding: 0,
                          lineHeight: 0,
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => onMoveItem(activeCategory.id, it.id, 1)}
                        disabled={idx === activeItems.length - 1}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: idx === activeItems.length - 1 ? "default" : "pointer",
                          color: idx === activeItems.length - 1 ? "#D6D3C7" : "#8A8D93",
                          padding: 0,
                          lineHeight: 0,
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={itemEditName}
                          onChange={(e) => setItemEditName(e.target.value)}
                          style={{
                            flex: 1,
                            fontSize: 13,
                            padding: "5px 7px",
                            border: `1px solid ${ink.paperDim}`,
                            borderRadius: 6,
                          }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span className="mono" style={{ fontSize: 12, color: "#8A8D93" }}>
                            &#8369;
                          </span>
                          <input
                            className="mono"
                            inputMode="decimal"
                            value={itemEditPrice}
                            onChange={(e) =>
                              /^\d*\.?\d{0,2}$/.test(e.target.value) && setItemEditPrice(e.target.value)
                            }
                            style={{
                              width: 55,
                              fontSize: 12.5,
                              padding: "5px 6px",
                              border: `1px solid ${ink.paperDim}`,
                              borderRadius: 6,
                            }}
                          />
                        </div>
                        <button
                          onClick={handleSaveItem}
                          style={{ background: "none", border: "none", color: ink.teal, cursor: "pointer" }}
                        >
                          <Check size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 13, color: ink.key }}>{it.name}</span>
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 20,
                            border: `1px solid ${account.color}`,
                            color: account.color,
                          }}
                        >
                          {account.label}
                        </span>
                        <span className="mono" style={{ fontSize: 12.5, color: "#6B6F76" }}>
                          {peso(it.price)}
                        </span>
                        <button
                          onClick={() => handleStartEditItem(it)}
                          style={{ background: "none", border: "none", color: "#8A8D93", cursor: "pointer" }}
                        >
                          <Pencil size={14} />
                        </button>
                      </>
                    )}

                    <button
                      id={`delete-item-${it.id}`}
                      onClick={() => setConfirmDeleteItem({ catId: activeCategory.id, item: it })}
                      style={{ background: "none", border: "none", color: ink.danger, cursor: "pointer" }}
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {isEditing && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8, paddingLeft: 22 }}>
                      {accounts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setItemEditAccount(a.id)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "4px 9px",
                            borderRadius: 6,
                            cursor: "pointer",
                            border: `1px solid ${itemEditAccount === a.id ? a.color : ink.paperDim}`,
                            background: itemEditAccount === a.id ? a.color : "transparent",
                            color: itemEditAccount === a.id ? "#fff" : "#6B6F76",
                          }}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Item Form */}
            <div style={{ background: ink.paperDim, borderRadius: 9, padding: "10px 10px", marginTop: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="New item name"
                  style={{
                    flex: 1,
                    fontSize: 13,
                    padding: "7px 9px",
                    border: `1px solid ${ink.paperDim}`,
                    borderRadius: 7,
                    background: "#fff",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    border: `1px solid ${ink.paperDim}`,
                    borderRadius: 7,
                    padding: "0 8px",
                    background: "#fff",
                  }}
                >
                  <span className="mono" style={{ fontSize: 12, color: "#8A8D93" }}>
                    &#8369;
                  </span>
                  <input
                    className="mono"
                    inputMode="decimal"
                    value={newItemPrice}
                    onChange={(e) =>
                      /^\d*\.?\d{0,2}$/.test(e.target.value) && setNewItemPrice(e.target.value)
                    }
                    placeholder="0.00"
                    style={{ width: 55, fontSize: 12.5, padding: "7px 0", border: "none", outline: "none" }}
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  style={{
                    background: ink.key,
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    padding: "0 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Plus size={15} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setNewItemAccount(a.id)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 9px",
                      borderRadius: 6,
                      cursor: "pointer",
                      border: `1px solid ${newItemAccount === a.id ? a.color : ink.paperDim}`,
                      background: newItemAccount === a.id ? a.color : "#fff",
                      color: newItemAccount === a.id ? "#fff" : "#6B6F76",
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Stock Tracking */
          <StockTrackingTab
            categories={categories}
            menu={menu}
            onUpdateItemStock={onUpdateItemStock}
            ink={ink}
          />
        )}
      </div>

      {/* Confirmation modal for Category deletion */}
      <ConfirmModal
        isOpen={!!confirmDeleteCat}
        title="Delete Category?"
        description={
          confirmDeleteCat ? (
            <div>
              Are you sure you want to delete category <b>"{confirmDeleteCat.name}"</b>?
              <div style={{ marginTop: 6, color: "#9CA3AF", fontSize: 12.5 }}>
                This will delete the category and all {(menu[confirmDeleteCat.id] || []).length} items inside it. You can undo this action immediately.
              </div>
            </div>
          ) : ""
        }
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteCat) {
            onDeleteCategory(confirmDeleteCat.id);
            setConfirmDeleteCat(null);
          }
        }}
        onCancel={() => setConfirmDeleteCat(null)}
      />

      {/* Confirmation modal for Item deletion */}
      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        title="Delete Item?"
        description={
          confirmDeleteItem ? (
            <div>
              Are you sure you want to delete <b>"{confirmDeleteItem.item.name}"</b>?
              <div style={{ marginTop: 6, color: "#9CA3AF", fontSize: 12.5 }}>
                Price: <b>{peso(confirmDeleteItem.item.price)}</b>. You can undo this action immediately.
              </div>
            </div>
          ) : ""
        }
        confirmLabel="Delete Item"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteItem) {
            onDeleteItem(confirmDeleteItem.catId, confirmDeleteItem.item.id);
            setConfirmDeleteItem(null);
          }
        }}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
};
