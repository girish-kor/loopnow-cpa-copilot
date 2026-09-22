import { describe, it, expect } from 'vitest';
import { Money } from '../../domain/money/money';
import { classifyTier, evaluateDocumentation } from '../../domain/cra/documentation-rules';

describe('CRA documentation tiers', () => {
  it.each([
    ['29.99', 1],
    ['30.00', 2],
    ['30.01', 2],
    ['149.99', 2],
    ['150.00', 3],
    ['150.01', 3],
  ])('tier for $%s is %i', (amount, tier) => {
    expect(classifyTier(Money.fromDecimalString(amount))).toBe(tier);
  });

  it('flags missing GST number as insufficient in tier 2', () => {
    const res = evaluateDocumentation({
      total: Money.fromDecimalString('100.00'),
      vendorName: 'Acme',
      transactionDate: '2026-09-18',
      gstHstNumber: null,
      hasReceiptArtifact: true,
      hasBusinessPurpose: true,
      hasTaxAmount: true,
    });
    expect(res.tier).toBe(2);
    expect(res.status).toBe('insufficient');
    expect(res.missing.map((m) => m.key)).toContain('gst_number');
  });
});
