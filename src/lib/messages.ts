import type {
  Invoice,
  Payment,
  Society,
  Settings,
  InvoiceTenant,
} from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  sanitizePhone,
} from "@/lib/format";
export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
export function buildInvoiceMessage(
  template: string,
  society: Society,
  tenant: InvoiceTenant | null,
  flatNo: string,
  invoice: Invoice,
): string {
  return fillTemplate(template, {
    tenant_name: tenant?.name ?? "Resident",
    flat_no: flatNo,
    month: formatMonth(invoice.month),
    amount: formatCurrency(
      Number(invoice.amount) + Number(invoice.late_fee_applied),
    ),
    due_date: formatDate(invoice.due_date),
    society_name: society.name,
  });
}
export function buildReminderMessage(
  template: string,
  society: Society,
  tenant: InvoiceTenant | null,
  flatNo: string,
  invoice: Invoice,
): string {
  return buildInvoiceMessage(template, society, tenant, flatNo, invoice);
}
export function buildReceiptMessage(
  template: string,
  society: Society,
  tenant: InvoiceTenant | null,
  flatNo: string,
  payment: Payment,
): string {
  return fillTemplate(template, {
    tenant_name: tenant?.name ?? "Resident",
    flat_no: flatNo,
    amount: formatCurrency(Number(payment.amount)),
    paid_on: formatDate(payment.paid_on),
    reference_no: payment.reference_no ?? "-",
    society_name: society.name,
  });
}
export function getTenantPhone(tenant: InvoiceTenant | null): string {
  return sanitizePhone(tenant?.phone ?? "");
}
