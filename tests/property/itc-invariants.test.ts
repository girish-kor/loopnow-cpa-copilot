import { describe, it } from 'vitest';
import fc from 'fast-check';
import { Money } from '../../domain/money/money';
import { calculateEligibleITC } from '../../domain/cra/itc-rules';

describe('ITC invariants', () => {
  it('eligibleITC ∈ [0, grossTax]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_00 }),
        fc.integer({ min: 0, max: 100 }),
        fc.boolean(),
        (taxCents, commercialPct, isMeal) => {
          const r = calculateEligibleITC({
            subtotal: Money.fromCents(taxCents),
            taxAmount: Money.fromCents(taxCents),
            taxType: 'GST',
            expenseCategory: isMeal ? 'meals_entertainment' : 'office_supplies',
            commercialUsePercentage: commercialPct / 100,
            mealEntertainment: isMeal,
            documentationStatus: 'sufficient',
          });
          if (r.eligibleITC.cents < 0n) return false;
          if (r.eligibleITC.cents > r.grossTax.cents) return false;
          if (r.eligibilityPercentage < 0 || r.eligibilityPercentage > 1) return false;
          return true;
        },
      ),
    );
  });
});
