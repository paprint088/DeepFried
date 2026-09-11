import { Transaction, TransactionItem } from "../types.ts";

export interface PrintableReceipt {
  receiptNo: string | null;
  dateLabel: string;
  items: TransactionItem[];
  subtotal: number;
  discountType?: "none" | "percent" | "fixed";
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentNote?: string;
  customerName?: string;
  customerAddress?: string;
  customerTIN?: string;
  tendered: number | null;
  change: number | null;
}

const SHOP_NAME = "PaPrint & Copy";
const SHOP_ADDRESS = "301 Buendia Ave., Pasay";
const SHOP_CONTACT = "Mobile/Viber No: 09497218888";

function peso(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return "\u20B1" + Math.round(v).toLocaleString("en-PH");
}

function escHtml(s: unknown) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderReceiptWindow(receipt: PrintableReceipt, onNotify?: (msg: string) => void) {
  if (!receipt.items || receipt.items.length === 0) {
    onNotify?.("Nothing to print yet.");
    return;
  }
  const win = window.open("", "PRINT", "height=680,width=400");
  if (!win) {
    onNotify?.("Allow pop-ups to print the order slip.");
    return;
  }
  const rows = receipt.items
    .map(
      (l) =>
        `<tr><td>${escHtml(l.name)}</td><td style="text-align:right">${l.qty}</td><td style="text-align:right">${peso(l.lineTotal)}</td></tr>`
    )
    .join("");
  const methodLabel =
    { cash: "Cash", ewallet: "E-wallet", other: "Other" }[receipt.paymentMethod] || "Cash";
  const blank = (v: unknown) => (v && String(v).trim() ? escHtml(v) : "&nbsp;");
  const isPaid = receipt.receiptNo != null || (receipt.tendered != null && receipt.tendered >= receipt.total);

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Order Slip</title>
        <style>
          body{font-family:'Courier New',monospace;font-size:12px;padding:12px;color:#111;position:relative}
          h2{text-align:center;margin:0 0 2px}
          .sub{text-align:center;margin:0;font-size:11px}
          .sub.gap{margin-bottom:8px}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          td{padding:2px 0;font-size:12px}
          .line{border-top:1px dashed #111;margin:8px 0}
          .totalrow td{font-weight:bold;padding-top:6px}
          .center{text-align:center}
          .soldto td{font-size:11.5px;padding:3px 0}
          .soldto td:first-child{width:56px;white-space:nowrap}
          .soldto td:last-child{border-bottom:1px solid #111}
          .disclaimer{font-size:9.5px;color:#555;text-align:center;font-style:italic;margin-top:10px;line-height:1.4}
          .stamp{
            position:absolute; top:64px; right:18px; transform:rotate(-12deg);
            border:3px solid #1a7a2e; color:#1a7a2e; font-weight:bold; font-size:20px;
            letter-spacing:3px; padding:4px 10px; border-radius:6px; opacity:0.75;
            font-family:Arial,Helvetica,sans-serif;
          }
        </style>
      </head>
      <body>
        ${isPaid ? '<div class="stamp">PAID</div>' : ""}
        <h2>${SHOP_NAME}</h2>
        <p class="sub">${SHOP_ADDRESS}</p>
        <p class="sub gap">${SHOP_CONTACT}</p>
        ${receipt.receiptNo ? `<div style="font-size:15px;font-weight:900;text-align:center;margin:6px 0 4px;letter-spacing:1px;border:1.5px solid #111;padding:4px 6px;border-radius:4px;background:#f8f8f8;">ORDER SLIP #${receipt.receiptNo}</div>` : ""}
        <p class="sub">${receipt.dateLabel}</p>
        <table class="soldto">
          <tr><td>Sold To:</td><td>${blank(receipt.customerName)}</td></tr>
          <tr><td>Address:</td><td>${blank(receipt.customerAddress)}</td></tr>
          <tr><td>TIN:</td><td>${blank(receipt.customerTIN)}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td><b>Item</b></td><td style="text-align:right"><b>Qty</b></td><td style="text-align:right"><b>Amount</b></td></tr>
          ${rows}
        </table>
        <div class="line"></div>
        <table>
          <tr><td>Subtotal</td><td></td><td style="text-align:right">${peso(receipt.subtotal)}</td></tr>
          ${receipt.discountAmount > 0 ? `<tr><td>Discount</td><td></td><td style="text-align:right">-${peso(receipt.discountAmount)}</td></tr>` : ""}
          <tr class="totalrow"><td>Total</td><td></td><td style="text-align:right">${peso(receipt.total)}</td></tr>
          <tr><td>Payment</td><td></td><td style="text-align:right">${methodLabel}</td></tr>
          ${receipt.tendered != null ? `<tr><td>Received</td><td></td><td style="text-align:right">${peso(receipt.tendered)}</td></tr>` : ""}
          ${receipt.change != null ? `<tr><td>Change</td><td></td><td style="text-align:right">${peso(receipt.change)}</td></tr>` : ""}
        </table>
        <div class="line"></div>
        <p class="center">Thank you!</p>
        <p class="disclaimer">This document is for internal tracking only and is NOT a valid BIR official receipt or sales invoice.</p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}

export function printJournalWindow(
  journalTxns: (Transaction & { split: { sales: number; service: number; sundry: number } })[],
  rangeLabel: string,
  onNotify?: (msg: string) => void
) {
  if (journalTxns.length === 0) {
    onNotify?.("Nothing to print for this date range.");
    return;
  }
  const win = window.open("", "PRINT", "height=700,width=900");
  if (!win) {
    onNotify?.("Allow pop-ups to print the journal.");
    return;
  }
  const methodLabel: Record<string, string> = { cash: "Cash", ewallet: "E-wallet", other: "Other" };
  let sumSales = 0,
    sumService = 0,
    sumSundry = 0,
    sumTotal = 0;
  const rows = journalTxns
    .map((t) => {
      sumSales += t.split.sales;
      sumService += t.split.service;
      sumSundry += t.split.sundry;
      sumTotal += t.total || 0;
      const d = new Date(t.timestamp);
      const dLabel = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      return `<tr>
        <td>${dLabel}</td>
        <td>${t.receiptNo}</td>
        <td>${escHtml(t.customerName || t.paymentNote || "Cash sales")}</td>
        <td>${methodLabel[t.paymentMethod] || "Cash"}</td>
        <td style="text-align:right">${t.split.sales ? peso(t.split.sales) : "-"}</td>
        <td style="text-align:right">${t.split.service ? peso(t.split.service) : "-"}</td>
        <td style="text-align:right">${t.split.sundry ? peso(t.split.sundry) : "-"}</td>
        <td style="text-align:right">${peso(t.total)}</td>
      </tr>`;
    })
    .join("");

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cash Receipts Journal</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:20px;color:#111}
          h2{text-align:center;margin:0 0 2px}
          .sub{text-align:center;margin:0 0 16px;font-size:12px;color:#444}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #999;padding:5px 7px;font-size:11.5px}
          th{background:#eee;text-align:left}
          .totalrow td{font-weight:bold;border-top:2px solid #111}
          .num{text-align:right}
        </style>
      </head>
      <body>
        <h2>${SHOP_NAME}</h2>
        <p class="sub">Cash Receipts Journal &middot; ${rangeLabel}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Slip No.</th><th>Particulars</th><th>Mode</th>
              <th class="num">Sales</th><th class="num">Service</th><th class="num">Sundry</th><th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="totalrow">
              <td colspan="4">TOTAL</td>
              <td class="num">${peso(sumSales)}</td>
              <td class="num">${peso(sumService)}</td>
              <td class="num">${peso(sumSundry)}</td>
              <td class="num">${peso(sumTotal)}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}
