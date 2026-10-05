import { useState, useEffect } from "react";
import { ShieldCheck, Cookie, Settings2, X, Lock } from "lucide-react";
import {
  getStoredConsent,
  saveConsent,
  type ConsentPreferences,
} from "@/lib/analytics";
import { useRouter } from "@/lib/router";

export function CookieConsentBanner() {
  const { navigate } = useRouter();
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    strictlyNecessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      // Delay slightly for smooth page load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    } else {
      setPreferences(existing);
    }

    const handler = () => {
      const updated = getStoredConsent();
      if (updated) setPreferences(updated);
    };
    window.addEventListener("habitra_consent_updated", handler);
    return () => window.removeEventListener("habitra_consent_updated", handler);
  }, []);

  function handleAcceptAll() {
    const all: ConsentPreferences = {
      strictlyNecessary: true,
      functional: true,
      analytics: true,
      marketing: false,
    };
    saveConsent(all);
    setPreferences(all);
    setVisible(false);
    setCustomizeOpen(false);
  }

  function handleRejectNonEssential() {
    const minimal: ConsentPreferences = {
      strictlyNecessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(minimal);
    setPreferences(minimal);
    setVisible(false);
    setCustomizeOpen(false);
  }

  function handleSaveCustom() {
    saveConsent(preferences);
    setVisible(false);
    setCustomizeOpen(false);
  }

  if (!visible && !customizeOpen) return null;

  return (
    <>
      {/* Bottom Floating Consent Strip */}
      {visible && !customizeOpen && (
        <div
          role="region"
          aria-label="Cookie and Privacy Consent"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 bg-white border border-line shadow-pop rounded-2xl p-5 animate-slide-up text-ink-800"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-surface-2 flex items-center justify-center text-ink-500 shrink-0 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink-900">
                  Privacy &amp; Cookie Consent
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink-950 text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> DPDP 2023
                </span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                Habitra strictly minimizes data collection. We use essential
                tokens for secure authentication and optional telemetry to
                improve reliability. No third-party ad trackers.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-1.5 bg-ink-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98]"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="px-3.5 py-1.5 bg-white hover:bg-surface-2 text-ink-800 border border-line-strong rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98]"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeOpen(true)}
                  className="px-3 py-1.5 text-xs text-ink-600 hover:text-ink-900 hover:underline font-medium flex items-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Customize
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/cookies")}
                  className="text-xs text-brand-600 hover:underline ml-auto font-semibold"
                >
                  Cookie Policy &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Consent Preferences Modal */}
      {customizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/45 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white border border-line rounded-2xl w-full max-w-lg p-6 shadow-pop space-y-5 text-ink-800 animate-scale-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-surface-2 text-ink-500 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-900">
                    Cookie &amp; Telemetry Preferences
                  </h3>
                  <p className="text-[11px] text-ink-500">
                    Digital Personal Data Protection (DPDP) Act 2023 Compliant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className="text-ink-400 hover:text-ink-700 hover:bg-surface-2 p-1.5 rounded-lg transition"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-ink-500">
              Configure your preferences below. Strictly necessary tokens cannot
              be disabled as they are required for secure session token
              management and encrypted RPC calls.
            </p>

            <div className="divide-y divide-line text-xs">
              {/* Strictly Necessary */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-ink-900">
                    <span>Strictly Necessary Tokens</span>
                    <span className="text-[10px] text-white font-bold bg-ink-950 px-1.5 py-0.5 rounded-full">
                      Always Active
                    </span>
                  </div>
                  <p className="text-ink-500 text-[11px] mt-0.5">
                    Supabase authentication session, CSRF security, and escrow
                    verification states.
                  </p>
                </div>
                <div className="w-9 h-5 bg-ink-950 rounded-full flex items-center justify-end px-1 opacity-80 cursor-not-allowed shrink-0">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </div>

              {/* Functional Preferences */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink-900">
                    Functional Preferences
                  </p>
                  <p className="text-ink-500 text-[11px] mt-0.5">
                    Remember last active housing society, table column sizing,
                    and filter selections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences((p) => ({ ...p, functional: !p.functional }))
                  }
                  aria-pressed={preferences.functional}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                    preferences.functional
                      ? "bg-ink-950 justify-end"
                      : "bg-line-strong justify-start"
                  }`}
                >
                  <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                </button>
              </div>

              {/* Privacy Telemetry */}
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink-900">
                    Anonymous Performance Telemetry
                  </p>
                  <p className="text-ink-500 text-[11px] mt-0.5">
                    Helps engineers diagnose JavaScript errors and load
                    bottlenecks. Never contains PII.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences((p) => ({ ...p, analytics: !p.analytics }))
                  }
                  aria-pressed={preferences.analytics}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                    preferences.analytics
                      ? "bg-ink-950 justify-end"
                      : "bg-line-strong justify-start"
                  }`}
                >
                  <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3 py-1.5 text-xs text-ink-600 hover:text-ink-900 hover:underline font-medium"
              >
                Reject Non-Essential
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-2 bg-ink-950 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98]"
                >
                  Save My Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
