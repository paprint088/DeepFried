import { Category, MenuState, MenuItem, Transaction, HeldOrder } from "./types.ts";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "print", name: "Print", icon: "Printer", color: "#0EA5C4" },
  { id: "photocopy", name: "Photocopy", icon: "Copy", color: "#1B1D22" },
  { id: "id", name: "ID Picture", icon: "Image", color: "#D6247A" },
  { id: "others", name: "Others", icon: "Package", color: "#C98A00" },
  { id: "stationary", name: "Stationary", icon: "PenTool", color: "#0E9488" },
];

export const DEFAULT_MENU: MenuState = {
  print: [
    { id: "p1", name: "Print Doc 10", price: 10, account: "service", trackStock: false },
    { id: "p2", name: "Print Doc 15", price: 15, account: "service", trackStock: false },
    { id: "p3", name: "Print Doc 20", price: 20, account: "service", trackStock: false },
    { id: "p4", name: "Print Doc 25", price: 25, account: "service", trackStock: false },
    { id: "p5", name: "Print Doc 30", price: 30, account: "service", trackStock: false },
    {
      id: "print-photo-wallet-2pcs-mttoma6n-14vn",
      name: "Print Photo Wallet (2pcs)",
      price: 35,
      account: "service",
      trackStock: false,
    },
    {
      id: "print-photo-3r-mttomq0m-6v4a",
      name: "Print Photo 3R",
      price: 30,
      account: "service",
      trackStock: false,
    },
    {
      id: "print-photo-4r-mtton3fq-qjtt",
      name: "Print Photo 4R",
      price: 40,
      account: "service",
      trackStock: false,
    },
    {
      id: "print-photo-5r-mttonha6-s181",
      name: "Print Photo 5R",
      price: 50,
      account: "service",
      trackStock: false,
    },
    {
      id: "print-photo-a4-mttonxqm-0545",
      name: "Print Photo A4",
      price: 100,
      account: "service",
      trackStock: false,
    },
  ],
  photocopy: [
    { id: "c1", name: "Photocopy B&W Text", price: 5, account: "service", trackStock: false },
    { id: "c2", name: "Photocopy B&W 10", price: 10, account: "service", trackStock: false },
    { id: "c3", name: "Photocopy Colored 15", price: 10, account: "service", trackStock: false },
    {
      id: "photocopy-colored-20-mttorl0t-lspx",
      name: "Photocopy Colored 20",
      price: 2,
      account: "service",
      trackStock: false,
    },
    {
      id: "photocopy-colored-25-mttoru5i-gr2v",
      name: "Photocopy Colored 25",
      price: 25,
      account: "service",
      trackStock: false,
    },
  ],
  id: [
    { id: "i1", name: "1x1 ID Picture 6 pcs", price: 100, account: "service", trackStock: false },
    { id: "i2", name: "2x2 ID Picture 6 pcs", price: 150, account: "service", trackStock: false },
    { id: "i3", name: "Passport Size ID Pic 6 pcs", price: 150, account: "service", trackStock: false },
    { id: "i4", name: "ID Pic Set A", price: 150, account: "service", trackStock: false },
    {
      id: "id-pic-set-b-mttouuxz-gfjz",
      name: "ID Pic Set B",
      price: 180,
      account: "service",
      trackStock: false,
    },
    {
      id: "id-pic-set-c-mttov8ee-4er6",
      name: "ID Pic Set C",
      price: 180,
      account: "service",
      trackStock: false,
    },
  ],
  others: [
    { id: "o1", name: "Lamination Small ID", price: 35, account: "service", trackStock: false },
    { id: "o2", name: "Lamination Medium ID", price: 40, account: "service", trackStock: false },
    { id: "o3", name: "Lamination 5R", price: 50, account: "service", trackStock: false },
    { id: "o4", name: "Lamination A4/Long", price: 100, account: "service", trackStock: false },
    { id: "o5", name: "Layout / Editing", price: 20, account: "service", trackStock: false },
  ],
  stationary: [
    {
      id: "s1",
      name: "Ballpen",
      price: 15,
      account: "sales",
      trackStock: true,
      stock: 25,
      lowStockThreshold: 5,
    },
    {
      id: "s2",
      name: "Bond Paper (per sheet)",
      price: 2,
      account: "sales",
      trackStock: true,
      stock: 150,
      lowStockThreshold: 20,
    },
    {
      id: "s3",
      name: "Folder",
      price: 15,
      account: "sales",
      trackStock: true,
      stock: 15,
      lowStockThreshold: 5,
    },
    {
      id: "s4",
      name: "Brown Envelope",
      price: 10,
      account: "sales",
      trackStock: true,
      stock: 20,
      lowStockThreshold: 5,
    },
    {
      id: "plastic-envelope-mtuqp4oz-ukao",
      name: "Plastic Envelope",
      price: 25,
      account: "sales",
      trackStock: true,
      stock: 20,
      lowStockThreshold: 5,
    },
    {
      id: "scissor-mtwwpwii-r7g9",
      name: "Scissor",
      price: 25,
      account: "sales",
      trackStock: true,
      stock: 10,
      lowStockThreshold: 3,
    },
    {
      id: "id-holder-jl-107-mtwws5al-x4az",
      name: "ID Holder JL-107",
      price: 10,
      account: "sales",
      trackStock: true,
      stock: 30,
      lowStockThreshold: 5,
    },
    {
      id: "id-holder-cx-108-mtwwvfve-pxqr",
      name: "ID Holder CX-108",
      price: 10,
      account: "sales",
      trackStock: true,
      stock: 30,
      lowStockThreshold: 5,
    },
    {
      id: "id-lace-plaine-1-2-mtwwxj38-kvbt",
      name: "ID Lace Plain 1/2",
      price: 10,
      account: "sales",
      trackStock: true,
      stock: 30,
      lowStockThreshold: 5,
    },
  ],
};

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "txn:2609-00001",
    receiptNo: "2609-00001",
    timestamp: 1789108097095,
    dateLabel: "9/11/2026, 2:28:17 PM",
    items: [
      { name: "Print Doc 10", price: 10, qty: 1, lineTotal: 10, account: "service" },
      { name: "Print Doc 15", price: 15, qty: 1, lineTotal: 15, account: "service" },
      { name: "Photocopy B&W Text", price: 5, qty: 1, lineTotal: 5, account: "service" },
      { name: "Ballpen", price: 15, qty: 1, lineTotal: 15, account: "sales" },
      { name: "Brown Envelope", price: 10, qty: 1, lineTotal: 10, account: "sales" },
      { name: "Plastic Envelope", price: 25, qty: 1, lineTotal: 25, account: "sales" },
    ],
    subtotal: 80,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 80,
    paymentMethod: "cash",
    paymentNote: "",
    customerName: "",
    customerAddress: "",
    customerTIN: "",
    tendered: 100,
    change: 20,
  },
  {
    id: "txn:2609-00002",
    receiptNo: "2609-00002",
    timestamp: 1789108109394,
    dateLabel: "9/11/2026, 2:28:29 PM",
    items: [
      { name: "Ballpen", price: 15, qty: 1, lineTotal: 15, account: "sales" },
      { name: "Brown Envelope", price: 10, qty: 2, lineTotal: 20, account: "sales" },
      { name: "Plastic Envelope", price: 25, qty: 2, lineTotal: 50, account: "sales" },
    ],
    subtotal: 85,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 85,
    paymentMethod: "cash",
    paymentNote: "",
    customerName: "Betchay",
    customerAddress: "",
    customerTIN: "",
    tendered: 100,
    change: 15,
  },
  {
    id: "txn:2609-00003",
    receiptNo: "2609-00003",
    timestamp: 1789108135683,
    dateLabel: "9/11/2026, 2:28:55 PM",
    items: [
      { name: "Photocopy B&W Text", price: 5, qty: 15, lineTotal: 75, account: "service" },
    ],
    subtotal: 75,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 75,
    paymentMethod: "cash",
    paymentNote: "",
    customerName: "",
    customerAddress: "",
    customerTIN: "",
    tendered: 75,
    change: 0,
  },
  {
    id: "txn:2609-00004",
    receiptNo: "2609-00004",
    timestamp: 1789123960569,
    dateLabel: "9/11/2026, 6:52:40 PM",
    items: [
      {
        name: "Lamination A4/Long",
        price: 100,
        qty: 1,
        lineTotal: 100,
        account: "service",
      },
    ],
    subtotal: 100,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 100,
    paymentMethod: "cash",
    paymentNote: "",
    customerName: "",
    customerAddress: "",
    customerTIN: "",
    tendered: 100,
    change: 0,
  },
  {
    id: "txn:2609-00005",
    receiptNo: "2609-00005",
    timestamp: 1789128017513,
    dateLabel: "9/11/2026, 8:00:17 PM",
    items: [
      {
        name: "Print Doc 10",
        price: 10,
        qty: 3,
        lineTotal: 30,
        account: "service",
      },
      {
        name: "Photocopy B&W Text",
        price: 5,
        qty: 25,
        lineTotal: 125,
        account: "service",
      },
    ],
    subtotal: 155,
    discountType: "fixed",
    discountValue: 5,
    discountAmount: 5,
    total: 150,
    paymentMethod: "cash",
    paymentNote: "",
    customerName: "",
    customerAddress: "",
    customerTIN: "",
    tendered: 150,
    change: 0,
  },
];

export const INITIAL_SNAPSHOT: AppSnapshot = {
  app: "PaPrint & Copy",
  version: 1,
  exportedAt: "2026-09-11T12:08:59.180Z",
  categories: DEFAULT_CATEGORIES,
  menu: DEFAULT_MENU,
  transactions: DEFAULT_TRANSACTIONS,
};

const CONFIG_KEY = "shop-config";
const TXN_PREFIX = "txn:";
const HELD_KEY = "held-orders";
const SEED_VERSION_KEY = "paprint_seed_version_20260911_v3";

/* ---------------- Raw localStorage helpers ---------------- */
function rawGet(key: string): { key: string; value: string } | null {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? null : { key, value: v };
  } catch {
    return null;
  }
}

function rawSet(key: string, value: string): { key: string; value: string } | null {
  try {
    window.localStorage.setItem(key, value);
    return { key, value };
  } catch {
    return null;
  }
}

function rawList(prefix: string): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.sort();
    return keys;
  } catch {
    return [];
  }
}

/* ---------------- Menu / category config ---------------- */
function normalizeMenuItem(it: MenuItem): MenuItem {
  const isSales = it.account === "sales";
  return {
    ...it,
    trackStock: typeof it.trackStock === "boolean" ? it.trackStock : isSales,
    stock: typeof it.stock === "number" ? it.stock : (isSales ? 10 : 0),
    lowStockThreshold: typeof it.lowStockThreshold === "number" ? it.lowStockThreshold : 5,
  };
}

export async function saveConfig(categories: Category[], menu: MenuState): Promise<void> {
  rawSet(CONFIG_KEY, JSON.stringify({ categories, menu }));
  await syncLiveFile();
}

/* ---------------- Receipt numbering (YYMM-00001) ---------------- */
export function currentYYMM(d = new Date()): string {
  return String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, "0");
}

export function peekNextReceiptNo(d = new Date()): string {
  const yymm = currentYYMM(d);
  const counterKey = `txn-counter-${yymm}`;
  const res = rawGet(counterKey);
  const n = res ? parseInt(res.value, 10) + 1 : 1;
  return `${yymm}-${String(n).padStart(5, "0")}`;
}

export async function nextReceiptNo(): Promise<string> {
  const yymm = currentYYMM();
  const counterKey = `txn-counter-${yymm}`;
  const res = rawGet(counterKey);
  const n = res ? parseInt(res.value, 10) + 1 : 1;
  rawSet(counterKey, String(n));
  return `${yymm}-${String(n).padStart(5, "0")}`;
}

function bumpCounter(yymm: string, n: number): void {
  const counterKey = `txn-counter-${yymm}`;
  const res = rawGet(counterKey);
  const current = res ? parseInt(res.value, 10) : 0;
  if (n > current) rawSet(counterKey, String(n));
}

/* ---------------- Snapshot apply helper ---------------- */
export async function applySnapshot(data: AppSnapshot): Promise<{ categoriesCount: number; itemsCount: number; transactionsCount: number }> {
  // Normalize menu items in snapshot
  const normalizedMenu: MenuState = {};
  for (const [catId, items] of Object.entries(data.menu)) {
    normalizedMenu[catId] = (items || []).map(normalizeMenuItem);
  }
  await saveConfig(data.categories, normalizedMenu);

  let imported = 0;
  for (const txn of data.transactions) {
    if (!txn || !txn.receiptNo) continue;
    rawSet(`${TXN_PREFIX}${txn.receiptNo}`, JSON.stringify(txn));
    const [yymm, seqStr] = String(txn.receiptNo).split("-");
    const seq = parseInt(seqStr, 10);
    if (yymm && !isNaN(seq)) bumpCounter(yymm, seq);
    imported++;
  }
  await syncLiveFile();

  return {
    categoriesCount: data.categories.length,
    itemsCount: Object.values(normalizedMenu).reduce((s, arr) => s + arr.length, 0),
    transactionsCount: imported,
  };
}

export async function resetToInitialSnapshot(): Promise<{ categoriesCount: number; itemsCount: number; transactionsCount: number }> {
  const summary = await applySnapshot(INITIAL_SNAPSHOT);
  rawSet(SEED_VERSION_KEY, "applied_v3");
  return summary;
}

export async function loadConfig(): Promise<{ categories: Category[]; menu: MenuState }> {
  // Automatically apply seed update on initial run or version bump
  const seedApplied = rawGet(SEED_VERSION_KEY);
  if (!seedApplied || seedApplied.value !== "applied_v3") {
    await applySnapshot(INITIAL_SNAPSHOT);
    rawSet(SEED_VERSION_KEY, "applied_v3");
    return { categories: INITIAL_SNAPSHOT.categories, menu: INITIAL_SNAPSHOT.menu };
  }

  const res = rawGet(CONFIG_KEY);
  if (res && res.value) {
    try {
      const cfg = JSON.parse(res.value);
      if (cfg.categories && cfg.menu) {
        // Normalize menu items with stock tracking fields
        const normalizedMenu: MenuState = {};
        for (const [catId, items] of Object.entries(cfg.menu as MenuState)) {
          normalizedMenu[catId] = (items || []).map(normalizeMenuItem);
        }
        return { categories: cfg.categories, menu: normalizedMenu };
      }
    } catch {
      /* fall through to defaults */
    }
  }
  return { categories: DEFAULT_CATEGORIES, menu: DEFAULT_MENU };
}

/* ---------------- Transactions ---------------- */
export async function saveTransaction(txn: Transaction): Promise<void> {
  rawSet(`${TXN_PREFIX}${txn.receiptNo}`, JSON.stringify(txn));
  await syncLiveFile();
}

export async function listTransactions(limit = 3000): Promise<Transaction[]> {
  const keys = rawList(TXN_PREFIX).slice(-limit);
  const txns: Transaction[] = [];
  for (const k of keys) {
    const r = rawGet(k);
    if (r) {
      try {
        txns.push(JSON.parse(r.value));
      } catch {
        /* skip corrupt entry */
      }
    }
  }
  return txns;
}

/* ---------------- Held (parked) orders ---------------- */
export async function loadHeldOrders(): Promise<HeldOrder[]> {
  const res = rawGet(HELD_KEY);
  if (!res || !res.value) return [];
  try {
    const arr = JSON.parse(res.value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveHeldOrders(list: HeldOrder[]): Promise<void> {
  rawSet(HELD_KEY, JSON.stringify(list));
}

/* ---------------- Export ---------------- */
export interface AppSnapshot {
  app: string;
  version: number;
  exportedAt: string;
  categories: Category[];
  menu: MenuState;
  transactions: Transaction[];
}

export async function buildSnapshot(): Promise<AppSnapshot> {
  const { categories, menu } = await loadConfig();
  const transactions = await listTransactions(100000);
  return {
    app: "PaPrint & Copy",
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    menu,
    transactions,
  };
}

export async function downloadSnapshot(): Promise<AppSnapshot> {
  const snapshot = await buildSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `paprint-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return snapshot;
}

/* ---------------- Import ---------------- */
export function parseSnapshot(text: string): AppSnapshot {
  let data: AppSnapshot;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (!data || typeof data !== "object" || !data.categories || !data.menu || !Array.isArray(data.transactions)) {
    throw new Error("That file doesn't look like a PaPrint & Copy backup.");
  }
  return data;
}

/* ---------------- Optional live file sync ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let liveFileHandle: any = null;
let liveFileName: string | null = null;

export function isLiveFileSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export function getLiveFileName(): string | null {
  return liveFileName;
}

export async function connectLiveFile(): Promise<string> {
  if (!isLiveFileSupported()) throw new Error("This browser doesn't support live file sync.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  const handle = await win.showSaveFilePicker({
    suggestedName: "paprint-data.json",
    types: [{ description: "JSON backup", accept: { "application/json": [".json"] } }],
  });
  liveFileHandle = handle;
  liveFileName = handle.name;
  await syncLiveFile();
  return liveFileName!;
}

export function disconnectLiveFile(): void {
  liveFileHandle = null;
  liveFileName = null;
}

export async function syncLiveFile(): Promise<void> {
  if (!liveFileHandle) return;
  try {
    const snapshot = await buildSnapshot();
    const writable = await liveFileHandle.createWritable();
    await writable.write(JSON.stringify(snapshot, null, 2));
    await writable.close();
  } catch {
    liveFileHandle = null;
    liveFileName = null;
  }
}
