export interface GifiCode {
  code: string;
  description: string;
  category: string;
  parentCategory: string;
  applicableExpenseTypes: string[];
  confidence: number;
  source: 'CRA_GIFI';
}

export const GIFI_CATALOGUE: Record<string, GifiCode> = {
  '1001': { code: '1001', description: 'Cash', category: 'Assets', parentCategory: 'Current Assets', applicableExpenseTypes: ['cash_deposit'], confidence: 0.99, source: 'CRA_GIFI' },
  '8523': { code: '8523', description: 'Meals and entertainment', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['meals_entertainment'], confidence: 0.99, source: 'CRA_GIFI' },
  '8690': { code: '8690', description: 'Travel expenses', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['travel'], confidence: 0.9, source: 'CRA_GIFI' },
  '8760': { code: '8760', description: 'Professional fees', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['professional_fees'], confidence: 0.92, source: 'CRA_GIFI' },
  '8810': { code: '8810', description: 'Office expenses', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['office_supplies'], confidence: 0.95, source: 'CRA_GIFI' },
  '8811': { code: '8811', description: 'Office stationery and supplies', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['office_supplies'], confidence: 0.93, source: 'CRA_GIFI' },
  '8910': { code: '8910', description: 'Rent', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['rent'], confidence: 0.98, source: 'CRA_GIFI' },
  '8960': { code: '8960', description: 'Telephone and utilities', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['utilities', 'telecommunications'], confidence: 0.95, source: 'CRA_GIFI' },
  '8521': { code: '8521', description: 'Advertising and promotion', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['advertising'], confidence: 0.93, source: 'CRA_GIFI' },
  '8691': { code: '8691', description: 'Insurance', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['insurance'], confidence: 0.93, source: 'CRA_GIFI' },
  '8710': { code: '8710', description: 'Interest and bank charges', category: 'Expenses', parentCategory: 'Operating Expenses', applicableExpenseTypes: ['bank_fees'], confidence: 0.9, source: 'CRA_GIFI' },
};

export interface GifiLookupInput {
  proposedCode: string;
  expenseCategory: string;
}

export interface GifiLookupResult {
  status: 'accepted' | 'review_required';
  code: string | null;
  reason: string;
  source: 'CRA_GIFI';
}

export function validateGifiProposal(input: GifiLookupInput): GifiLookupResult {
  const entry = GIFI_CATALOGUE[input.proposedCode];
  if (!entry) {
    return { status: 'review_required', code: null, reason: `GIFI code ${input.proposedCode} not in controlled catalogue.`, source: 'CRA_GIFI' };
  }
  const applicable = entry.applicableExpenseTypes.includes(input.expenseCategory) || entry.applicableExpenseTypes.length === 0;
  if (!applicable) {
    return { status: 'review_required', code: entry.code, reason: `GIFI ${entry.code} does not apply to ${input.expenseCategory}.`, source: 'CRA_GIFI' };
  }
  return { status: 'accepted', code: entry.code, reason: `Mapped to GIFI ${entry.code} — ${entry.description}.`, source: 'CRA_GIFI' };
}

export function lookupGifiCandidates(expenseCategory: string): GifiCode[] {
  return Object.values(GIFI_CATALOGUE).filter((c) =>
    c.applicableExpenseTypes.includes(expenseCategory),
  );
}
