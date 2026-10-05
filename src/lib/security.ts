/**
 * Habitra Security & Spam Protection Suite
 * Enforces data minimization, honeypot spam protection, and input sanitization.
 */
export interface FormSubmissionMeta {
  honeypot: string; /* Must remain empty (bots fill it) */
  renderedAt: number; /* Minimum time threshold check */
  consentGiven: boolean; /* Explicit DPDP / Terms consent */
}

/**
 * Creates initial anti-bot form metadata
 */
export function createFormMeta(): FormSubmissionMeta {
  return { honeypot: "", renderedAt: Date.now(), consentGiven: false };
}

/**
 * Validates form submission against bot automation and minimum threshold
 */
export function validateFormSubmission(meta: FormSubmissionMeta): {
  valid: boolean;
  error?: string;
} {
  // 1. Honeypot check (hidden field that only automation fills)
  if (meta.honeypot && meta.honeypot.trim().length > 0) {
    return { valid: false, error: 'Automated submission detected. Request rejected.' };
  }
  // 2. Timing check (human takes at least 1.5 seconds to fill a form)
  const elapsed = Date.now() - meta.renderedAt;
  if (elapsed < 1200) {
    return { valid: false, error: 'Submission was too fast. Please take a moment to review and submit.' };
  }
  // 3. DPDP Consent validation
  if (!meta.consentGiven) {
    return { valid: false, error: 'You must agree to the Terms of Service & Privacy Policy to continue.' };
  }
  return { valid: true };
}

/**
 * Sanitize text input to prevent XSS injection
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Strict email format validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Strict Indian phone number validation (+91 / 10 digits)
 */
export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return (
    digits.length === 10 || (digits.length === 12 && digits.startsWith("91"))
  );
}
