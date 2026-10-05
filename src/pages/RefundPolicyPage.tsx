import { ArrowLeft, RefreshCw, CreditCard, Clock } from "lucide-react";
import { useRouter } from "@/lib/router";
export function RefundPolicyPage() {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-canvas text-ink-800 py-10 px-4 sm:px-6 lg:px-8">
      {" "}
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {" "}
        {/* Back navigation */}{" "}
        <button
          onClick={() =>
            window.history.length > 1 ? window.history.back() : navigate("/")
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline bg-surface-2 border border-line-strong px-3.5 py-2 rounded-md shadow-xs transition"
        >
          {" "}
          <ArrowLeft size={14} /> Back{" "}
        </button>{" "}
        {/* Header Hero */}{" "}
        <div className="bg-surface-2 text-ink-900 rounded-lg p-8 sm:p-10 border border-line-strong shadow-xs space-y-3">
          {" "}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold bg-surface-3 text-ink-900 border border-line-strong">
            {" "}
            <RefreshCw size={14} className="text-success-500" /> Transparent
            Settlement &amp; Dispute Protection{" "}
          </div>{" "}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Refund &amp; Cancellation Policy
          </h1>{" "}
          <p className="text-ink-500 text-sm sm:text-base max-w-2xl leading-relaxed">
            {" "}
            Effective Date: 4 October 2026 · Version 3.4 <br /> Rules governing
            duplicate payments, advance maintenance adjustments, and rental
            deposit escrow releases.{" "}
          </p>{" "}
        </div>{" "}
        {/* Maintenance Charges & Advance Payments */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            {" "}
            <CreditCard size={18} className="text-brand-600" /> 1. Housing
            Society Maintenance Charges{" "}
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Maintenance levies generated on Habitra represent statutory society
            bills approved by your general body:{" "}
          </p>{" "}
          <ul className="list-disc pl-5 space-y-2 text-xs text-ink-700">
            {" "}
            <li>
              <strong>Duplicate / Erroneous Transactions:</strong> If a resident
              pays an invoice twice due to a network glitch, the duplicate
              transaction will automatically be detected and reversed, or
              credited to next month&apos;s maintenance ledger at the
              resident&apos;s election.
            </li>{" "}
            <li>
              <strong>Advance Maintenance Credit:</strong> Advance payments made
              towards quarterly or annual maintenance remain credited to the
              member&apos;s ledger. If the flat is sold, any unexhausted credit
              balance is either transferred to the incoming purchaser or
              refunded to the outgoing member upon issuance of the Society
              No-Objection Certificate (NOC).
            </li>{" "}
          </ul>{" "}
        </div>{" "}
        {/* Sub-Meter Utility Discrepancies */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            2. Sub-Meter Utility &amp; Water Bill Adjustments
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            In the event of a documented mechanical meter defect or verified
            underground pipe leak on society common lines, the Managing
            Committee may authorize a billing rectification. The rectified
            variance will appear as an explicit credit memo on the subsequent
            month&apos;s SmartSplit invoice.{" "}
          </p>{" "}
        </div>{" "}
        {/* Escrow Rental Deposits */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            3. Rental Security Deposit Escrow Releases
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Where rental security deposits are processed via Habitra Escrow,
            refunds at the end of tenancy are subject to:{" "}
          </p>{" "}
          <ul className="list-disc pl-5 space-y-2 text-xs text-ink-700">
            {" "}
            <li>
              Mutual verification of the Digital Move-Out Condition Passport by
              both Landlord and Tenant.
            </li>{" "}
            <li>
              Zero outstanding society maintenance or utility arrears logged
              against the flat.
            </li>{" "}
            <li>
              Once approved by the Landlord, the escrow nodal account releases
              the agreed deposit amount directly to the Tenant&apos;s verified
              bank account via IMPS/NEFT within 24 business hours.
            </li>{" "}
          </ul>{" "}
        </div>{" "}
        {/* Refund Timelines & Mode */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-3 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            {" "}
            <Clock size={18} className="text-brand-600" /> 4. Gateway Refund
            Timelines{" "}
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Approved payment gateway refunds are initiated immediately and
            credited to the original payment source (UPI VPA, Credit Card, Net
            Banking) within <strong>5 to 7 standard banking days</strong>, in
            adherence to Reserve Bank of India (RBI) payment settlement
            guidelines.{" "}
          </p>{" "}
          <div className="bg-surface-3 border border-line-strong p-3 rounded-md text-ink-900 text-xs">
            {" "}
            <strong>Payment Support:</strong> For assistance with any disputed
            or stalled transaction, contact <code>billing@habitra.in</code> with
            the 12-digit Bank RRN / Transaction UTR number.{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
