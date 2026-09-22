/**
 * Deterministic expense classification from vendor + free text.
 * Shared by agent tools and evaluation harness — single source of truth.
 */
import type { ExpenseCategory } from '../cra/types';

export interface ClassificationMatch {
  category: ExpenseCategory;
  confidence: number;
  reviewRequired: boolean;
  reasoning: string;
}

const KEYWORDS: ReadonlyArray<{ re: RegExp; category: ExpenseCategory }> = [
  { re: /\b(paper|pen|folder|stapler|office suppl|stationery)/i, category: 'office_supplies' },
  { re: /\b(dinner|lunch|restaurant|meal|catering)/i, category: 'meals_entertainment' },
  { re: /\b(flight|hotel|airfare|travel)/i, category: 'travel' },
  { re: /\b(legal|accounting|consult|professional)/i, category: 'professional_fees' },
  { re: /\b(rent|lease)/i, category: 'rent' },
  { re: /\b(hydro|utility|utilities)/i, category: 'utilities' },
  { re: /\b(phone|internet|telecom)/i, category: 'telecommunications' },
  { re: /\b(ad|advertis|promo)/i, category: 'advertising' },
  { re: /\b(insurance)/i, category: 'insurance' },
  { re: /\b(bank fee|service charge|nsf)/i, category: 'bank_fees' },
  { re: /\b(cash deposit)/i, category: 'cash_deposit' },
];

export function classifyExpenseText(
  vendor: string | null | undefined,
  rawText: string | null | undefined,
): ClassificationMatch {
  const haystack = `${vendor ?? ''}\n${rawText ?? ''}`.trim();
  if (!haystack) {
    return {
      category: 'unknown',
      confidence: 0,
      reviewRequired: true,
      reasoning: 'No textual evidence available.',
    };
  }
  for (const { re, category } of KEYWORDS) {
    if (re.test(haystack)) {
      return {
        category,
        confidence: 0.9,
        reviewRequired: false,
        reasoning: `Matched keyword for ${category}.`,
      };
    }
  }
  return {
    category: 'unknown',
    confidence: 0.2,
    reviewRequired: true,
    reasoning: 'No keyword matched; manual review required.',
  };
}
