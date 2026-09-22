import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Integration test — requires DATABASE_URL pointing at a migrated+seeded DB.
 * Verifies calling update twice does not create duplicates.
 */
describe.skipIf(!process.env.DATABASE_URL)('idempotency', () => {
  beforeAll(async () => {
    // Migrations + seed are expected to have been run by CI / docker migrate service.
  });

  it('duplicate update_expense_classification yields one expense', async () => {
    const { updateClassificationTool } = await import('../../agent/tools/update-classification');
    const ctx = { requestId: 't1', selectedReceiptId: 'receipt_001', model: 'test' };
    const payload = {
      receiptId: 'receipt_001',
      category: 'office_supplies',
      gifiCode: '8810',
      grossTax: '4.10',
      eligibilityPercentage: '1.0000',
      eligibleItc: '4.10',
      reasonCode: 'STANDARD_ITC',
      status: 'eligible',
      approvalRequired: false,
    };
    const a = await updateClassificationTool.execute(payload, ctx);
    const b = await updateClassificationTool.execute(payload, ctx);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(a.expenseId).toBe(b.expenseId);
  });
});
