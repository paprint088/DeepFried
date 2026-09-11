export type AccountId = "sales" | "service" | "sundry";

export interface AccountInfo {
  id: AccountId;
  label: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  account: AccountId;
  trackStock?: boolean;
  stock?: number;
  lowStockThreshold?: number;
}

export type MenuState = Record<string, MenuItem[]>;

export interface OrderItem extends MenuItem {
  catId: string;
}

export interface OrderLine extends MenuItem {
  qty: number;
  lineTotal: number;
}

export type PaymentMethodId = "cash" | "ewallet" | "other";

export interface TransactionItem {
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
  account: AccountId;
}

export interface Transaction {
  id: string;
  receiptNo: string;
  timestamp: number;
  dateLabel: string;
  items: TransactionItem[];
  subtotal: number;
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethodId;
  paymentNote?: string;
  customerName?: string;
  customerAddress?: string;
  customerTIN?: string;
  tendered: number;
  change: number;
  split?: {
    sales: number;
    service: number;
    sundry: number;
  };
}

export interface HeldOrder {
  id: string;
  label: string;
  createdAt: number;
  qty: Record<string, number>;
  discountType: "none" | "percent" | "fixed";
  discountValue: string;
  paymentMethod: PaymentMethodId;
  paymentNote: string;
  customerName: string;
  customerAddress: string;
  customerTIN: string;
  tendered: string;
}
