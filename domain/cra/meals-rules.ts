import type { MealContext } from './types';
import { ratioToBps } from '../money/percentage';

export interface MealITCPolicy {
  standard: number;
  charityOrPublicInstitution: number;
  longHaulTruckDriver: number;
}

export const MEALS_ITC_POLICY: MealITCPolicy = {
  standard: 0.5,
  charityOrPublicInstitution: 1.0,
  longHaulTruckDriver: 0.8,
};

export interface MealEligibilityResult {
  context: MealContext;
  ratio: number;
  reasonCode: 'MEAL_STANDARD_50' | 'MEAL_CHARITY_100' | 'MEAL_LONG_HAUL_80' | 'REVIEW_REQUIRED';
  sourceId: 'cra.itc.meals';
}

export function evaluateMealEligibility(context: MealContext): MealEligibilityResult {
  switch (context) {
    case 'charity_or_public_institution':
      return { context, ratio: MEALS_ITC_POLICY.charityOrPublicInstitution, reasonCode: 'MEAL_CHARITY_100', sourceId: 'cra.itc.meals' };
    case 'long_haul_truck_driver':
      return { context, ratio: MEALS_ITC_POLICY.longHaulTruckDriver, reasonCode: 'MEAL_LONG_HAUL_80', sourceId: 'cra.itc.meals' };
    case 'standard':
      return { context, ratio: MEALS_ITC_POLICY.standard, reasonCode: 'MEAL_STANDARD_50', sourceId: 'cra.itc.meals' };
  }
}

export function mealRatioBps(context: MealContext): bigint {
  return ratioToBps(evaluateMealEligibility(context).ratio);
}
