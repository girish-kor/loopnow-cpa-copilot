import { z } from 'zod';
import { getReceiptByExternalId } from '../../db/repositories/receipts';
import type { ToolDefinition } from './types';
import { Errors } from '../../lib/errors';

export const getReceiptDetailsTool: ToolDefinition<
  z.ZodObject<{ receiptId: z.ZodString }>,
  Record<string, unknown>
> = {
  name: 'get_receipt_details',
  description: 'Loads full details for a receipt by external id.',
  inputSchema: z.object({ receiptId: z.string().min(1) }),
  execute: async ({ receiptId }) => {
    const r = await getReceiptByExternalId(receiptId);
    if (!r) throw Errors.NotFound('Receipt');
    return { ...r };
  },
};
