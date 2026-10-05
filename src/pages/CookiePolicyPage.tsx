import { ArrowLeft, ShieldCheck, Cookie } from "lucide-react";
import { useRouter } from "@/lib/router";
import { resetConsent } from "@/lib/analytics";
export function CookiePolicyPage() {
  const { navigate } = useRouter();
  function reopenConsentModal() {
    resetConsent();
    window.location.reload();
  }
  return (
    <div className="min-h-screen bg-canvas text-ink-800 py-8 px-4 sm:px-6 lg:px-8">
      {" "}
      <div className="max-w-4xl mx-auto space-y-6">
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
            <Cookie size={14} className="text-brand-600" /> Minimalist &amp;
            Cookieless-First Architecture{" "}
          </div>{" "}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Cookie Policy
          </h1>{" "}
          <p className="text-ink-500 text-sm sm:text-base max-w-2xl leading-relaxed">
            {" "}
            Effective Date: 4 October 2026 · Version 3.4 <br /> Explains how
            Habitra uses browser storage strictly for secure authentication and
            functional user preferences.{" "}
          </p>{" "}
        </div>{" "}
        {/* What are Cookies */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            1. Zero-Ad-Tracker Commitment
          </h2>{" "}
          <p className="text-ink-700">
            {" "}
            Unlike consumer media apps, Habitra is a mission-critical
            residential community operating system.{" "}
            <strong>
              We do not deploy third-party advertising cookies, cross-site
              trackers, or behavioral profiling scripts.
            </strong>{" "}
          </p>{" "}
          <p className="text-ink-700">
            {" "}
            We utilize HTML5 LocalStorage and essential session tokens
            exclusively to authenticate committee administrators, prevent
            unauthorized flat record tampering, and store chosen UI density
            preferences.{" "}
          </p>{" "}
        </div>{" "}
        {/* Specific Storage Tokens Table */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs space-y-4 text-ink-900">
          {" "}
          <h2 className="text-lg font-bold text-ink-900">
            2. Technical Storage Tokens &amp; Purposes
          </h2>{" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full text-left text-xs text-ink-900">
              {" "}
              <thead className="bg-surface-3 text-ink-900 uppercase tracking-wider font-semibold border-b border-line-strong">
                {" "}
                <tr>
                  {" "}
                  <th className="py-3 px-4">Identifier / Key</th>{" "}
                  <th className="py-3 px-4">Category</th>{" "}
                  <th className="py-3 px-4">Purpose</th>{" "}
                  <th className="py-3 px-4">Duration</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-line-strong">
                {" "}
                <tr>
                  {" "}
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">
                    sb-*-auth-token
                  </td>{" "}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white">
                      Strictly Necessary
                    </span>
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">
                    Cryptographic JWT session token for database RPC
                    authentication
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">
                    Session / 7 Days
                  </td>{" "}
                </tr>{" "}
                <tr>
                  {" "}
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">
                    habitra_cookie_consent_v1
                  </td>{" "}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white">
                      Strictly Necessary
                    </span>
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">
                    Records your DPDP consent choices and prevents intrusive
                    popups
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">365 Days</td>{" "}
                </tr>{" "}
                <tr>
                  {" "}
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">
                    habitra_active_society
                  </td>{" "}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-3 text-ink-900">
                      Functional
                    </span>
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">
                    Remembers which housing society tower is actively selected
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">Persistent</td>{" "}
                </tr>{" "}
                <tr>
                  {" "}
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">
                    habitra_demo_mode
                  </td>{" "}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-3 text-ink-900">
                      Functional
                    </span>
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">
                    Controls offline interactive demonstration mode
                  </td>{" "}
                  <td className="py-3 px-4 text-ink-500">Session</td>{" "}
                </tr>{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>{" "}
        {/* Manage Preferences CTA */}{" "}
        <div className="bg-surface-2 border border-line-strong rounded-lg p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-ink-900">
          {" "}
          <div>
            {" "}
            <p className="font-bold text-ink-900">
              Want to reset or re-configure your privacy choices?
            </p>{" "}
            <p className="text-ink-500">
              You can re-launch the DPDP Consent Manager at any time.
            </p>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={reopenConsentModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold shadow-xs transition"
          >
            {" "}
            Re-open Consent Preferences{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
