import type { z } from 'zod';

export interface ToolContext {
  requestId: string;
  selectedReceiptId: string | null;
  model: string;
}

export interface ToolDefinition<I extends z.ZodTypeAny, O> {
  name: string;
  description: string;
  inputSchema: I;
  execute: (input: z.infer<I>, ctx: ToolContext) => Promise<O>;
}
