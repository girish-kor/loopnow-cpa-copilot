import { Money } from '../money/money';
import type { DocumentationTier } from './types';
import { CRA_RULESET_VERSION } from './sources';

export interface DocumentationRequirement {
  key: string;
  description: string;
  required: boolean;
}

export interface DocumentationEvaluationInput {
  total: Money;
  vendorName?: string | null;
  transactionDate?: string | null;
  gstHstNumber?: string | null;
  hasReceiptArtifact: boolean;
  hasBusinessPurpose: boolean;
  hasTaxAmount: boolean;
}

export interface DocumentationEvaluationResult {
  tier: DocumentationTier;
  status: 'sufficient' | 'insufficient' | 'review';
  missing: DocumentationRequirement[];
  satisfied: string[];
  ruleVersion: string;
  sourceId: 'cra.itc.documentation';
}


const TIER_1 = Money.fromCents(3000n);   // < $30
const TIER_2 = Money.fromCents(15000n);  // < $150

export function classifyTier(total: Money): DocumentationTier {
  if (total.lt(TIER_1)) return 1;
  if (total.lt(TIER_2)) return 2;
  return 3;
}

const REQUIRED: Record<DocumentationTier, DocumentationRequirement[]> = {
  1: [
    { key: 'vendor', description: 'Vendor name or sufficient identifier', required: true },
    { key: 'date', description: 'Transaction date', required: true },
    { key: 'amount', description: 'Total amount paid', required: true },
    { key: 'tax', description: 'GST/HST amount paid', required: true },
  ],
  2: [
    { key: 'vendor', description: 'Vendor name', required: true },
    { key: 'date', description: 'Transaction date', required: true },
    { key: 'amount', description: 'Total amount paid', required: true },
    { key: 'tax', description: 'GST/HST amount paid', required: true },
    { key: 'gst_number', description: "Supplier's GST/HST registration number (or indication it was not provided)", required: true },
    { key: 'receipt', description: 'Receipt or supporting artifact', required: true },
  ],
  3: [
    { key: 'vendor', description: 'Vendor name', required: true },
    { key: 'date', description: 'Transaction date', required: true },
    { key: 'amount', description: 'Total amount paid', required: true },
    { key: 'tax', description: 'GST/HST amount paid and rate/type', required: true },
    { key: 'gst_number', description: "Supplier's GST/HST registration number", required: true },
    { key: 'receipt', description: 'Receipt or supporting artifact', required: true },
    { key: 'business_purpose', description: 'Documented business purpose', required: true },
  ],
};

export function evaluateDocumentation(input: DocumentationEvaluationInput): DocumentationEvaluationResult {
  const tier = classifyTier(input.total);
  const requirements = REQUIRED[tier];
  const missing: DocumentationRequirement[] = [];
  const satisfied: string[] = [];

  const has: Record<string, boolean> = {
    vendor: Boolean(input.vendorName && input.vendorName.trim().length > 0),
    date: Boolean(input.transactionDate),
    amount: true, // total is always supplied by caller; presence is guaranteed
    tax: input.hasTaxAmount,
    gst_number: Boolean(input.gstHstNumber && input.gstHstNumber.trim().length > 0),
    receipt: input.hasReceiptArtifact,
    business_purpose: input.hasBusinessPurpose,
  };

  for (const r of requirements) {
    if (has[r.key]) satisfied.push(r.key);
    else missing.push(r);
  }

  let status: DocumentationEvaluationResult['status'];
  if (missing.length === 0) status = 'sufficient';
  else if (missing.length === 1 && tier === 1) status = 'sufficient'; // tier 1 tolerance
  else status = 'insufficient';

  return {
    tier,
    status,
    missing,
    satisfied,
    ruleVersion: CRA_RULESET_VERSION,
    sourceId: 'cra.itc.documentation',
  };
}

export function requiredDocumentationFor(tier: DocumentationTier): DocumentationRequirement[] {
  return REQUIRED[tier];
}
