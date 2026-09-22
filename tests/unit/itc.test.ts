import { describe, it, expect } from 'vitest';
import { Money } from '../../domain/money/money';
import { calculateEligibleITC } from '../../domain/cra/itc-rules';

describe('ITC engine', () => {
  it('standard office supplies → full ITC', () => {
    const r = calculateEligibleITC({
      subtotal: Money.fromDecimalString('82.00'),
      taxAmount: Money.fromDecimalString('4.10'),
      taxType: 'GST',
      expenseCategory: 'office_supplies',
      commercialUsePercentage: 1,
      mealEntertainment: false,
      documentationStatus: 'sufficient',
    });
    expect(r.eligibleITC.toString()).toBe('4.10');
    expect(r.status).toBe('eligible');
  });

  it('standard meal → 50% ITC', () => {
    const r = calculateEligibleITC({
      subtotal: Money.fromDecimalString('240.00'),
      taxAmount: Money.fromDecimalString('12.00'),
      taxType: 'GST',
      expenseCategory: 'meals_entertainment',
      commercialUsePercentage: 1,
      mealEntertainment: true,
      mealContext: 'standard',
      documentationStatus: 'sufficient',
    });
    expect(r.eligibleITC.toString()).toBe('6.00');
    expect(r.eligibilityPercentage).toBeCloseTo(0.5);
  });

  it('insufficient documentation → review, zero ITC', () => {
    const r = calculateEligibleITC({
      subtotal: Money.fromDecimalString('1200.00'),
      taxAmount: Money.fromDecimalString('60.00'),
      taxType: 'GST',
      expenseCategory: 'professional_fees',
      commercialUsePercentage: 1,
      mealEntertainment: false,
      documentationStatus: 'insufficient',
    });
    expect(r.status).toBe('review');
    expect(r.eligibleITC.toString()).toBe('0.00');
  });

  it('zero commercial use → ineligible', () => {
    const r = calculateEligibleITC({
      subtotal: Money.fromDecimalString('5000.00'),
      taxAmount: Money.fromDecimalString('0.00'),
      taxType: 'GST',
      expenseCategory: 'cash_deposit',
      commercialUsePercentage: 0,
      mealEntertainment: false,
      documentationStatus: 'sufficient',
    });
    expect(r.status).toBe('ineligible');
  });
});
