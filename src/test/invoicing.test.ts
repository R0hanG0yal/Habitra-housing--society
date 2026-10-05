import { describe, it, expect } from 'vitest';
import type { SettlementMode } from '@/lib/types';

describe('SmartSplit™ Billing & Settlement Engine', () => {
  function computeSettlementSplit(
    mode: SettlementMode,
    rentAmt: number,
    baseMaint: number,
    sinkingFund: number,
    utilityCharge = 0
  ) {
    const maintTotal = baseMaint + sinkingFund;
    const societyPayout = maintTotal + utilityCharge;
    let totalBilled = rentAmt;
    let ownerPayout = rentAmt;

    if (mode === 'smart_split') {
      totalBilled = rentAmt + maintTotal + utilityCharge;
      ownerPayout = rentAmt;
    } else if (mode === 'owner_inclusive') {
      totalBilled = rentAmt;
      ownerPayout = Math.max(0, rentAmt - societyPayout);
    } else if (mode === 'direct_society') {
      totalBilled = societyPayout;
      ownerPayout = 0;
    }

    return {
      totalBilled,
      ownerPayout,
      societyPayout,
    };
  }

  it('correctly calculates SmartSplit mode with distinct owner and society escrows', () => {
    // Tenant pays ₹30,000 rent + ₹4,000 maintenance + ₹500 sinking fund + ₹350 water submeter
    const split = computeSettlementSplit('smart_split', 30000, 4000, 500, 350);

    expect(split.totalBilled).toBe(34850);
    expect(split.ownerPayout).toBe(30000);
    expect(split.societyPayout).toBe(4850);
    expect(split.ownerPayout + split.societyPayout).toBe(split.totalBilled);
  });

  it('correctly calculates Owner Inclusive mode deducting maintenance from owner payout', () => {
    // Tenant pays fixed ₹35,000 rent inclusive of maintenance
    const split = computeSettlementSplit('owner_inclusive', 35000, 4500, 500, 0);

    expect(split.totalBilled).toBe(35000);
    expect(split.societyPayout).toBe(5000);
    expect(split.ownerPayout).toBe(30000); // 35,000 - 5,000
    expect(split.ownerPayout + split.societyPayout).toBe(split.totalBilled);
  });

  it('correctly calculates Direct Society mode where only society maintenance is billed', () => {
    // Unit owner handles rent off-platform; software bills only maintenance
    const split = computeSettlementSplit('direct_society', 0, 3500, 500, 200);

    expect(split.totalBilled).toBe(4200);
    expect(split.societyPayout).toBe(4200);
    expect(split.ownerPayout).toBe(0);
  });

  describe('Late Fee Calculation', () => {
    function calculateLateFee(
      rentAmount: number,
      feeType: 'fixed' | 'percent',
      feeValue: number,
      daysLate: number,
      graceDays: number
    ): number {
      if (daysLate <= graceDays) return 0;
      if (feeType === 'percent') {
        return Math.round((rentAmount * feeValue) / 100);
      }
      return feeValue;
    }

    it('waives late fee within grace period', () => {
      const fee = calculateLateFee(30000, 'fixed', 500, 3, 5);
      expect(fee).toBe(0);
    });

    it('applies fixed late fee after grace period expires', () => {
      const fee = calculateLateFee(30000, 'fixed', 500, 6, 5);
      expect(fee).toBe(500);
    });

    it('applies percentage-based late fee on total dues', () => {
      // 2% on ₹25,000 = ₹500
      const fee = calculateLateFee(25000, 'percent', 2, 7, 3);
      expect(fee).toBe(500);
    });
  });
});
