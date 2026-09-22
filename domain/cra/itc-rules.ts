import { Money } from '../money/money';
import { BPS_DENOM, ratioToBps } from '../money/percentage';
import { evaluateMealEligibility } from './meals-rules';
import type { DocumentationStatus, ExpenseCategory, ITCStatus, MealContext, ReasonCode, TaxType } from './types';
import { CRA_RULESET_VERSION } from './sources';

export interface ITCInput {
  subtotal: Money;
  taxAmount: Money;
  taxType: TaxType;
  expenseCategory: ExpenseCategory;
  commercialUsePercentage: number;
  mealContext?: MealContext;
  mealEntertainment: boolean;
  documentationStatus: DocumentationStatus;
}

export interface ITCResult {
  grossTax: Money;
  eligibilityPercentage: number;
  eligibleITC: Money;
  reasonCode: ReasonCode;
  status: ITCStatus;
  ruleVersion: string;
  sourceIds: string[];
}


function roundCentsDown(m: Money): Money {
  // Money already cent-precise; retained for clarity.
  return m;
}

export function calculateEligibleITC(input: ITCInput): ITCResult {
  const sourceIds: string[] = ['cra.itc.documentation'];

  if (input.taxAmount.isNegative()) {
    return {
      grossTax: input.taxAmount,
      eligibilityPercentage: 0,
      eligibleITC: Money.zero(),
      reasonCode: 'REVIEW_REQUIRED',
      status: 'review',
      ruleVersion: CRA_RULESET_VERSION,
      sourceIds,
    };
  }

  if (input.documentationStatus !== 'sufficient') {
    return {
      grossTax: input.taxAmount,
      eligibilityPercentage: 0,
      eligibleITC: Money.zero(),
      reasonCode: input.documentationStatus === 'insufficient' ? 'INSUFFICIENT_DOCUMENTATION' : 'REVIEW_REQUIRED',
      status: 'review',
      ruleVersion: CRA_RULESET_VERSION,
      sourceIds,
    };
  }

  if (input.commercialUsePercentage <= 0) {
    return {
      grossTax: input.taxAmount,
      eligibilityPercentage: 0,
      eligibleITC: Money.zero(),
      reasonCode: 'ZERO_COMMERCIAL_USE',
      status: 'ineligible',
      ruleVersion: CRA_RULESET_VERSION,
      sourceIds,
    };
  }

  let eligibilityBps: bigint;
  let reasonCode: ReasonCode = 'STANDARD_ITC';

  if (input.mealEntertainment || input.expenseCategory === 'meals_entertainment') {
    const meal = evaluateMealEligibility(input.mealContext ?? 'standard');
    eligibilityBps = ratioToBps(meal.ratio);
    reasonCode = meal.reasonCode;
    sourceIds.push(meal.sourceId);
  } else {
    eligibilityBps = BPS_DENOM; // 100%
  }

  const commercialBps = ratioToBps(input.commercialUsePercentage);
  const effectiveBps = (eligibilityBps * commercialBps) / BPS_DENOM;

  const eligible = roundCentsDown(input.taxAmount.mulRatio(effectiveBps, BPS_DENOM));
  const eligibilityPercentage = Number(effectiveBps) / Number(BPS_DENOM);

  let status: ITCStatus = 'eligible';
  if (eligible.isZero()) status = 'ineligible';
  else if (effectiveBps < BPS_DENOM) status = 'partial';

  return {
    grossTax: input.taxAmount,
    eligibilityPercentage,
    eligibleITC: eligible,
    reasonCode,
    status,
    ruleVersion: CRA_RULESET_VERSION,
    sourceIds,
  };
}
