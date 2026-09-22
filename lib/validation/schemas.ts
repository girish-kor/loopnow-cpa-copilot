import { z } from 'zod';

export const UuidSchema = z.string().uuid();
export const ExternalIdSchema = z.string().min(1).max(128);
export const MoneyStringSchema = z.string().regex(/^-?\d+(\.\d{1,2})?$/);
export const PercentageSchema = z.number().min(0).max(1);
export const CommercialUseSchema = z.number().min(0).max(100);

export const UntrustedTextSchema = z.string().max(20_000);
