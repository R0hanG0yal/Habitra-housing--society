import { ShieldCheck, ArrowLeft, FileCheck } from "lucide-react";
import { useRouter } from "@/lib/router";
export function PrivacyPolicyPage() {
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
            <ShieldCheck size={14} className="text-success-500" /> Digital
            Personal Data Protection (DPDP) Act 2023 Compliant{" "}
          </div>{" "}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Privacy Policy
          </h1>{" "}
          <p className="text-ink-500 text-sm sm:text-base max-w-2xl leading-relaxed">
            {" "}
            Effective Date: 4 October 2026 · Version 3.4 <br /> Habitra is
            dedicated to transparent data stewardship, strict data minimization,
            and resident sovereignty.{" "}
          </p>{" "}
        </div>{" "}
        {/* Legal Entity & Fiduciary Notice */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-3 text-ink-900">
          {" "}
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            {" "}
            <FileCheck size={18} className="text-brand-600" /> 1. Data Fiduciary
            &amp; Corporate Identity{" "}
          </h2>{" "}
          <p className="text-xs sm:text-sm text-ink-700 leading-relaxed">
            {" "}
            This application and its associated services are operated by{" "}
            <strong>Habitra Technologies Private Limited</strong>{" "}
            (&quot;Habitra&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;), incorporated under the Companies Act, 2013 (India)
            with Corporate Identity Number{" "}
            <strong>CIN: U72900KA2024PTC189021</strong>.{" "}
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-ink-900">
            {" "}
            <div className="bg-surface-3 border border-line-strong p-3 rounded-md">
              {" "}
              <span className="text-ink-500 block text-[11px]">
                Registered Office
              </span>{" "}
              <p className="font-medium mt-0.5">
                Palm Tech Park, Outer Ring Road, Bellandur, Bengaluru 560103,
                Karnataka, India
              </p>{" "}
            </div>{" "}
            <div className="bg-surface-3 border border-line-strong p-3 rounded-md">
              {" "}
              <span className="text-ink-500 block text-[11px]">
                Data Protection Office
              </span>{" "}
              <p className="font-medium mt-0.5">dpo@habitra.in</p>{" "}
              <p className="text-ink-500 text-[10px] mt-0.5">
                48-Hour SLA for DPDP Inquiries
              </p>{" "}
            </div>{" "}
            <div className="bg-surface-3 border border-line-strong p-3 rounded-md">
              {" "}
              <span className="text-ink-500 block text-[11px]">
                Grievance Redressal
              </span>{" "}
              <p className="font-medium mt-0.5">grievance@habitra.in</p>{" "}
              <p className="text-ink-500 text-[10px] mt-0.5">
                Statutory Officer: Rajiv Menon
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Data Minimization Policy */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            2. Principle of Data Minimization &amp; Purpose Limitation
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Under Section 4 and Section 6 of the DPDP Act 2023, Habitra adheres
            strictly to the rule of <em>data minimization</em>. We collect only
            what is strictly necessary to fulfill community management,
            statutory audit, and rental escrow execution:{" "}
          </p>{" "}
          <ul className="list-disc pl-5 space-y-2 text-xs text-ink-700">
            {" "}
            <li>
              <strong>Resident &amp; Owner Profile:</strong> Name, verified
              mobile number (WhatsApp-enabled for receipts), and flat
              association number.
            </li>{" "}
            <li>
              <strong>Identity &amp; KYC Masking:</strong> Aadhaar numbers are
              never stored in plain text; only the last 4 digits are retained
              (e.g. <code>•••• •••• 4892</code>). Biometric fingerprint records
              are never accepted or processed by Habitra.
            </li>{" "}
            <li>
              <strong>Financial Ledgers:</strong> Transaction reference IDs,
              invoice breakdowns, GST numbers, and escrow payout confirmations.
            </li>{" "}
            <li>
              <strong>Telemetry &amp; Sub-metering:</strong> Live water, DG
              power, and EV kWh metrics strictly associated with physical meter
              serial numbers.
            </li>{" "}
          </ul>{" "}
        </div>{" "}
        {/* 90-Day Auto Purge Policy */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-3 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            3. 90-Day Gate Log Auto-Purge &amp; Data Retention
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            To prevent continuous digital surveillance of citizens, temporary
            visitor logs, vehicle gate entries, delivery vehicle photos, and
            domestic staff QR check-ins are{" "}
            <strong>
              automatically purged from the database after 90 days
            </strong>
            .{" "}
          </p>{" "}
          <p className="bg-surface-3 border border-line-strong p-3 rounded-md text-ink-900 text-xs">
            {" "}
            <strong>Statutory Tax Exception:</strong> GST invoices, maintenance
            collection vouchers, and audited balance sheets are retained for
            seven (7) years in an encrypted cold archive as mandated by Section
            10(13A) of the Income Tax Act 1961 and the Central Goods and
            Services Tax (CGST) Act 2017.{" "}
          </p>{" "}
        </div>{" "}
        {/* Rights of Data Principals */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            4. Rights of Data Principals (Residents &amp; Owners)
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            As a resident, landlord, or committee member, you hold unconditional
            rights under Chapter III of the DPDP Act 2023:{" "}
          </p>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {" "}
            <div className="border border-line-strong p-3 rounded-md bg-surface-3">
              {" "}
              <p className="font-bold text-ink-900">
                Right to Access Summary
              </p>{" "}
              <p className="text-ink-500 mt-1">
                Download a full machine-readable JSON/PDF summary of all
                personal data held by your housing society.
              </p>{" "}
            </div>{" "}
            <div className="border border-line-strong p-3 rounded-md bg-surface-3">
              {" "}
              <p className="font-bold text-ink-900">
                Right to Correction &amp; Erasure
              </p>{" "}
              <p className="text-ink-500 mt-1">
                Trigger Right- upon moving out or ending tenancy to scrub
                personal identifiers.
              </p>{" "}
            </div>{" "}
            <div className="border border-line-strong p-3 rounded-md bg-surface-3">
              {" "}
              <p className="font-bold text-ink-900">Right to Nominate</p>{" "}
              <p className="text-ink-500 mt-1">
                Nominate a legal heir or co-owner to exercise your data
                principal rights in the event of death or incapacity.
              </p>{" "}
            </div>{" "}
            <div className="border border-line-strong p-3 rounded-md bg-surface-3">
              {" "}
              <p className="font-bold text-ink-900">
                Right of Grievance Redressal
              </p>{" "}
              <p className="text-ink-500 mt-1">
                Escalate complaints to the Data Protection Officer or directly
                to the Data Protection Board of India.
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Third Party Embeds & Tracking */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-3 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            5. Third-Party Integrations &amp; Sub-Processors
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Habitra does not sell, lease, or monetize resident personal data. We
            utilize only certified enterprise infrastructure partners:{" "}
          </p>{" "}
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-ink-700">
            {" "}
            <li>
              <strong>Database &amp; Auth:</strong> Supabase Inc. (ISO 27001
              &amp; SOC2 Type II Certified, AES-256 encrypted at rest).
            </li>{" "}
            <li>
              <strong>Payment Gateway:</strong> RBI-authorized Payment
              Aggregator (PCI-DSS Level 1 Compliant) for Tri-Party Escrow split
              payouts.
            </li>{" "}
            <li>
              <strong>Society Assistant:</strong> Private enterprise LLM
              instance operating with zero retention for resident queries.
              Society policies and bye-laws are never used for public model
              training.
            </li>{" "}
          </ul>{" "}
        </div>{" "}
        {/* Contact Footer */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-ink-900">
          {" "}
          <div>
            {" "}
            <p className="font-bold text-ink-900">
              Need to file a privacy or data access request?
            </p>{" "}
            <p className="text-ink-500">
              Our Data Protection Officer responds within 48 business hours.
            </p>{" "}
          </div>{" "}
          <a
            href="mailto:dpo@habitra.in?subject=DPDP%20Data%20Principal%20Inquiry"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold shadow-xs transition"
          >
            {" "}
            Contact DPO (dpo@habitra.in){" "}
          </a>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
