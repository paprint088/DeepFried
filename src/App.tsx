import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Printer,
  Copy,
  Image as ImageIcon,
  Package,
  PenTool,
  Plus,
  Minus,
  Printer as PrintIcon,
  History,
  X,
  Check,
  Pencil,
  Trash2,
  Tag,
  Camera,
  FileText,
  Palette,
  Ruler,
  Paperclip,
  Star,
  Scissors,
  Banknote,
  Wallet,
  CircleDollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Database,
  Download,
  Upload,
  Link2,
  Unlink,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import {
  Category,
  MenuState,
  MenuItem,
  OrderLine,
  Transaction,
  HeldOrder,
  AccountId,
  PaymentMethodId,
} from "./types.ts";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MENU,
  loadConfig,
  saveConfig,
  peekNextReceiptNo,
  nextReceiptNo as dsNextReceiptNo,
  saveTransaction as dsSaveTransaction,
  listTransactions,
  downloadSnapshot,
  parseSnapshot,
  applySnapshot,
  resetToInitialSnapshot,
  isLiveFileSupported,
  getLiveFileName,
  connectLiveFile,
  disconnectLiveFile,
  loadHeldOrders,
  saveHeldOrders,
} from "./dataStore.ts";
import { PaymentConfirmModal } from "./components/PaymentConfirmModal.tsx";
import { ManageMenuDrawer } from "./components/ManageMenuDrawer.tsx";
import { renderReceiptWindow, printJournalWindow } from "./components/ReceiptPrinter.ts";
import { ConfirmModal } from "./components/ConfirmModal.tsx";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal.tsx";
import { UndoToast, UndoItem } from "./components/UndoToast.tsx";

/* ---------------------------------------------------------
   Design tokens: Paper card + graphite chassis, CMYK accents
--------------------------------------------------------- */
const ink: Record<string, string> = {
  graphite: "#1B1D22",
  graphiteSoft: "#262931",
  paper: "#F3F1EA",
  paperDim: "#E7E3D8",
  cyan: "#0EA5C4",
  magenta: "#D6247A",
  yellow: "#C98A00",
  teal: "#0E9488",
  orange: "#C2622A",
  key: "#1B1D22",
  danger: "#C0392B",
};

const COLOR_CYCLE = [ink.cyan, ink.magenta, ink.yellow, ink.teal, ink.orange, ink.key];

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Printer,
  Copy,
  Image: ImageIcon,
  Package,
  PenTool,
  Tag,
  Camera,
  FileText,
  Palette,
  Ruler,
  Paperclip,
  Star,
  Scissors,
};
const ICON_KEYS = Object.keys(ICONS);

const ACCOUNTS: { id: AccountId; label: string; color: string }[] = [
  { id: "sales", label: "Sales", color: "#2E7D32" },
  { id: "service", label: "Service", color: "#1D4ED8" },
  { id: "sundry", label: "Sundry", color: "#B7791F" },
];

function accountInfo(id?: AccountId) {
  return ACCOUNTS.find((a) => a.id === id) || ACCOUNTS[1];
}

const PAYMENT_METHODS: { id: PaymentMethodId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "ewallet", label: "E-wallet", icon: Wallet },
  { id: "other", label: "Other", icon: CircleDollarSign },
];

function peso(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return "\u20B1" + Math.round(v).toLocaleString("en-PH");
}

function escHtml(s: unknown) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [menu, setMenu] = useState<MenuState>(DEFAULT_MENU);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [selectedCat, setSelectedCat] = useState(DEFAULT_CATEGORIES[0].id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [tendered, setTendered] = useState("");
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTIN, setCustomerTIN] = useState("");
  const [customerFormOpen, setCustomerFormOpen] = useState(false);

  // Payment Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Upcoming Slip Number (prominently displayed)
  const [upcomingSlipNo, setUpcomingSlipNo] = useState<string>(() => peekNextReceiptNo());

  // Confirmation dialogs for destructive actions
  const [confirmDiscardHeld, setConfirmDiscardHeld] = useState<HeldOrder | null>(null);
  const [confirmClearOrder, setConfirmClearOrder] = useState(false);
  const [confirmResetSnapshot, setConfirmResetSnapshot] = useState(false);

  // Undo action state
  const [undoAction, setUndoAction] = useState<UndoItem | null>(null);

  // Keyboard shortcuts dialog state
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [heldLoaded, setHeldLoaded] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);

  const [now, setNow] = useState(new Date());
  const [toast, setToast] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Transaction | null>(null);

  const [salesOpen, setSalesOpen] = useState(false);
  const [salesDate, setSalesDate] = useState(todayStr());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  const [journalOpen, setJournalOpen] = useState(false);
  const [journalFrom, setJournalFrom] = useState(todayStr());
  const [journalTo, setJournalTo] = useState(todayStr());
  const [journalTxns, setJournalTxns] = useState<(Transaction & { split: { sales: number; service: number; sundry: number } })[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);

  const [dataOpen, setDataOpen] = useState(false);
  const [liveFileName, setLiveFileName] = useState<string | null>(null);
  const [dataBusy, setDataBusy] = useState(false);
  const [liveBannerDismissed, setLiveBannerDismissed] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [manageOpen, setManageOpen] = useState(false);

  /* ---------------- Load / persist shop config ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const cfg = await loadConfig();
        if (cfg.categories && cfg.menu) {
          setCategories(cfg.categories);
          setMenu(cfg.menu);
          setSelectedCat(cfg.categories[0]?.id || DEFAULT_CATEGORIES[0].id);
        }
      } catch {
        // defaults stay
      }
      setConfigLoaded(true);
    })();
  }, []);

  async function persistConfig(nextCategories: Category[], nextMenu: MenuState) {
    try {
      await saveConfig(nextCategories, nextMenu);
    } catch {
      setToast("Menu changes saved for this session only (couldn't sync).");
    }
  }

  useEffect(() => {
    if (configLoaded) persistConfig(categories, menu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, menu]);

  /* ---------------- Load / persist held orders ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const list = await loadHeldOrders();
        setHeldOrders(Array.isArray(list) ? list : []);
      } catch {
        setHeldOrders([]);
      }
      setHeldLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (heldLoaded) saveHeldOrders(heldOrders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldOrders]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setLiveFileName(getLiveFileName());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------------- Derived order data ---------------- */
  const allItems = useMemo(
    () =>
      Object.entries(menu).flatMap(([catId, items]) =>
        ((items || []) as MenuItem[]).map((it) => ({ ...it, catId }))
      ),
    [menu]
  );

  const orderLines: OrderLine[] = useMemo(
    () =>
      allItems
        .filter((it) => (qty[it.id] || 0) > 0)
        .map((it) => ({ ...it, qty: qty[it.id], lineTotal: qty[it.id] * it.price })),
    [allItems, qty]
  );

  const subtotal = orderLines.reduce((s, l) => s + l.lineTotal, 0);
  const discNum = parseFloat(discountValue) || 0;
  const discountAmount =
    discountType === "percent"
      ? (subtotal * Math.min(discNum, 100)) / 100
      : discountType === "fixed"
      ? Math.min(discNum, subtotal)
      : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const tenderedNum = parseFloat(tendered);
  const hasTendered = tendered !== "" && !isNaN(tenderedNum);
  const change = hasTendered ? tenderedNum - total : 0;

  /* ---------------- Order actions ---------------- */
  function setItemQty(id: string, next: number) {
    const targetItem = allItems.find((it) => it.id === id);
    const n = Math.max(0, Math.floor(isNaN(next) ? 0 : next));

    if (targetItem?.trackStock && typeof targetItem.stock === "number") {
      if (targetItem.stock <= 0 && n > 0) {
        setToast(`"${targetItem.name}" is out of stock!`);
        return;
      }
      if (n > targetItem.stock) {
        setToast(`Only ${targetItem.stock} in stock for "${targetItem.name}".`);
        setQty((prev) => ({ ...prev, [id]: targetItem.stock! }));
        return;
      }
    }

    setQty((prev) => ({ ...prev, [id]: n }));
  }

  function clearOrder() {
    setQty({});
    setTendered("");
    setDiscountType("none");
    setDiscountValue("");
    setPaymentMethod("cash");
    setPaymentNote("");
    setCustomerName("");
    setCustomerAddress("");
    setCustomerTIN("");
  }

  /* ---------------- Hold / resume orders ---------------- */
  function holdCurrentOrder(silent = false) {
    if (orderLines.length === 0) return null;
    const held: HeldOrder = {
      id: uid("hold"),
      label:
        customerName.trim() ||
        `Order @ ${new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`,
      createdAt: Date.now(),
      qty,
      discountType,
      discountValue,
      paymentMethod,
      paymentNote,
      customerName,
      customerAddress,
      customerTIN,
      tendered,
    };
    setHeldOrders((prev) => [...prev, held]);
    clearOrder();
    if (!silent) setToast("Order held — start a new one anytime.");
    return held.id;
  }

  function resumeHeldOrder(id: string) {
    const target = heldOrders.find((h) => h.id === id);
    if (!target) return;
    if (orderLines.length > 0) holdCurrentOrder(true);
    setQty(target.qty || {});
    setDiscountType(target.discountType || "none");
    setDiscountValue(target.discountValue || "");
    setPaymentMethod(target.paymentMethod || "cash");
    setPaymentNote(target.paymentNote || "");
    setCustomerName(target.customerName || "");
    setCustomerAddress(target.customerAddress || "");
    setCustomerTIN(target.customerTIN || "");
    if (target.customerName || target.customerAddress || target.customerTIN) setCustomerFormOpen(true);
    setTendered(target.tendered || "");
    setHeldOrders((prev) => prev.filter((h) => h.id !== id));
    setHeldOpen(false);
    setToast("Order resumed.");
  }

  function deleteHeldOrder(id: string) {
    const target = heldOrders.find((h) => h.id === id);
    const idx = heldOrders.findIndex((h) => h.id === id);
    setHeldOrders((prev) => prev.filter((h) => h.id !== id));
    setToast(`Held order "${target?.label || "Order"}" discarded.`);

    if (target) {
      setUndoAction({
        id: "undo-held-" + Date.now(),
        message: `Held order "${target.label}" discarded.`,
        onUndo: () => {
          setHeldOrders((prev) => {
            const next = [...prev];
            next.splice(idx >= 0 ? idx : next.length, 0, target);
            return next;
          });
          setToast(`Restored held order "${target.label}".`);
        },
      });
    }
  }

  function handleRequestClearOrder() {
    if (orderLines.length === 0) return;
    setConfirmClearOrder(true);
  }

  function handleConfirmClearOrder() {
    const savedQty = { ...qty };
    const savedDiscountType = discountType;
    const savedDiscountValue = discountValue;
    const savedCustomerName = customerName;
    const savedCustomerAddress = customerAddress;
    const savedCustomerTIN = customerTIN;
    const savedTendered = tendered;
    const savedPaymentNote = paymentNote;
    const count = orderLines.reduce((sum, l) => sum + l.qty, 0);

    clearOrder();
    setConfirmClearOrder(false);
    setToast("Order cleared.");

    setUndoAction({
      id: "undo-clear-" + Date.now(),
      message: `Active order cleared (${count} items).`,
      onUndo: () => {
        setQty(savedQty);
        setDiscountType(savedDiscountType);
        setDiscountValue(savedDiscountValue);
        setCustomerName(savedCustomerName);
        setCustomerAddress(savedCustomerAddress);
        setCustomerTIN(savedCustomerTIN);
        if (savedCustomerName || savedCustomerAddress || savedCustomerTIN) {
          setCustomerFormOpen(true);
        }
        setTendered(savedTendered);
        setPaymentNote(savedPaymentNote);
        setToast("Active order restored.");
      },
    });
  }

  function heldOrderStats(held: HeldOrder) {
    let sub = 0;
    let count = 0;
    Object.entries(held.qty || {}).forEach(([id, q]) => {
      if (!q) return;
      count += q;
      const item = allItems.find((it) => it.id === id);
      if (item) sub += item.price * q;
    });
    const dNum = parseFloat(held.discountValue) || 0;
    const dAmt =
      held.discountType === "percent"
        ? (sub * Math.min(dNum, 100)) / 100
        : held.discountType === "fixed"
        ? Math.min(dNum, sub)
        : 0;
    return { count, total: Math.max(0, sub - dAmt) };
  }

  /* ---------------- Category & Item Management ---------------- */
  function addCategory(name: string, icon: string) {
    const id = uid("cat");
    const color = COLOR_CYCLE[categories.length % COLOR_CYCLE.length];
    const next = [...categories, { id, name, icon, color }];
    setCategories(next);
    setMenu((m) => ({ ...m, [id]: [] }));
    setSelectedCat(id);
    setToast(`Category "${name}" added.`);
  }

  function renameCategory(id: string, name: string) {
    setCategories((cats) => cats.map((c) => (c.id === id ? { ...c, name } : c)));
    setToast("Category renamed.");
  }

  function deleteCategory(id: string) {
    if (categories.length <= 1) {
      setToast("You need at least one category.");
      return;
    }
    const catToDelete = categories.find((c) => c.id === id);
    const itemsToDelete = menu[id] || [];
    const catIdx = categories.findIndex((c) => c.id === id);

    const remaining = categories.filter((c) => c.id !== id);
    setCategories(remaining);
    setMenu((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    if (selectedCat === id) setSelectedCat(remaining[0].id);
    setToast(`Category "${catToDelete?.name || ""}" deleted.`);

    if (catToDelete) {
      setUndoAction({
        id: "undo-cat-" + Date.now(),
        message: `Category "${catToDelete.name}" deleted.`,
        onUndo: () => {
          setCategories((prev) => {
            const next = [...prev];
            next.splice(catIdx >= 0 ? catIdx : next.length, 0, catToDelete);
            return next;
          });
          setMenu((prev) => ({
            ...prev,
            [catToDelete.id]: itemsToDelete,
          }));
          setSelectedCat(catToDelete.id);
          setToast(`Restored category "${catToDelete.name}".`);
        },
      });
    }
  }

  function moveCategory(id: string, dir: number) {
    setCategories((cats) => {
      const idx = cats.findIndex((c) => c.id === id);
      const newIdx = idx + dir;
      if (idx === -1 || newIdx < 0 || newIdx >= cats.length) return cats;
      const next = [...cats];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function saveEditItem(catId: string, itemId: string, name: string, price: number, account: AccountId) {
    setMenu((m) => ({
      ...m,
      [catId]: m[catId].map((it) => (it.id === itemId ? { ...it, name, price, account } : it)),
    }));
    setToast("Item updated.");
  }

  function deleteItem(catId: string, itemId: string) {
    const itemToDelete = (menu[catId] || []).find((it) => it.id === itemId);
    const itemIdx = (menu[catId] || []).findIndex((it) => it.id === itemId);
    const prevQ = qty[itemId];

    setMenu((m) => ({ ...m, [catId]: m[catId].filter((it) => it.id !== itemId) }));
    setQty((q) => {
      const next = { ...q };
      delete next[itemId];
      return next;
    });
    setToast(`Item "${itemToDelete?.name || ""}" removed.`);

    if (itemToDelete) {
      setUndoAction({
        id: "undo-item-" + Date.now(),
        message: `Item "${itemToDelete.name}" deleted.`,
        onUndo: () => {
          setMenu((m) => {
            const current = [...(m[catId] || [])];
            current.splice(itemIdx >= 0 ? itemIdx : current.length, 0, itemToDelete);
            return { ...m, [catId]: current };
          });
          if (prevQ) {
            setQty((q) => ({ ...q, [itemToDelete.id]: prevQ }));
          }
          setToast(`Restored item "${itemToDelete.name}".`);
        },
      });
    }
  }

  function moveItem(catId: string, itemId: string, dir: number) {
    setMenu((m) => {
      const items = m[catId] || [];
      const idx = items.findIndex((it) => it.id === itemId);
      const newIdx = idx + dir;
      if (idx === -1 || newIdx < 0 || newIdx >= items.length) return m;
      const next = [...items];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...m, [catId]: next };
    });
  }

  function addItem(catId: string, name: string, price: number, account: AccountId) {
    const id = uid(slug(name));
    const isMerch = account === "sales";
    const newItem: MenuItem = {
      id,
      name,
      price,
      account,
      trackStock: isMerch,
      stock: isMerch ? 20 : 0,
      lowStockThreshold: 5,
    };
    setMenu((m) => ({ ...m, [catId]: [...(m[catId] || []), newItem] }));
    setToast(`"${name}" added to menu.`);
  }

  function updateItemStock(catId: string, itemId: string, updates: Partial<MenuItem>) {
    setMenu((m) => ({
      ...m,
      [catId]: (m[catId] || []).map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
    }));
  }

  /* ---------------- Transactions & Payment Confirmation ---------------- */
  function handleInitiatePayment() {
    if (orderLines.length === 0) {
      setToast("No items in the order yet.");
      return;
    }
    if (!hasTendered || tenderedNum < total) {
      setToast("Enter an amount received that covers the total.");
      return;
    }
    // Show confirmation modal before tagging transaction as paid
    setShowConfirmModal(true);
  }

  async function handleConfirmPayment() {
    setShowConfirmModal(false);

    const receiptNo = await dsNextReceiptNo();
    const txnKey = `txn:${receiptNo}`;
    const txn: Transaction = {
      id: txnKey,
      receiptNo,
      timestamp: Date.now(),
      dateLabel: new Date().toLocaleString("en-PH"),
      items: orderLines.map((l) => ({
        name: l.name,
        price: l.price,
        qty: l.qty,
        lineTotal: l.lineTotal,
        account: l.account || "service",
      })),
      subtotal,
      discountType,
      discountValue: discNum,
      discountAmount,
      total,
      paymentMethod,
      paymentNote,
      customerName,
      customerAddress,
      customerTIN,
      tendered: tenderedNum,
      change: Math.max(0, tenderedNum - total),
    };

    try {
      await dsSaveTransaction(txn);

      // Deduct stock for tracked items
      let stockWasDeducted = false;
      const updatedMenu: MenuState = {};
      for (const [catId, items] of Object.entries(menu)) {
        updatedMenu[catId] = ((items || []) as MenuItem[]).map((it) => {
          const ordered = orderLines.find((ol) => ol.id === it.id);
          if (ordered && it.trackStock && typeof it.stock === "number") {
            stockWasDeducted = true;
            return {
              ...it,
              stock: Math.max(0, it.stock - ordered.qty),
            };
          }
          return it;
        });
      }

      if (stockWasDeducted) {
        setMenu(updatedMenu);
        persistConfig(categories, updatedMenu);
      }

      setToast(`Transaction #${receiptNo} tagged as PAID!`);
      setLastSaved(txn);
    } catch {
      setToast("Could not save transaction. Try again.");
      return;
    }
    clearOrder();
  }

  /* ---------------- History & Journal helpers ---------------- */
  async function fetchAllTxns(limit = 500): Promise<Transaction[]> {
    try {
      return await listTransactions(limit);
    } catch {
      return [];
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const txns = await fetchAllTxns(25);
      txns.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(txns);
    } catch {
      setHistory([]);
    }
    setHistoryLoading(false);
  }

  function inferAccount(itemName: string, storedAccount?: AccountId): AccountId {
    if (storedAccount) return storedAccount;
    const found = allItems.find((it) => it.name === itemName);
    return (found && found.account) || "service";
  }

  function splitByAccount(txn: Transaction) {
    let sales = 0,
      service = 0,
      sundry = 0;
    (txn.items || []).forEach((l) => {
      const acc = inferAccount(l.name, l.account);
      if (acc === "sales") sales += l.lineTotal;
      else if (acc === "sundry") sundry += l.lineTotal;
      else service += l.lineTotal;
    });
    const sub = txn.subtotal || sales + service + sundry || 0;
    const ratio = sub > 0 ? (txn.total || 0) / sub : 1;
    return { sales: sales * ratio, service: service * ratio, sundry: sundry * ratio };
  }

  function csvEscape(v: unknown) {
    const s = String(v == null ? "" : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function transactionsToCSV(rows: (Transaction & { split?: { sales: number; service: number; sundry: number } })[]) {
    const header = [
      "Date",
      "Slip No.",
      "Sold To",
      "Address",
      "TIN",
      "Mode",
      "Sales",
      "Service",
      "Sundry",
      "Discount",
      "Total",
      "Received",
      "Change",
    ];
    const lines = [header.map(csvEscape).join(",")];
    rows.forEach((t) => {
      const d = new Date(t.timestamp);
      const dLabel = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      const split = t.split || splitByAccount(t);
      const methodLabel = { cash: "Cash", ewallet: "E-wallet", other: "Other" }[t.paymentMethod] || "Cash";
      lines.push(
        [
          dLabel,
          t.receiptNo,
          t.customerName || t.paymentNote || "Cash sales",
          t.customerAddress || "",
          t.customerTIN || "",
          methodLabel,
          split.sales.toFixed(2),
          split.service.toFixed(2),
          split.sundry.toFixed(2),
          (t.discountAmount || 0).toFixed(2),
          (t.total || 0).toFixed(2),
          (t.tendered || 0).toFixed(2),
          (t.change || 0).toFixed(2),
        ]
          .map(csvEscape)
          .join(",")
      );
    });
    return lines.join("\r\n");
  }

  function downloadCSVFile(csvText: string, filename: string) {
    const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function loadSales(dateStr: string) {
    setSalesLoading(true);
    try {
      const txns = await fetchAllTxns(2000);
      const dayTxns = txns.filter((t) => todayStr(new Date(t.timestamp)) === dateStr);
      const byMethod: Record<string, number> = { cash: 0, ewallet: 0, other: 0 };
      const byAccount: Record<string, number> = { sales: 0, service: 0, sundry: 0 };
      const itemTotals: Record<string, number> = {};
      let totalSales = 0;
      let totalDiscount = 0;
      dayTxns.forEach((t) => {
        totalSales += t.total || 0;
        totalDiscount += t.discountAmount || 0;
        byMethod[t.paymentMethod || "cash"] = (byMethod[t.paymentMethod || "cash"] || 0) + (t.total || 0);
        const split = splitByAccount(t);
        byAccount.sales += split.sales;
        byAccount.service += split.service;
        byAccount.sundry += split.sundry;
        (t.items || []).forEach((l) => {
          itemTotals[l.name] = (itemTotals[l.name] || 0) + l.qty;
        });
      });
      const topItems = Object.entries(itemTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      setSalesData({ count: dayTxns.length, totalSales, totalDiscount, byMethod, byAccount, topItems });
    } catch {
      setSalesData({
        count: 0,
        totalSales: 0,
        totalDiscount: 0,
        byMethod: { cash: 0, ewallet: 0, other: 0 },
        byAccount: { sales: 0, service: 0, sundry: 0 },
        topItems: [],
      });
    }
    setSalesLoading(false);
  }

  async function loadJournal(from: string, to: string) {
    setJournalLoading(true);
    try {
      const txns = await fetchAllTxns(3000);
      const rangeTxns = txns.filter((t) => {
        const d = todayStr(new Date(t.timestamp));
        return d >= from && d <= to;
      });
      rangeTxns.sort((a, b) => a.timestamp - b.timestamp);
      const rows = rangeTxns.map((t) => ({ ...t, split: splitByAccount(t) }));
      setJournalTxns(rows);
    } catch {
      setJournalTxns([]);
    }
    setJournalLoading(false);
  }

  function handlePrintReceipt() {
    const receipt =
      lastSaved && orderLines.length === 0
        ? lastSaved
        : {
            receiptNo: null,
            dateLabel: now.toLocaleString("en-PH"),
            items: orderLines.map((l) => ({
              name: l.name,
              price: l.price,
              qty: l.qty,
              lineTotal: l.lineTotal,
              account: l.account || "service",
            })),
            subtotal,
            discountType,
            discountAmount,
            total,
            paymentMethod,
            paymentNote,
            customerName,
            customerAddress,
            customerTIN,
            tendered: hasTendered ? tenderedNum : null,
            change: hasTendered ? change : null,
          };
    renderReceiptWindow(receipt, setToast);
  }

  function handlePrintHistoryTxn(t: Transaction) {
    renderReceiptWindow(
      {
        receiptNo: t.receiptNo,
        dateLabel: t.dateLabel,
        items: t.items,
        subtotal: t.subtotal,
        discountAmount: t.discountAmount,
        total: t.total,
        paymentMethod: t.paymentMethod,
        customerName: t.customerName,
        customerAddress: t.customerAddress,
        customerTIN: t.customerTIN,
        tendered: t.tendered,
        change: t.change,
      },
      setToast
    );
  }

  /* ---------------- Data import/export ---------------- */
  async function handleExport() {
    setDataBusy(true);
    try {
      await downloadSnapshot();
      setToast("Backup file downloaded.");
    } catch {
      setToast("Couldn't create the backup file.");
    }
    setDataBusy(false);
  }

  async function handleExportCSV() {
    setDataBusy(true);
    try {
      const txns = await fetchAllTxns(100000);
      txns.sort((a, b) => a.timestamp - b.timestamp);
      downloadCSVFile(transactionsToCSV(txns), `paprint-transactions-${todayStr()}.csv`);
      setToast("CSV exported — opens directly in Excel.");
    } catch {
      setToast("Couldn't export the CSV file.");
    }
    setDataBusy(false);
  }

  function handleImportClick() {
    if (importFileRef.current) importFileRef.current.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setDataBusy(true);
    try {
      const text = await file.text();
      const data = parseSnapshot(text);
      const confirmed = window.confirm(
        `Import ${data.categories.length} categories and ${data.transactions.length} transactions from this file?\n\nYour current menu will be replaced. Existing transactions are kept; imported ones will be added or updated.`
      );
      if (!confirmed) {
        setDataBusy(false);
        return;
      }
      const summary = await applySnapshot(data);
      setCategories(data.categories);
      setMenu(data.menu);
      setSelectedCat(data.categories[0]?.id || DEFAULT_CATEGORIES[0].id);
      setToast(`Imported ${summary.transactionsCount} transactions and ${summary.itemsCount} items.`);
    } catch (err: unknown) {
      setToast((err as Error).message || "Couldn't read that backup file.");
    }
    setDataBusy(false);
  }

  function handleResetToInitial() {
    setConfirmResetSnapshot(true);
  }

  async function handleConnectLiveFile() {
    setDataBusy(true);
    try {
      const name = await connectLiveFile();
      setLiveFileName(name);
      setToast(`Live-synced to ${name}.`);
    } catch (e: unknown) {
      if (e && (e as { name?: string }).name !== "AbortError") setToast("Couldn't connect the file.");
    }
    setDataBusy(false);
  }

  function handleDisconnectLiveFile() {
    disconnectLiveFile();
    setLiveFileName(null);
    setToast("Live file sync disconnected.");
  }

  /* ---------------- Global Keyboard Shortcuts & Slip synchronization ---------------- */
  useEffect(() => {
    setUpcomingSlipNo(peekNextReceiptNo());
  }, [lastSaved, history.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // 1. Undo: Ctrl+Z / Cmd+Z (works everywhere when an undo action is available)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (undoAction) {
          e.preventDefault();
          undoAction.onUndo();
          setUndoAction(null);
          return;
        }
      }

      // 2. Clear active order: Ctrl+Shift+X or Alt+C
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "x") ||
        (e.altKey && e.key.toLowerCase() === "c")
      ) {
        if (orderLines.length > 0) {
          e.preventDefault();
          handleRequestClearOrder();
          return;
        }
      }

      // 3. Checkout / Tag as Paid: F4 or Ctrl+Enter
      if (e.key === "F4" || ((e.ctrlKey || e.metaKey) && e.key === "Enter")) {
        if (orderLines.length > 0) {
          e.preventDefault();
          if (!hasTendered || tenderedNum < total) {
            setTendered(String(Math.round(total)));
          }
          setShowConfirmModal(true);
          return;
        }
      }

      // 4. Hold active order: Ctrl+H or Alt+H
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === "h") {
        if (orderLines.length > 0) {
          e.preventDefault();
          holdCurrentOrder();
          return;
        }
      }

      // 5. Open Held Orders: Alt+O
      if (e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setHeldOpen(true);
        return;
      }

      // 6. Keyboard Shortcuts cheatsheet: ? (when not typing) or F1
      if ((e.key === "?" && !isTyping) || e.key === "F1") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // 7. Escape: close any open dialog or drawer
      if (e.key === "Escape") {
        if (confirmClearOrder) {
          e.preventDefault();
          setConfirmClearOrder(false);
          return;
        }
        if (confirmDiscardHeld) {
          e.preventDefault();
          setConfirmDiscardHeld(null);
          return;
        }
        if (confirmResetSnapshot) {
          e.preventDefault();
          setConfirmResetSnapshot(false);
          return;
        }
        if (shortcutsOpen) {
          e.preventDefault();
          setShortcutsOpen(false);
          return;
        }
        if (showConfirmModal) {
          e.preventDefault();
          setShowConfirmModal(false);
          return;
        }
        if (manageOpen) {
          e.preventDefault();
          setManageOpen(false);
          return;
        }
        if (heldOpen) {
          e.preventDefault();
          setHeldOpen(false);
          return;
        }
        if (historyOpen) {
          e.preventDefault();
          setHistoryOpen(false);
          return;
        }
        if (salesOpen) {
          e.preventDefault();
          setSalesOpen(false);
          return;
        }
        if (journalOpen) {
          e.preventDefault();
          setJournalOpen(false);
          return;
        }
        if (dataOpen) {
          e.preventDefault();
          setDataOpen(false);
          return;
        }
      }

      // If actively typing, ignore single-digit category switching keys
      if (isTyping) return;

      // 8. Number keys 1-9: switch category
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= categories.length) {
        e.preventDefault();
        setSelectedCat(categories[num - 1].id);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undoAction,
    orderLines,
    categories,
    confirmClearOrder,
    confirmDiscardHeld,
    confirmResetSnapshot,
    shortcutsOpen,
    showConfirmModal,
    manageOpen,
    heldOpen,
    historyOpen,
    salesOpen,
    journalOpen,
    dataOpen,
    hasTendered,
    tenderedNum,
    total,
    qty,
    discountType,
    discountValue,
    customerName,
    customerAddress,
    customerTIN,
    tendered,
    paymentNote,
  ]);

  const activeCategory = categories.find((c) => c.id === selectedCat) || categories[0];
  const activeItems = (activeCategory && menu[activeCategory.id]) || [];
  const dateDisplay = now.toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeDisplay = now.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div style={{ background: ink.graphite, minHeight: "100vh", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        .mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .cat-btn { transition: transform .12s ease, background-color .12s ease; }
        .cat-btn:active { transform: scale(0.96); }
        .qty-btn { transition: background-color .12s ease, transform .08s ease; }
        .qty-btn:active { transform: scale(0.9); }
        .pill-btn { transition: transform .1s ease, background-color .12s ease; }
        .pill-btn:active { transform: scale(0.96); }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #4b4f58; border-radius: 4px; }
      `}</style>

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
          background: ink.graphite,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${ink.graphiteSoft}` }}>
          <h1 style={{ color: ink.paper, fontSize: 21, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            PaPrint <span style={{ color: ink.cyan }}>&amp;</span> Copy
          </h1>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div className="mono" style={{ color: "#9CA3AF", fontSize: 12.5, display: "flex", alignItems: "center", gap: 10 }}>
              <span>{dateDisplay}</span>
              <span style={{ color: ink.yellow }}>{timeDisplay}</span>
              <span
                id="header-slip-no-badge"
                title="Next Order Slip Number"
                style={{
                  background: "rgba(14, 165, 196, 0.16)",
                  border: "1px solid rgba(14, 165, 196, 0.35)",
                  color: ink.cyan,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 5,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                SLIP #{upcomingSlipNo}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                id="header-sales-btn"
                onClick={() => {
                  setSalesOpen(true);
                  loadSales(salesDate);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 4,
                  cursor: "pointer",
                }}
              >
                <BarChart3 size={16} />
                <span style={{ fontSize: 12 }}>Sales</span>
              </button>
              <button
                id="header-journal-btn"
                onClick={() => {
                  setJournalOpen(true);
                  loadJournal(journalFrom, journalTo);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 4,
                  cursor: "pointer",
                }}
              >
                <BookOpen size={16} />
                <span style={{ fontSize: 12 }}>Journal</span>
              </button>
              <button
                id="header-history-btn"
                onClick={() => {
                  setHistoryOpen(true);
                  loadHistory();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 4,
                  cursor: "pointer",
                }}
              >
                <History size={16} />
                <span style={{ fontSize: 12 }}>History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live sync prompt banner if supported and disconnected */}
        {isLiveFileSupported() && !liveFileName && !liveBannerDismissed && (
          <div
            style={{
              margin: "10px 12px 0",
              background: ink.graphiteSoft,
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Link2 size={15} color={ink.yellow} style={{ flex: "0 0 auto" }} />
            <span style={{ flex: 1, fontSize: 12, color: "#D6D9DE", lineHeight: 1.35 }}>
              Turn on Live File Sync so every sale is written to a backup file automatically.
            </span>
            <button
              disabled={dataBusy}
              onClick={handleConnectLiveFile}
              style={{
                flex: "0 0 auto",
                background: ink.yellow,
                color: "#1B1D22",
                border: "none",
                borderRadius: 7,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Turn on
            </button>
            <button
              onClick={() => setLiveBannerDismissed(true)}
              style={{
                flex: "0 0 auto",
                background: "none",
                border: "none",
                color: "#8A8D93",
                cursor: "pointer",
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "12px 12px 4px", rowGap: 8 }}>
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon] || Tag;
            const active = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                className="cat-btn"
                onClick={() => setSelectedCat(cat.id)}
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 13px",
                  borderRadius: 10,
                  border: active ? `1px solid ${cat.color}` : `1px solid ${ink.graphiteSoft}`,
                  background: active ? cat.color : "transparent",
                  color: active ? "#fff" : "#B8BCC4",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={15} />
                {cat.name}
              </button>
            );
          })}
          <button
            id="open-manage-menu-btn"
            onClick={() => setManageOpen(true)}
            title="Manage categories, items & stock"
            style={{
              flex: "0 0 auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px dashed ${ink.graphiteSoft}`,
              background: "transparent",
              color: "#B8BCC4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            id="open-data-backup-btn"
            onClick={() => {
              setLiveFileName(getLiveFileName());
              setDataOpen(true);
            }}
            title="Data & backup"
            style={{
              flex: "0 0 auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px dashed ${ink.graphiteSoft}`,
              background: "transparent",
              color: "#B8BCC4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Database size={14} />
          </button>
          <button
            id="open-shortcuts-btn"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts (? or F1)"
            style={{
              flex: "0 0 auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px dashed ${ink.graphiteSoft}`,
              background: "transparent",
              color: "#B8BCC4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Keyboard size={14} />
          </button>
          <button
            id="open-held-orders-btn"
            onClick={() => setHeldOpen(true)}
            title="Held orders"
            style={{
              position: "relative",
              flex: "0 0 auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px dashed ${ink.graphiteSoft}`,
              background: "transparent",
              color: "#B8BCC4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <PauseCircle size={14} />
            {heldOrders.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  background: ink.yellow,
                  color: "#1B1D22",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  minWidth: 16,
                  height: 16,
                  padding: "0 3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {heldOrders.length}
              </span>
            )}
          </button>
        </div>
        <div style={{ height: 8 }} />

        {/* Items table */}
        <div
          style={{
            background: ink.paper,
            margin: "0 12px",
            borderRadius: 14,
            padding: "6px 4px 10px",
            flex: "0 0 auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#6B6F76", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ textAlign: "left", padding: "10px 8px 6px", fontWeight: 600 }}>Item</th>
                <th style={{ textAlign: "right", padding: "10px 4px 6px", fontWeight: 600 }}>Price</th>
                <th style={{ textAlign: "center", padding: "10px 4px 6px", fontWeight: 600 }} colSpan={2}>
                  Qty
                </th>
                <th style={{ textAlign: "right", padding: "10px 8px 6px", fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "16px 8px", color: "#8A8D93", fontSize: 12.5 }}>
                    No items yet — tap the pencil above to add one.
                  </td>
                </tr>
              )}
              {activeItems.map((it, idx) => {
                const q = qty[it.id] || 0;
                const isTracked = !!it.trackStock;
                const stockCount = it.stock ?? 0;
                const threshold = it.lowStockThreshold ?? 5;
                const isOutOfStock = isTracked && stockCount <= 0;
                const isLowStock = isTracked && stockCount > 0 && stockCount <= threshold;

                return (
                  <tr key={it.id} style={{ borderTop: idx === 0 ? "none" : `1px solid ${ink.paperDim}` }}>
                    <td style={{ padding: "9px 8px", fontSize: 13.5, color: ink.key, maxWidth: 140 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                          <span
                            title={accountInfo(it.account).label}
                            style={{
                              display: "inline-block",
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: accountInfo(it.account).color,
                              marginRight: 2,
                            }}
                          />
                          <span style={{ fontWeight: 500 }}>{it.name}</span>

                          {/* INLINE OUT OF STOCK WARNING BADGE */}
                          {isOutOfStock && (
                            <span
                              id={`item-out-of-stock-badge-${it.id}`}
                              className="mono"
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: "#FEE2E2",
                                color: "#DC2626",
                                border: "1px solid #FCA5A5",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <AlertCircle size={9} strokeWidth={2.5} /> Out of stock
                            </span>
                          )}

                          {/* INLINE LOW STOCK INDICATOR */}
                          {isLowStock && (
                            <span
                              id={`item-low-stock-badge-${it.id}`}
                              className="mono"
                              style={{
                                fontSize: 9.5,
                                fontWeight: 600,
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: "#FEF3C7",
                                color: "#B45309",
                                border: "1px solid #FCD34D",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 2,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {stockCount} left
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className="mono"
                      style={{ padding: "9px 4px", fontSize: 12.5, textAlign: "right", color: "#4B4F58" }}
                    >
                      {peso(it.price)}
                    </td>
                    <td style={{ padding: "4px 2px", textAlign: "center" }} colSpan={2}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <button
                          id={`qty-minus-${it.id}`}
                          className="qty-btn"
                          onClick={() => setItemQty(it.id, q - 1)}
                          disabled={q === 0}
                          title={q === 0 ? "Quantity is 0" : "Decrease quantity (-)"}
                          style={{
                            width: 44,
                            height: 44,
                            minWidth: 44,
                            minHeight: 44,
                            borderRadius: 8,
                            border: "none",
                            flex: "0 0 auto",
                            background: q === 0 ? "#E2DFD5" : ink.graphite,
                            color: q === 0 ? "#A9A69B" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: q === 0 ? "default" : "pointer",
                          }}
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <input
                          id={`qty-input-${it.id}`}
                          className="mono"
                          type="number"
                          min="0"
                          max={isTracked ? stockCount : undefined}
                          value={q === 0 ? "" : q}
                          placeholder="0"
                          onChange={(e) => setItemQty(it.id, parseInt(e.target.value, 10))}
                          style={{
                            width: 44,
                            height: 44,
                            textAlign: "center",
                            fontSize: 14,
                            fontWeight: 700,
                            color: ink.key,
                            border: `1px solid ${ink.paperDim}`,
                            borderRadius: 8,
                            padding: 0,
                            background: isOutOfStock && q === 0 ? "#FEE2E2" : "#fff",
                          }}
                        />
                        <button
                          id={`qty-plus-${it.id}`}
                          className="qty-btn"
                          onClick={() => setItemQty(it.id, q + 1)}
                          disabled={isOutOfStock || (isTracked && q >= stockCount)}
                          title={isOutOfStock ? "Out of stock" : "Increase quantity (+)"}
                          style={{
                            width: 44,
                            height: 44,
                            minWidth: 44,
                            minHeight: 44,
                            borderRadius: 8,
                            border: "none",
                            flex: "0 0 auto",
                            background:
                              isOutOfStock || (isTracked && q >= stockCount) ? "#E2DFD5" : ink.graphite,
                            color: isOutOfStock || (isTracked && q >= stockCount) ? "#A9A69B" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor:
                              isOutOfStock || (isTracked && q >= stockCount) ? "not-allowed" : "pointer",
                          }}
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                    <td
                      className="mono"
                      style={{
                        padding: "9px 8px",
                        fontSize: 12.5,
                        textAlign: "right",
                        fontWeight: 600,
                        color: q > 0 ? ink.magenta : "#B4B0A2",
                      }}
                    >
                      {peso(it.price * q)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Order summary */}
        <div style={{ margin: "14px 12px 0", flex: 1 }}>
          <div
            style={{
              background: "#1E222A",
              borderRadius: "12px 12px 0 0",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #2B303C",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  color: "#9CA3AF",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Order Summary
              </span>
              <span
                id="prominent-slip-no-badge"
                className="mono"
                style={{
                  background: ink.cyan,
                  color: "#0B132B",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 6,
                  letterSpacing: "0.03em",
                }}
              >
                SLIP #{upcomingSlipNo}
              </span>
            </div>

            {orderLines.length > 0 && (
              <button
                id="clear-order-btn"
                onClick={handleRequestClearOrder}
                title="Clear current order (Ctrl+Shift+X)"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.28)",
                  color: "#F87171",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={12} /> Clear Order
              </button>
            )}
          </div>
          <div style={{ background: ink.graphiteSoft, borderRadius: "0 0 12px 12px", padding: "4px 12px", minHeight: 40 }}>
            {orderLines.length === 0 ? (
              <p style={{ color: "#6B6F76", fontSize: 12.5, padding: "12px 0" }}>
                No items added yet — tap + on a category above.
              </p>
            ) : (
              orderLines.map((l, idx) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderTop: idx === 0 ? "none" : "1px solid #33363E",
                  }}
                >
                  <div>
                    <div style={{ color: ink.paper, fontSize: 13 }}>
                      {l.name}
                      {l.trackStock && (
                        <span style={{ fontSize: 10.5, color: ink.cyan, marginLeft: 6 }}>
                          (stock: {l.stock ?? 0})
                        </span>
                      )}
                    </div>
                    <div className="mono" style={{ color: "#7D818A", fontSize: 11 }}>
                      {l.qty} &times; {peso(l.price)}
                    </div>
                  </div>
                  <div className="mono" style={{ color: ink.paper, fontSize: 13.5, fontWeight: 600 }}>
                    {peso(l.lineTotal)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount */}
          <div style={{ background: ink.paper, borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#4B4F58", fontSize: 13, fontWeight: 600 }}>Discount</span>
              <div style={{ display: "flex", gap: 6 }}>
                {(["none", "percent", "fixed"] as const).map((t) => (
                  <button
                    key={t}
                    className="pill-btn"
                    onClick={() => {
                      setDiscountType(t);
                      if (t === "none") setDiscountValue("");
                    }}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 7,
                      cursor: "pointer",
                      border: discountType === t ? `1px solid ${ink.magenta}` : `1px solid ${ink.paperDim}`,
                      background: discountType === t ? ink.magenta : "transparent",
                      color: discountType === t ? "#fff" : "#6B6F76",
                    }}
                  >
                    {t === "none" ? "None" : t === "percent" ? "%" : "\u20B1"}
                  </button>
                ))}
              </div>
            </div>
            {discountType !== "none" && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: ink.paperDim,
                    borderRadius: 8,
                    padding: "6px 10px",
                  }}
                >
                  <input
                    className="mono"
                    inputMode="decimal"
                    placeholder={discountType === "percent" ? "0" : "0.00"}
                    value={discountValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(v)) setDiscountValue(v);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      width: 60,
                      textAlign: "right",
                      fontSize: 13,
                      color: ink.key,
                      fontWeight: 600,
                    }}
                  />
                  <span className="mono" style={{ color: "#6B6F76", fontSize: 13 }}>
                    {discountType === "percent" ? "%" : "\u20B1"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div style={{ background: ink.paper, borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
            <span style={{ color: "#4B4F58", fontSize: 13, fontWeight: 600 }}>Payment Method</span>
            <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    id={`pay-method-${m.id}`}
                    className="pill-btn"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "9px 0",
                      borderRadius: 9,
                      cursor: "pointer",
                      border: active ? `1px solid ${ink.key}` : `1px solid ${ink.paperDim}`,
                      background: active ? ink.key : "transparent",
                      color: active ? "#fff" : "#6B6F76",
                    }}
                  >
                    <Icon size={15} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {paymentMethod !== "cash" && (
              <input
                id="payment-note-input"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder={paymentMethod === "ewallet" ? "Reference no. (optional)" : "Note (optional)"}
                style={{
                  width: "100%",
                  marginTop: 9,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${ink.paperDim}`,
                  fontSize: 12.5,
                  color: ink.key,
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>

          {/* Customer details */}
          <div style={{ background: ink.paper, borderRadius: 12, padding: "12px 14px", marginTop: 10 }}>
            <button
              onClick={() => setCustomerFormOpen((o) => !o)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#4B4F58", fontSize: 13, fontWeight: 600 }}>
                Customer Details <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional, for receipt)</span>
              </span>
              {customerFormOpen ? <ChevronUp size={16} color="#8A8D93" /> : <ChevronDown size={16} color="#8A8D93" />}
            </button>
            {customerFormOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Sold To (customer name)"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${ink.paperDim}`,
                    fontSize: 12.5,
                    color: ink.key,
                    boxSizing: "border-box",
                  }}
                />
                <input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Address"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${ink.paperDim}`,
                    fontSize: 12.5,
                    color: ink.key,
                    boxSizing: "border-box",
                  }}
                />
                <input
                  value={customerTIN}
                  onChange={(e) => setCustomerTIN(e.target.value)}
                  placeholder="TIN"
                  className="mono"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${ink.paperDim}`,
                    fontSize: 12.5,
                    color: ink.key,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>

          {/* Totals + payment */}
          <div style={{ background: ink.paper, borderRadius: 12, padding: "14px 14px", marginTop: 10 }}>
            {discountAmount > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#7D818A" }}>
                  <span>Subtotal</span>
                  <span className="mono">{peso(subtotal)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    color: ink.magenta,
                    marginTop: 4,
                  }}
                >
                  <span>Discount</span>
                  <span className="mono">-{peso(discountAmount)}</span>
                </div>
                <div style={{ borderTop: `1px dashed ${ink.paperDim}`, margin: "8px 0" }} />
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#4B4F58", fontSize: 14, fontWeight: 600 }}>Total</span>
              <span className="mono" style={{ color: ink.key, fontSize: 20, fontWeight: 700 }}>
                {peso(total)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <label style={{ color: "#4B4F58", fontSize: 13 }} htmlFor="tendered">
                Amount Received
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: ink.paperDim,
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                <span className="mono" style={{ color: "#6B6F76", fontSize: 13 }}>
                  &#8369;
                </span>
                <input
                  id="tendered"
                  className="mono"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={tendered}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(v)) setTendered(v);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    width: 80,
                    textAlign: "right",
                    fontSize: 14,
                    color: ink.key,
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ color: "#4B4F58", fontSize: 13 }}>Change</span>
              <span
                className="mono"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: !hasTendered ? "#A9A69B" : change < 0 ? ink.danger : ink.magenta,
                }}
              >
                {!hasTendered ? "\u2014" : peso(Math.abs(change))}
                {hasTendered && change < 0 ? " short" : ""}
              </span>
            </div>
          </div>

          {/* Action buttons: Hold, Transaction Paid (triggers confirmation), Print Receipt */}
          <div style={{ display: "flex", gap: 10, marginTop: 12, paddingBottom: 22 }}>
            <button
              id="hold-order-btn"
              onClick={() => holdCurrentOrder(false)}
              disabled={orderLines.length === 0}
              title="Hold this order to start another one"
              style={{
                flex: "0 0 auto",
                width: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: orderLines.length === 0 ? "#4B4F58" : ink.yellow,
                border: `1px solid ${ink.graphiteSoft}`,
                borderRadius: 10,
                padding: "12px 0",
                cursor: orderLines.length === 0 ? "default" : "pointer",
              }}
            >
              <PauseCircle size={17} />
            </button>

            {/* CONFIRMATION BEFORE TAGGING PAID */}
            <button
              id="tag-transaction-paid-btn"
              onClick={handleInitiatePayment}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: ink.key,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Check size={15} color={ink.cyan} /> Transaction Paid
            </button>

            <button
              id="print-receipt-btn"
              onClick={handlePrintReceipt}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                background: "transparent",
                color: ink.paper,
                border: `1px solid ${ink.graphiteSoft}`,
                borderRadius: 10,
                padding: "12px 0",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <PrintIcon size={15} /> Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before tagging transaction paid */}
      <PaymentConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPayment}
        slipNo={upcomingSlipNo}
        total={total}
        subtotal={subtotal}
        discountAmount={discountAmount}
        tendered={tenderedNum}
        change={change}
        paymentMethod={paymentMethod}
        paymentNote={paymentNote}
        orderLines={orderLines}
        customerName={customerName}
      />

      {/* Confirm Discard Held Order Modal */}
      <ConfirmModal
        isOpen={!!confirmDiscardHeld}
        title="Discard Held Order?"
        description={
          confirmDiscardHeld ? (
            <div>
              Are you sure you want to discard held order{" "}
              <strong>&ldquo;{confirmDiscardHeld.label}&rdquo;</strong>?
              <div style={{ marginTop: 8, fontSize: 12, color: "#6B6F76" }}>
                You can undo this action immediately after discarding.
              </div>
            </div>
          ) : null
        }
        confirmLabel="Discard Order"
        cancelLabel="Keep Order"
        variant="danger"
        onConfirm={() => {
          if (confirmDiscardHeld) {
            deleteHeldOrder(confirmDiscardHeld.id);
            setConfirmDiscardHeld(null);
          }
        }}
        onCancel={() => setConfirmDiscardHeld(null)}
      />

      {/* Confirm Clear Active Order Modal */}
      <ConfirmModal
        isOpen={confirmClearOrder}
        title="Clear Current Order?"
        description={
          <div>
            Are you sure you want to clear the active order with{" "}
            <strong>{orderLines.length} item(s)</strong> totaling{" "}
            <strong>{peso(total)}</strong>?
            <div style={{ marginTop: 8, fontSize: 12, color: "#6B6F76" }}>
              You can undo this action immediately with{" "}
              <kbd
                style={{
                  background: "#F3F1EA",
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  color: "#1B1D22",
                  border: "1px solid #D6D9DE",
                }}
              >
                Ctrl+Z
              </kbd>
              .
            </div>
          </div>
        }
        confirmLabel="Clear Order"
        cancelLabel="Keep Order"
        variant="danger"
        onConfirm={handleConfirmClearOrder}
        onCancel={() => setConfirmClearOrder(false)}
      />

      {/* Confirm Reset Dataset Modal */}
      <ConfirmModal
        isOpen={confirmResetSnapshot}
        title="Reload JSON Dataset?"
        description={
          <div>
            This will reload the initial JSON snapshot, refreshing categories, items, and transactions from the backup file.
          </div>
        }
        confirmLabel="Reload Dataset"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={async () => {
          setConfirmResetSnapshot(false);
          setDataBusy(true);
          try {
            const summary = await resetToInitialSnapshot();
            const cfg = await loadConfig();
            setCategories(cfg.categories);
            setMenu(cfg.menu);
            setSelectedCat(cfg.categories[0]?.id || DEFAULT_CATEGORIES[0].id);
            setUpcomingSlipNo(peekNextReceiptNo());
            setToast(`Applied JSON update: ${summary.itemsCount} items and ${summary.transactionsCount} transactions loaded.`);
          } catch {
            setToast("Failed to reload JSON dataset.");
          }
          setDataBusy(false);
        }}
        onCancel={() => setConfirmResetSnapshot(false)}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Floating Undo Toast Banner */}
      <UndoToast
        undoItem={undoAction}
        onDismiss={() => setUndoAction(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          id="app-toast-notification"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: ink.key,
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,.35)",
            zIndex: 90,
            maxWidth: "90%",
          }}
        >
          <Check size={14} color={ink.yellow} /> {toast}
        </div>
      )}

      {/* Manage Menu Drawer (with Menu & Items + Stock Tracking tabs) */}
      <ManageMenuDrawer
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        categories={categories}
        menu={menu}
        selectedCatId={selectedCat}
        onSelectCat={(id) => {
          setSelectedCat(id);
          setManageOpen(false);
        }}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
        onMoveCategory={moveCategory}
        onAddItem={addItem}
        onSaveEditItem={saveEditItem}
        onDeleteItem={deleteItem}
        onMoveItem={moveItem}
        onUpdateItemStock={updateItemStock}
        iconsMap={ICONS}
        iconKeys={ICON_KEYS}
        accounts={ACCOUNTS}
        ink={ink}
        peso={peso}
      />

      {/* History drawer */}
      {historyOpen && (
        <Drawer onClose={() => setHistoryOpen(false)} title="Recent Transactions">
          {historyLoading ? (
            <p style={{ color: "#6B6F76", fontSize: 13 }}>Loading&hellip;</p>
          ) : history.length === 0 ? (
            <p style={{ color: "#6B6F76", fontSize: 13 }}>No saved transactions yet.</p>
          ) : (
            history.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 10,
                  border: `1px solid ${ink.paperDim}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    fontSize: 12.5,
                    color: "#6B6F76",
                  }}
                >
                  <span>
                    Order Slip #{t.receiptNo} &middot;{" "}
                    {{ cash: "Cash", ewallet: "E-wallet", other: "Other" }[t.paymentMethod] || "Cash"}
                  </span>
                  <button
                    onClick={() => handlePrintHistoryTxn(t)}
                    title="Print this order slip"
                    style={{
                      flex: "0 0 auto",
                      background: "none",
                      border: "none",
                      color: ink.key,
                      cursor: "pointer",
                      padding: "0 0 0 8px",
                    }}
                  >
                    <PrintIcon size={14} />
                  </button>
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: "#8A8D93", marginTop: 2 }}>
                  {t.dateLabel}
                </div>
                {t.items.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12.5,
                      color: ink.key,
                      marginTop: 6,
                    }}
                  >
                    <span>
                      {l.qty}&times; {l.name}
                    </span>
                    <span className="mono">{peso(l.lineTotal)}</span>
                  </div>
                ))}
                {t.discountAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: ink.magenta,
                      marginTop: 6,
                    }}
                  >
                    <span>Discount</span>
                    <span className="mono">-{peso(t.discountAmount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: `1px dashed ${ink.paperDim}`,
                    fontWeight: 700,
                    fontSize: 13,
                    color: ink.key,
                  }}
                >
                  <span>Total</span>
                  <span className="mono">{peso(t.total)}</span>
                </div>
              </div>
            ))
          )}
        </Drawer>
      )}

      {/* Held orders drawer */}
      {heldOpen && (
        <Drawer onClose={() => setHeldOpen(false)} title="Held Orders">
          {heldOrders.length === 0 ? (
            <p style={{ color: "#6B6F76", fontSize: 13 }}>
              No orders on hold. Tap the pause icon next to Transaction Paid to park an in-progress order and start
              another one.
            </p>
          ) : (
            heldOrders
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((h) => {
                const stats = heldOrderStats(h);
                return (
                  <div
                    key={h.id}
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 10,
                      border: `1px solid ${ink.paperDim}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: ink.key }}>{h.label}</div>
                        <div className="mono" style={{ fontSize: 11.5, color: "#8A8D93", marginTop: 2 }}>
                          {new Date(h.createdAt).toLocaleTimeString("en-PH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          &middot; {stats.count} item{stats.count === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: ink.key }}>
                        {peso(stats.total)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => resumeHeldOrder(h.id)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          background: ink.key,
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 0",
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <PlayCircle size={14} /> Resume
                      </button>
                      <button
                        id={`discard-held-order-${h.id}`}
                        onClick={() => setConfirmDiscardHeld(h)}
                        title="Discard this held order"
                        style={{
                          flex: "0 0 auto",
                          width: 38,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          color: ink.danger,
                          border: `1px solid ${ink.paperDim}`,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </Drawer>
      )}

      {/* Sales summary drawer */}
      {salesOpen && (
        <Drawer onClose={() => setSalesOpen(false)} title="Daily Sales Summary">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => {
                const d = new Date(salesDate + "T00:00:00");
                d.setDate(d.getDate() - 1);
                const s = todayStr(d);
                setSalesDate(s);
                loadSales(s);
              }}
              style={{ background: "none", border: "none", color: "#6B6F76", cursor: "pointer" }}
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              className="mono"
              value={salesDate}
              onChange={(e) => {
                setSalesDate(e.target.value);
                loadSales(e.target.value);
              }}
              style={{
                border: `1px solid ${ink.paperDim}`,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 13,
                color: ink.key,
              }}
            />
            <button
              onClick={() => {
                const d = new Date(salesDate + "T00:00:00");
                d.setDate(d.getDate() + 1);
                const s = todayStr(d);
                setSalesDate(s);
                loadSales(s);
              }}
              style={{ background: "none", border: "none", color: "#6B6F76", cursor: "pointer" }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {salesLoading || !salesData ? (
            <p style={{ color: "#6B6F76", fontSize: 13, textAlign: "center" }}>Loading&hellip;</p>
          ) : (
            <>
              <div
                style={{
                  background: ink.key,
                  borderRadius: 12,
                  padding: "18px 16px",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    color: "#9CA3AF",
                    fontSize: 11.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Total Sales
                </div>
                <div className="mono" style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                  {peso(salesData.totalSales)}
                </div>
                <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
                  {salesData.count} transaction{salesData.count === 1 ? "" : "s"}
                  {salesData.totalDiscount > 0 ? ` \u00b7 ${peso(salesData.totalDiscount)} discounts given` : ""}
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${ink.paperDim}`,
                  marginBottom: 12,
                }}
              >
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
                  By Payment Method
                </div>
                {PAYMENT_METHODS.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: ink.key,
                      padding: "5px 0",
                    }}
                  >
                    <span>{m.label}</span>
                    <span className="mono">{peso(salesData.byMethod[m.id] || 0)}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${ink.paperDim}`,
                  marginBottom: 12,
                }}
              >
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
                  By Account
                </div>
                {ACCOUNTS.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 13,
                      color: ink.key,
                      padding: "5px 0",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: a.color,
                          display: "inline-block",
                        }}
                      />
                      {a.label}
                    </span>
                    <span className="mono">{peso((salesData.byAccount && salesData.byAccount[a.id]) || 0)}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${ink.paperDim}`,
                }}
              >
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
                  Items Sold
                </div>
                {salesData.topItems.length === 0 ? (
                  <p style={{ color: "#8A8D93", fontSize: 12.5 }}>No items sold on this day.</p>
                ) : (
                  salesData.topItems.map(([name, q]: [string, number]) => (
                    <div
                      key={name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: ink.key,
                        padding: "5px 0",
                      }}
                    >
                      <span>{name}</span>
                      <span className="mono">{q}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Drawer>
      )}

      {/* Cash Receipts Journal drawer */}
      {journalOpen && (
        <Drawer onClose={() => setJournalOpen(false)} title="Cash Receipts Journal">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <label style={{ fontSize: 11.5, color: "#6B6F76" }}>
              From{" "}
              <input
                type="date"
                className="mono"
                value={journalFrom}
                onChange={(e) => {
                  setJournalFrom(e.target.value);
                  loadJournal(e.target.value, journalTo);
                }}
                style={{
                  border: `1px solid ${ink.paperDim}`,
                  borderRadius: 7,
                  padding: "5px 8px",
                  fontSize: 12.5,
                  color: ink.key,
                }}
              />
            </label>
            <label style={{ fontSize: 11.5, color: "#6B6F76" }}>
              To{" "}
              <input
                type="date"
                className="mono"
                value={journalTo}
                onChange={(e) => {
                  setJournalTo(e.target.value);
                  loadJournal(journalFrom, e.target.value);
                }}
                style={{
                  border: `1px solid ${ink.paperDim}`,
                  borderRadius: 7,
                  padding: "5px 8px",
                  fontSize: 12.5,
                  color: ink.key,
                }}
              />
            </label>
            <button
              onClick={() =>
                downloadCSVFile(transactionsToCSV(journalTxns), `crj-${journalFrom}_to_${journalTo}.csv`)
              }
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "transparent",
                color: ink.key,
                border: `1px solid ${ink.paperDim}`,
                borderRadius: 7,
                padding: "6px 11px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={() =>
                printJournalWindow(
                  journalTxns,
                  journalFrom === journalTo ? journalFrom : `${journalFrom} to ${journalTo}`,
                  setToast
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: ink.key,
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "6px 11px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <PrintIcon size={13} /> Print
            </button>
          </div>

          {journalLoading ? (
            <p style={{ color: "#6B6F76", fontSize: 13, marginTop: 10 }}>Loading&hellip;</p>
          ) : journalTxns.length === 0 ? (
            <p style={{ color: "#6B6F76", fontSize: 13, marginTop: 10 }}>No transactions in this date range.</p>
          ) : (
            (() => {
              let sSales = 0,
                sService = 0,
                sSundry = 0,
                sTotal = 0;
              journalTxns.forEach((t) => {
                sSales += t.split.sales;
                sService += t.split.service;
                sSundry += t.split.sundry;
                sTotal += t.total || 0;
              });
              return (
                <div
                  style={{
                    overflowX: "auto",
                    marginTop: 10,
                    border: `1px solid ${ink.paperDim}`,
                    borderRadius: 8,
                  }}
                >
                  <table
                    className="mono"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 11,
                      minWidth: 620,
                      background: "#fff",
                    }}
                  >
                    <thead>
                      <tr style={{ background: ink.paperDim }}>
                        {["Date", "Slip No.", "Particulars", "Mode", "Sales", "Service", "Sundry", "Total"].map(
                          (h, i) => (
                            <th
                              key={h}
                              style={{
                                textAlign: i >= 4 ? "right" : "left",
                                padding: "7px 8px",
                                fontWeight: 700,
                                color: "#4B4F58",
                                borderBottom: `2px solid ${ink.key}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {journalTxns.map((t) => (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${ink.paperDim}` }}>
                          <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                            {new Date(t.timestamp).toLocaleDateString("en-PH")}
                          </td>
                          <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{t.receiptNo}</td>
                          <td
                            style={{
                              padding: "6px 8px",
                              color: ink.key,
                              fontFamily: "'Space Grotesk', sans-serif",
                              maxWidth: 130,
                            }}
                          >
                            {t.customerName || t.paymentNote || "Cash sales"}
                          </td>
                          <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                            {{ cash: "Cash", ewallet: "E-wallet", other: "Other" }[t.paymentMethod] || "Cash"}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>
                            {t.split.sales ? peso(t.split.sales) : "\u2014"}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>
                            {t.split.service ? peso(t.split.service) : "\u2014"}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>
                            {t.split.sundry ? peso(t.split.sundry) : "\u2014"}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>
                            {peso(t.total)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: `2px solid ${ink.key}`, fontWeight: 700 }}>
                        <td colSpan={4} style={{ padding: "8px" }}>
                          TOTAL
                        </td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{peso(sSales)}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{peso(sService)}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{peso(sSundry)}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{peso(sTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()
          )}
        </Drawer>
      )}

      {/* Data & backup drawer */}
      {dataOpen && (
        <Drawer onClose={() => setDataOpen(false)} title="Data & Backup">
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: "none" }}
          />

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
            Where your data lives
          </div>
          <p style={{ fontSize: 12.5, color: "#6B6F76", lineHeight: 1.5, marginTop: 0 }}>
            Your menu, stock counts, and saved transactions are stored on this device/browser (via localStorage).
            Use Export or Live File Sync below to keep a real backup.
          </p>

          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "12px 14px",
              border: `1px solid ${ink.paperDim}`,
              marginTop: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4B4F58",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Live File Sync
            </div>
            {isLiveFileSupported() ? (
              liveFileName ? (
                <>
                  <p style={{ fontSize: 12.5, color: ink.key, margin: "6px 0" }}>
                    Synced to <b>{liveFileName}</b> — updated automatically on every save.
                  </p>
                  <button
                    onClick={handleDisconnectLiveFile}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "transparent",
                      border: `1px solid ${ink.paperDim}`,
                      color: ink.danger,
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Unlink size={14} /> Disconnect
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12.5, color: "#6B6F76", margin: "6px 0" }}>
                    Pick a .json file once — this app will keep writing your latest data to it after every save,
                    automatically.
                  </p>
                  <button
                    disabled={dataBusy}
                    onClick={handleConnectLiveFile}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: ink.key,
                      border: "none",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Link2 size={14} /> Connect a backup file
                  </button>
                </>
              )
            ) : (
              <p style={{ fontSize: 12.5, color: "#6B6F76", margin: "6px 0" }}>
                This browser doesn't support live file sync (desktop Chrome/Edge only). Use Export / Import below
                instead.
              </p>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "12px 14px",
              border: `1px solid ${ink.paperDim}`,
              marginTop: 10,
            }}
          >
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
              Export
            </div>
            <p style={{ fontSize: 12.5, color: "#6B6F76", margin: "0 0 8px" }}>
              Download a full backup (.json, used to restore menu and inventory into this app) or a spreadsheet-ready
              copy of every transaction (.csv).
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={dataBusy}
                onClick={handleExport}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: ink.key,
                  border: "none",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={14} /> Backup (.json)
              </button>
              <button
                disabled={dataBusy}
                onClick={handleExportCSV}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: `1px solid ${ink.paperDim}`,
                  color: ink.key,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={14} /> All Transactions (.csv)
              </button>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "12px 14px",
              border: `1px solid ${ink.paperDim}`,
              marginTop: 10,
            }}
          >
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
              Import
            </div>
            <p style={{ fontSize: 12.5, color: "#6B6F76", margin: "0 0 8px" }}>
              Restore from a backup file. Your menu and stock will be replaced; transactions are merged in.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={dataBusy}
                onClick={handleImportClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: `1px solid ${ink.paperDim}`,
                  color: ink.key,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Upload size={14} /> Choose Backup File
              </button>
              <button
                disabled={dataBusy}
                onClick={handleResetToInitial}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: `1px solid ${ink.paperDim}`,
                  color: ink.key,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={14} /> Reload JSON Dataset
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 60,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: ink.paper,
          height: "100%",
          overflowY: "auto",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: ink.key }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6F76" }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
