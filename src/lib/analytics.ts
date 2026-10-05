/**
 * Habitra Privacy-First Analytics Engine
 * Cookieless, GDPR & DPDP Act 2023 compliant telemetry.
 * Only collects necessary operational metrics; never stores PII, passwords, or raw IP addresses.
 */
export interface ConsentPreferences {
  strictlyNecessary: boolean; // Always true for auth & sessions
  functional: boolean; // Active society memory, UI density
  analytics: boolean; // Privacy-friendly error logs & page telemetry
  marketing: boolean; // Always false by default
}

const CONSENT_STORAGE_KEY = "habitra_cookie_consent_v1";

export function getStoredConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentPreferences;
  } catch {
    return null;
  }
}

export function saveConsent(preferences: ConsentPreferences): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    // Dispatch custom event so listeners update immediately
    window.dispatchEvent(
      new CustomEvent("habitra_consent_updated", { detail: preferences }),
    );
  } catch {
    // Storage quota or sandboxed
  }
}

export function resetConsent(): void {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("habitra_consent_updated", { detail: null }),
    );
  } catch {
    // Sandboxed
  }
}

/**
 * Log a privacy-preserving page view or user action
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
): void {
  // Check browser Do-Not-Track
  if (
    navigator.doNotTrack === "1" ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1"
  ) {
    return;
  }
  // Check user consent
  const consent = getStoredConsent();
  if (consent && !consent.analytics) {
    return;
  }
  // Purely operational local telemetry event
  if (import.meta.env.DEV) {
    console.debug(
      `[Habitra Privacy Telemetry] [${category}] ${action}${label ? ` - ${label}` : ""}`,
    );
  }
}
