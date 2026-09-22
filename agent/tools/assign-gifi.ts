import { z } from 'zod';
import { validateGifiProposal } from '../../domain/cra/gifi-rules';
import type { ToolDefinition } from './types';

export const assignGifiTool: ToolDefinition<
  z.ZodObject<{ proposedCode: z.ZodString; expenseCategory: z.ZodString }>,
  ReturnType<typeof validateGifiProposal>
> = {
  name: 'assign_gifi_code',
  description: 'Validates a proposed GIFI code against the controlled catalogue.',
  inputSchema: z.object({
    proposedCode: z.string().min(1).max(10),
    expenseCategory: z.string().min(1),
  }),
  execute: async ({ proposedCode, expenseCategory }) =>
    validateGifiProposal({ proposedCode, expenseCategory }),
};
