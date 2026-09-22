import { z } from 'zod';
import type { ToolDefinition } from './types';

export const getProcessingStatusTool: ToolDefinition<
  z.ZodObject<{ receiptId: z.ZodString }>,
  { receiptId: string; stage: string }
> = {
  name: 'get_processing_status',
  description: 'Returns the current processing stage for a receipt.',
  inputSchema: z.object({ receiptId: z.string().min(1) }),
  execute: async ({ receiptId }) => ({ receiptId, stage: 'idle' }),
};
