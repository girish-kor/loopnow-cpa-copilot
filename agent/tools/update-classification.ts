import { z } from 'zod';
import { getReceiptByExternalId } from '../../db/repositories/receipts';
import { upsertExpense } from '../../db/repositories/expenses';
import { writeAudit } from '../../db/repositories/audit';
import { CRA_RULESET_VERSION } from '../../domain/cra/sources';
import { Errors } from '../../lib/errors';
import type { ToolDefinition } from './types';

export const updateClassificationTool: ToolDefinition<
  z.ZodObject<{
    receiptId: z.ZodString;
    category: z.ZodString;
    gifiCode: z.ZodNullable<z.ZodString>;
    grossTax: z.ZodString;
    eligibilityPercentage: z.ZodString;
    eligibleItc: z.ZodString;
    reasonCode: z.ZodString;
    status: z.ZodString;
    approvalRequired: z.ZodBoolean;
  }>,
  { created: boolean; expenseId: string; auditEventId: string }
> = {
  name: 'update_expense_classification',
  description: 'Idempotently persists a classification and emits an audit event. Requires approval flag for review states.',
  inputSchema: z.object({
    receiptId: z.string().min(1),
    category: z.string().min(1),
    gifiCode: z.string().nullable(),
    grossTax: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    eligibilityPercentage: z.string().regex(/^\d+(\.\d{1,4})?$/),
    eligibleItc: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    reasonCode: z.string().min(1),
    status: z.string().min(1),
    approvalRequired: z.boolean(),
  }),
  execute: async (input) => {
    const receipt = await getReceiptByExternalId(input.receiptId);
    if (!receipt) throw Errors.NotFound('Receipt');

    const idempotencyKey = `expense:${receipt.id}:${input.category}:${input.gifiCode ?? 'none'}:${CRA_RULESET_VERSION}`;
    const { row, created } = await upsertExpense({
      receiptId: receipt.id,
      category: input.category,
      gifiCode: input.gifiCode,
      grossTax: input.grossTax,
      eligibilityPercentage: input.eligibilityPercentage,
      eligibleItc: input.eligibleItc,
      reasonCode: input.reasonCode,
      status: input.status,
      ruleVersion: CRA_RULESET_VERSION,
      idempotencyKey,
    });

    const audit = await writeAudit({
      actor: 'agent',
      receiptId: receipt.id,
      action: 'update_expense_classification',
      input: input,
      result: row,
      status: input.status === 'review' ? 'review' : 'success',
    });

    return { created, expenseId: row.id, auditEventId: audit.eventId };
  },
};
