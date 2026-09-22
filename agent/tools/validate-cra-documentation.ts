import { z } from 'zod';
import { Money } from '../../domain/money/money';
import { evaluateDocumentation } from '../../domain/cra/documentation-rules';
import type { ToolDefinition } from './types';

export const validateCraDocumentationTool: ToolDefinition<
  z.ZodObject<{
    receiptId: z.ZodString;
    total: z.ZodString;
    vendorName: z.ZodNullable<z.ZodString>;
    transactionDate: z.ZodNullable<z.ZodString>;
    gstHstNumber: z.ZodNullable<z.ZodString>;
    hasReceiptArtifact: z.ZodBoolean;
    hasBusinessPurpose: z.ZodBoolean;
    hasTaxAmount: z.ZodBoolean;
  }>,
  ReturnType<typeof evaluateDocumentation>
> = {
  name: 'validate_cra_documentation',
  description: 'Deterministically evaluates CRA documentation tier and sufficiency.',
  inputSchema: z.object({
    receiptId: z.string().min(1),
    total: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    vendorName: z.string().nullable(),
    transactionDate: z.string().nullable(),
    gstHstNumber: z.string().nullable(),
    hasReceiptArtifact: z.boolean(),
    hasBusinessPurpose: z.boolean(),
    hasTaxAmount: z.boolean(),
  }),
  execute: async (input) => {
    return evaluateDocumentation({
      total: Money.fromDecimalString(input.total),
      vendorName: input.vendorName,
      transactionDate: input.transactionDate,
      gstHstNumber: input.gstHstNumber,
      hasReceiptArtifact: input.hasReceiptArtifact,
      hasBusinessPurpose: input.hasBusinessPurpose,
      hasTaxAmount: input.hasTaxAmount,
    });
  },
};
