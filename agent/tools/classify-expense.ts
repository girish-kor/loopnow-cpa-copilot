import { z } from 'zod';
import { classifyExpenseText } from '../../domain/expenses/classify';
import { wrapUntrusted } from '../../lib/security/untrusted';
import type { ToolDefinition } from './types';
import type { ExpenseCategory } from '../../domain/cra/types';

export const classifyExpenseTool: ToolDefinition<
  z.ZodObject<{
    receiptId: z.ZodString;
    vendor: z.ZodNullable<z.ZodString>;
    rawText: z.ZodNullable<z.ZodString>;
  }>,
  {
    category: ExpenseCategory;
    confidence: number;
    reviewRequired: boolean;
    reasoning: string;
  }
> = {
  name: 'classify_expense',
  description:
    'Deterministically proposes an expense category using a keyword catalogue. LLM output is advisory only.',
  inputSchema: z.object({
    receiptId: z.string().min(1),
    vendor: z.string().nullable(),
    rawText: z.string().nullable(),
  }),
  execute: async ({ vendor, rawText }) => {
    // Mark untrusted content; classification never executes it as instructions.
    void wrapUntrusted('receipt.rawText', rawText);
    return classifyExpenseText(vendor, rawText);
  },
};
