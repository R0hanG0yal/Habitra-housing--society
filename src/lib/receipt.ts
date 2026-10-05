import type { Payment, Society } from "@/lib/types";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";

export async function generateReceiptPdf(
  society: Society,
  payment: Payment,
  invoice: {
    flat_no: string;
    month: string;
    tenant_name: string;
    rent_amount?: number;
    maintenance_amount?: number;
  } | null,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const W = doc.internal.pageSize.getWidth();

  // Header band (Deep Burgundy #722F37)
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Payment Receipt", 32, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(society.name, 32, 56);

  // Type 2 Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(232, 220, 198); // Cosmic Latte
  doc.text("HABITR^", W - 32, 38, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(183, 168, 154); // Mocha Cream
  doc.text("RESIDENTIAL OS", W - 32, 50, { align: "right" });

  doc.setTextColor(15, 23, 42);
  let y = 100;
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 32, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(value, W - 32, y, { align: "right" });
    y += 22;
  };

  row("Receipt no.", payment.id.slice(0, 8).toUpperCase());
  row("Date", formatDate(payment.paid_on));
  row("Flat", invoice?.flat_no ?? "-");
  row("Tenant / Resident", invoice?.tenant_name ?? "-");
  row("Invoice month", formatMonth(invoice?.month));
  row("Payment mode", payment.mode.toUpperCase());
  row("Reference no.", payment.reference_no ?? "-");
  row("Allocation", payment.applies_to.toUpperCase());

  if (invoice?.rent_amount && invoice?.maintenance_amount) {
    row("Rent component", formatCurrency(invoice.rent_amount));
    row("Society maintenance", formatCurrency(invoice.maintenance_amount));
  }

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(32, y, W - 32, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("Total Amount Received", 32, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105);
  doc.text(formatCurrency(Number(payment.amount)), W - 32, y, { align: "right" });

  y += 36;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Generated via Habitra Residential Operating System. Computer-generated, no physical signature required.",
    32,
    y,
  );
  if (society.address) {
    y += 12;
    doc.text(society.address, 32, y);
  }

  doc.save(`habitra-receipt-${invoice?.flat_no ?? "unit"}-${payment.paid_on}.pdf`);
}

export async function generateHraRentPdf(
  society: Society,
  tenant: { name: string; phone?: string | null },
  flatNo: string,
  owner: { name: string; pan_no?: string | null; address?: string | null },
  month: string,
  amount: number,
  paidOn: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Header band (Deep Burgundy #722F37)
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, W, 85, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HOUSE RENT RECEIPT (HRA)", 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(232, 220, 198); // Cosmic Latte
  doc.text("Issued under Section 10(13A) of the Income Tax Act, 1961", 40, 62);

  // Type 2 Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(232, 220, 198);
  doc.text("HABITR^", W - 40, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(183, 168, 154);
  doc.text("SMARTSPLIT ESCROW", W - 40, 54, { align: "right" });

  doc.setTextColor(46, 26, 17); // Brown #2E1A11
  let y = 125;

  const section = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(46, 26, 17);
    doc.text(title, 40, y);
    y += 8;
    doc.setDrawColor(183, 168, 154);
    doc.line(40, y, W - 40, y);
    y += 20;
  };

  const field = (label: string, val: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 40, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(val, 220, y);
    y += 22;
  };

  section("1. Rental Period & Property Details");
  field("Receipt Month", formatMonth(month));
  field("Rental Property Address", `Flat ${flatNo}, ${society.name}, ${society.address ?? ""}`);
  field("Tenant Full Name", tenant.name);
  if (tenant.phone) field("Tenant Contact", tenant.phone);

  y += 10;
  section("2. Payment & Landlord Tax Declaration");
  field("Rent Amount Paid", formatCurrency(amount));
  field("Payment Date", formatDate(paidOn));
  field("Landlord (Owner) Name", owner.name);
  field("Landlord PAN Number", owner.pan_no ? owner.pan_no.toUpperCase() : "Not Provided / On File");
  if (owner.address) field("Landlord Address", owner.address);

  y += 20;
  // Legal text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const declaration = `Received with thanks from Mr./Ms. ${tenant.name} a sum of ${formatCurrency(amount)} towards the rent of Flat ${flatNo} at ${society.name} for the period of ${formatMonth(month)}. This receipt is valid for claiming House Rent Allowance (HRA) exemption as per statutory Income Tax guidelines.`;
  doc.text(doc.splitTextToSize(declaration, W - 80), 40, y);

  y += 65;
  // Revenue Stamp Box
  doc.setDrawColor(148, 163, 184);
  doc.rect(W - 140, y, 90, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("[ Revenue Stamp ]\nAffix ₹1 Stamp\nif cash > ₹5,000", W - 135, y + 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Digitally Certified: ${owner.name}`, 40, y + 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Verified Landlord Signature On File · Powered by Habitra", 40, y + 65);

  doc.save(`HRA-Rent-Receipt-${flatNo}-${month}.pdf`);
}

export async function generateSocietyMaintenancePdf(
  society: Society,
  flatNo: string,
  month: string,
  breakdown: {
    base_maintenance: number;
    sinking_fund: number;
    utility_charges?: number;
    late_fee?: number;
    total: number;
  },
  paidOn: string,
  referenceNo?: string | null,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a5" });
  const W = doc.internal.pageSize.getWidth();

  // Header band (Deep Burgundy #722F37)
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SOCIETY MAINTENANCE RECEIPT", 32, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${society.name} (RWA Reg: ${society.rwa_registration_no ?? "Official"})`, 32, 56);

  // Type 2 Wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(232, 220, 198);
  doc.text("HABITR^", W - 32, 38, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(183, 168, 154);
  doc.text("RWA VERIFIED", W - 32, 50, { align: "right" });

  doc.setTextColor(15, 23, 42);
  let y = 100;
  const row = (label: string, val: string, isTotal = false) => {
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 11 : 9.5);
    doc.setTextColor(isTotal ? 15 : 100, isTotal ? 23 : 116, isTotal ? 42 : 139);
    doc.text(label, 32, y);
    doc.setTextColor(15, 23, 42);
    doc.text(val, W - 32, y, { align: "right" });
    y += 20;
  };

  row("Unit Number", `Flat ${flatNo}`);
  row("Billing Period", formatMonth(month));
  row("Payment Date", formatDate(paidOn));
  if (referenceNo) row("Reference No.", referenceNo);

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(32, y, W - 32, y);
  y += 18;

  row("General Operations & Upkeep", formatCurrency(breakdown.base_maintenance));
  row("Statutory Sinking / Reserve Fund", formatCurrency(breakdown.sinking_fund));
  if (breakdown.utility_charges && breakdown.utility_charges > 0) {
    row("Sub-Meter Utilities (Water/DG/EV)", formatCurrency(breakdown.utility_charges));
  }
  if (breakdown.late_fee && breakdown.late_fee > 0) {
    row("Statutory Late Interest", formatCurrency(breakdown.late_fee));
  }

  y += 6;
  doc.line(32, y, W - 32, y);
  y += 18;
  row("Total Maintenance Cleared", formatCurrency(breakdown.total), true);

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("All funds allocated as per State Cooperative Housing Bye-Laws.", 32, y);
  y += 12;
  doc.text("Habitra Resident Management System · Official Society Copy", 32, y);

  doc.save(`Society-Maintenance-${flatNo}-${month}.pdf`);
}
