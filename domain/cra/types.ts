import { z } from 'zod';

export const TaxTypeSchema = z.enum(['GST', 'HST']);
export type TaxType = z.infer<typeof TaxTypeSchema>;

export const DocumentationStatusSchema = z.enum(['sufficient', 'insufficient', 'review']);
export type DocumentationStatus = z.infer<typeof DocumentationStatusSchema>;

export const ITCStatusSchema = z.enum(['eligible', 'partial', 'ineligible', 'review']);
export type ITCStatus = z.infer<typeof ITCStatusSchema>;

export const GstHstFormatStatusSchema = z.enum([
  'valid',
  'invalid',
  'missing',
  'malformed',
  'suspicious',
  'unavailable',
]);
export type GstHstFormatStatus = z.infer<typeof GstHstFormatStatusSchema>;

export const DocumentationTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type DocumentationTier = z.infer<typeof DocumentationTierSchema>;

export const ExpenseCategorySchema = z.enum([
  'office_supplies',
  'meals_entertainment',
  'travel',
  'professional_fees',
  'rent',
  'utilities',
  'telecommunications',
  'advertising',
  'insurance',
  'bank_fees',
  'cash_deposit',
  'unknown',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const MealContextSchema = z.enum(['standard', 'charity_or_public_institution', 'long_haul_truck_driver']);
export type MealContext = z.infer<typeof MealContextSchema>;

export const ReasonCodeSchema = z.enum([
  'STANDARD_ITC',
  'MEAL_STANDARD_50',
  'MEAL_CHARITY_100',
  'MEAL_LONG_HAUL_80',
  'COMMERCIAL_USE_PARTIAL',
  'INSUFFICIENT_DOCUMENTATION',
  'MISSING_GST_NUMBER',
  'NON_BUSINESS_EXPENSE',
  'ZERO_COMMERCIAL_USE',
  'REVIEW_REQUIRED',
]);
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;
