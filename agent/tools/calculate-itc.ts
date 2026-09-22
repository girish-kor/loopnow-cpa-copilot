import { z } from 'zod';
import { Money } from '../../domain/money/money';
import { calculateEligibleITC } from '../../domain/cra/itc-rules';
import {
  ExpenseCategorySchema,
  TaxTypeSchema,
  DocumentationStatusSchema,
  MealContextSchema,
} from '../../domain/cra/types';
import type { ToolDefinition } from './types';

export const calculateItcTool: ToolDefinition<
  z.ZodObject<{
    receiptId: z.ZodString;
    subtotal: z.ZodString;
    taxAmount: z.ZodString;
    taxType: typeof TaxTypeSchema;
    expenseCategory: typeof ExpenseCategorySchema;
    commercialUsePercentage: z.ZodNumber;
    mealEntertainment: z.ZodBoolean;
    mealContext: z.ZodOptional<typeof MealContextSchema>;
    documentationStatus: typeof DocumentationStatusSchema;
  }>,
  {
    receiptId: string;
    grossTax: string;
    eligibilityPercentage: number;
    eligibleITC: string;
    reasonCode: string;
    status: string;
    ruleVersion: string;
    sourceIds: string[];
  }
> = {
  name: 'calculate_eligible_itc',
  description: 'Deterministically calculates the eligible Canadian GST/HST input tax credit.',
  inputSchema: z.object({
    receiptId: z.string().min(1),
    subtotal: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    taxAmount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    taxType: TaxTypeSchema,
    expenseCategory: ExpenseCategorySchema,
    /** Ratio in [0, 1]. Convert DB 0–100 values via commercialUseToRatio first. */
    commercialUsePercentage: z.number().min(0).max(1),
    mealEntertainment: z.boolean(),
    mealContext: MealContextSchema.optional(),
    documentationStatus: DocumentationStatusSchema,
  }),
  execute: async (input) => {
    const result = calculateEligibleITC({
      subtotal: Money.fromDecimalString(input.subtotal),
      taxAmount: Money.fromDecimalString(input.taxAmount),
      taxType: input.taxType,
      expenseCategory: input.expenseCategory,
      commercialUsePercentage: input.commercialUsePercentage,
      mealEntertainment: input.mealEntertainment,
      mealContext: input.mealContext,
      documentationStatus: input.documentationStatus,
    });
    return {
      receiptId: input.receiptId,
      grossTax: result.grossTax.toString(),
      eligibilityPercentage: result.eligibilityPercentage,
      eligibleITC: result.eligibleITC.toString(),
      reasonCode: result.reasonCode,
      status: result.status,
      ruleVersion: result.ruleVersion,
      sourceIds: result.sourceIds,
    };
  },
};
