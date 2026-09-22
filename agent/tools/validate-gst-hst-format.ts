import { z } from 'zod';
import { validateGstHstFormat } from '../../domain/cra/gst-hst-rules';
import type { ToolDefinition } from './types';

export const validateGstHstFormatTool: ToolDefinition<
  z.ZodObject<{ gstHstNumber: z.ZodNullable<z.ZodString> }>,
  ReturnType<typeof validateGstHstFormat>
> = {
  name: 'validate_gst_hst_number_format',
  description: 'Deterministically validates Canadian GST/HST registration number format only. Does not verify registration with CRA.',
  inputSchema: z.object({ gstHstNumber: z.string().nullable() }),
  execute: async ({ gstHstNumber }) => validateGstHstFormat(gstHstNumber),
};
