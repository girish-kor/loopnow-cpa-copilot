import { describe, it, expect } from 'vitest';
import { validateGifiProposal } from '../../domain/cra/gifi-rules';

describe('GIFI validation', () => {
  it('accepts 8810 for office_supplies', () => {
    expect(validateGifiProposal({ proposedCode: '8810', expenseCategory: 'office_supplies' }).status).toBe('accepted');
  });
  it('rejects unknown 999999', () => {
    expect(validateGifiProposal({ proposedCode: '999999', expenseCategory: 'office_supplies' }).status).toBe('review_required');
  });
  it('rejects mismatched category', () => {
    expect(validateGifiProposal({ proposedCode: '8810', expenseCategory: 'meals_entertainment' }).status).toBe('review_required');
  });
});
