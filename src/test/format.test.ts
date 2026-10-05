import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatMonth,
  formatDateTime,
  monthKey,
  currentMonthKey,
  daysOverdue,
  sanitizePhone,
  whatsappLink,
} from '@/lib/format';

describe('format utilities', () => {
  it('formats currency correctly in INR format', () => {
    const formatted = formatCurrency(5000);
    // Should include 5,000 and ₹
    expect(formatted).toContain('5,000');
    expect(formatCurrency(0)).toContain('0');
    expect(formatCurrency(null)).toContain('0');
  });

  it('formats precise currency with 2 decimal places', () => {
    const precise = formatCurrencyPrecise(1250.5);
    expect(precise).toContain('1,250.50');
  });

  it('formats dates cleanly', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('invalid-date')).toBe('-');
    const formatted = formatDate('2026-10-15');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
  });

  it('formats months cleanly', () => {
    expect(formatMonth(null)).toBe('-');
    const month = formatMonth('2026-10-01');
    expect(month).toContain('Oct');
    expect(month).toContain('2026');
  });

  it('calculates days overdue accurately', () => {
    const today = new Date();
    const past = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
    const y = past.getFullYear();
    const m = String(past.getMonth() + 1).padStart(2, '0');
    const d = String(past.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const overdue = daysOverdue(dateStr);
    expect(overdue).toBe(5);

    const future = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);
    const fy = future.getFullYear();
    const fm = String(future.getMonth() + 1).padStart(2, '0');
    const fd = String(future.getDate()).padStart(2, '0');
    const futureStr = `${fy}-${fm}-${fd}`;
    expect(daysOverdue(futureStr)).toBe(0);
  });

  it('sanitizes Indian mobile numbers', () => {
    expect(sanitizePhone('9876543210')).toBe('919876543210');
    expect(sanitizePhone('+91 98765-43210')).toBe('919876543210');
    expect(sanitizePhone('09876543210')).toBe('919876543210');
    expect(sanitizePhone('')).toBe('');
  });

  it('creates valid WhatsApp redirect links', () => {
    const link = whatsappLink('9876543210', 'Your maintenance bill of ₹3,500 is due');
    expect(link).toContain('https://wa.me/919876543210');
    expect(link).toContain('Your%20maintenance%20bill');
  });

  it('generates valid month keys', () => {
    const d = new Date(2026, 9, 1); // October 2026 (0-indexed month 9)
    expect(monthKey(d)).toBe('2026-10-01');
    expect(currentMonthKey()).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
