import { z } from 'zod';
import { writeAudit } from '../../db/repositories/audit';
import { getReceiptByExternalId } from '../../db/repositories/receipts';
import { Errors } from '../../lib/errors';
import type { ToolDefinition } from './types';

export const requestHumanReviewTool: ToolDefinition<
  z.ZodObject<{ receiptId: z.ZodString; reason: z.ZodString }>,
  { queued: true; auditEventId: string }
> = {
  name: 'request_human_review',
  description: 'Routes a receipt to human review with a reason. Does not mutate financial state.',
  inputSchema: z.object({
    receiptId: z.string().min(1),
    reason: z.string().min(1).max(500),
  }),
  execute: async ({ receiptId, reason }) => {
    const r = await getReceiptByExternalId(receiptId);
    if (!r) throw Errors.NotFound('Receipt');
    const audit = await writeAudit({
      actor: 'agent',
      receiptId: r.id,
      action: 'request_human_review',
      input: { receiptId, reason },
      result: { queued: true },
      status: 'review',
    });
    return { queued: true, auditEventId: audit.eventId };
  },
};
