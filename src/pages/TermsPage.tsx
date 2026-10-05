import { ArrowLeft, Scale, FileText } from "lucide-react";
import { useRouter } from "@/lib/router";
export function TermsPage() {
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
            <Scale size={14} className="text-brand-600" /> Model Tenancy Act
            &amp; State Cooperative Societies Framework{" "}
          </div>{" "}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Terms and Conditions of Service
          </h1>{" "}
          <p className="text-ink-500 text-sm sm:text-base max-w-2xl leading-relaxed">
            {" "}
            Effective Date: 4 October 2026 · Version 3.4 <br /> Governs platform
            usage by Housing Societies, Resident Welfare Associations (RWAs),
            Landlords, Tenants, and Service Personnel.{" "}
          </p>{" "}
        </div>{" "}
        {/* Acceptance of Terms */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            {" "}
            <FileText size={18} className="text-brand-600" /> 1. Contractual
            Relationship &amp; Scope{" "}
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            By accessing or using the Habitra platform, mobile views, or
            resident portals, you agree to be bound by these Terms and
            Conditions. These terms constitute a legally binding agreement
            between you and{" "}
            <strong>Habitra Technologies Private Limited</strong> (CIN:
            U72900KA2024PTC189021).{" "}
          </p>{" "}
          <p className="text-ink-700">
            {" "}
            Where an account is provisioned by a Housing Society Managing
            Committee or RWA, the user confirms that the society has formally
            adopted Habitra through a Managing Committee resolution or General
            Body Meeting (AGM) ratification in compliance with the relevant
            State Cooperative Societies Act.{" "}
          </p>{" "}
        </div>{" "}
        {/* SmartSplit Escrow Terms */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            2. Tri-Party SmartSplit Escrow Architecture
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Habitra provides automated software routing for rental and
            maintenance payments. Users acknowledge the following operational
            structure:{" "}
          </p>{" "}
          <ul className="list-disc pl-5 space-y-2 text-xs text-ink-700">
            {" "}
            <li>
              <strong>Software Intermediary Role:</strong> Habitra acts solely
              as a technology layer and software platform. Habitra does not take
              legal custody of unallocated funds.
            </li>{" "}
            <li>
              <strong>Escrow Settlement:</strong> All automated SmartSplit
              disbursements (splitting tenant payments between the
              Landlord&apos;s personal bank account and the Housing
              Society&apos;s maintenance account) are executed directly via an
              RBI-authorized Payment Aggregator / Nodal Escrow Account.
            </li>{" "}
            <li>
              <strong>Dual Receipt Legality:</strong> The separate Landlord Rent
              Receipt (with PAN for Section 10(13A) HRA exemption) and Society
              GST Maintenance Receipt issued by Habitra reflect real-time
              settlement vouchers.
            </li>{" "}
          </ul>{" "}
        </div>{" "}
        {/* Society Bye-laws & Digital AGM */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            3. Society Bye-Laws &amp; Digital AGM Quorum
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            The Habitra Digital AGM and E-Voting module enforces statutory
            requirements (including standard 21-day notice tracking and
            physical/digital quorum counters).{" "}
          </p>{" "}
          <p className="text-ink-700">
            {" "}
            Managing Committees remain solely responsible for ensuring that
            their registered society bye-laws permit electronic notices and
            hybrid voting. The cryptographic audit log generated by Habitra
            serves as proof of voting attendance and resolution tallying.{" "}
          </p>{" "}
        </div>{" "}
        {/* Condition Passports & Disputes */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            4. Move-in Condition Passports &amp; Rental Deposits
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Digital Move-in / Move-out Condition Passports recorded in Habitra
            (with timestamped photos, electrical fixture audits, and paint
            condition checklists) serve as collaborative evidentiary records
            between Landlords and Tenants as contemplated under the{" "}
            <strong>Model Tenancy Act, 2021</strong>.{" "}
          </p>{" "}
          <p className="text-ink-700">
            {" "}
            Habitra does not adjudicate civil damages. Security deposit
            deductions must follow the formal mutual sign-off process provided
            within the platform.{" "}
          </p>{" "}
        </div>{" "}
        {/* SLA & Liability */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-3 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            5. Service Level Commitments &amp; Limitation of Liability
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Habitra maintains a target uptime of 99.8% for cloud gate passes and
            invoice generation. Scheduled maintenance windows are announced at
            least 48 hours in advance.{" "}
          </p>{" "}
          <p className="text-ink-700">
            {" "}
            To the maximum extent permitted by applicable Indian law, Habitra
            shall not be liable for utility disruptions, physical security
            failures at the gate, or delays caused by third-party payment rail
            down-times (e.g. NPCI UPI / IMPS gateway failures).{" "}
          </p>{" "}
        </div>{" "}
        {/* Governing Law */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-3 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            6. Governing Law &amp; Jurisdiction
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            These Terms shall be governed by and construed in accordance with
            the laws of India. Any disputes arising out of or in connection with
            these Terms shall be subject to the exclusive jurisdiction of the
            competent courts in <strong>Bengaluru, Karnataka, India</strong>
            .{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
