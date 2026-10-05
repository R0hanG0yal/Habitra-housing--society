import type {
  FlatWithRelations,
  InvoiceWithRelations,
  PaymentWithRelations,
} from "@/lib/types";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export function exportPaymentsCsv(
  payments: PaymentWithRelations[],
  flatMap: Map<string, FlatWithRelations>,
) {
  const rows: string[][] = [
    ["Date", "Flat", "Invoice month", "Amount", "Mode", "Reference"],
  ];
  for (const p of payments) {
    const flat = p.invoices?.flat_id ? flatMap.get(p.invoices.flat_id) : null;
    rows.push([
      formatDate(p.paid_on),
      flat?.flat_no ?? "-",
      formatMonth(p.invoices?.month),
      String(p.amount),
      p.mode,
      p.reference_no ?? "",
    ]);
  }
  downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}
export function exportInvoicesCsv(invoices: InvoiceWithRelations[]) {
  const rows: string[][] = [
    [
      "Flat",
      "Tenant",
      "Month",
      "Amount",
      "Late fee",
      "Due date",
      "Paid",
      "Status",
    ],
  ];
  for (const inv of invoices) {
    const paid = inv.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
    rows.push([
      inv.flats?.flat_no ?? "-",
      inv.tenants?.name ?? "-",
      formatMonth(inv.month),
      String(inv.amount),
      String(inv.late_fee_applied),
      formatDate(inv.due_date),
      formatCurrency(paid),
      inv.status,
    ]);
  }
  downloadCsv(`invoices-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}
export function exportDefaultersCsv(invoices: InvoiceWithRelations[]) {
  const rows: string[][] = [
    [
      "Flat",
      "Tenant",
      "Phone",
      "Month",
      "Due date",
      "Outstanding",
      "Days overdue",
      "Status",
    ],
  ];
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    const total = Number(inv.amount) + Number(inv.late_fee_applied);
    const paid = inv.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
    const balance = total - paid;
    const due = new Date(inv.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const days = Math.max(
      0,
      Math.floor((today.getTime() - due.getTime()) / 86400000),
    );
    rows.push([
      inv.flats?.flat_no ?? "-",
      inv.tenants?.name ?? "-",
      inv.tenants?.phone ?? "",
      formatMonth(inv.month),
      formatDate(inv.due_date),
      String(balance),
      String(days),
      inv.status,
    ]);
  }
  downloadCsv(`defaulters-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}
