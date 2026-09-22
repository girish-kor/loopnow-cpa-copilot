export interface ComplianceSource {
  id: string;
  authority: 'CRA';
  title: string;
  url: string;
  retrievedAt?: string;
  ruleVersion: string;
}

export const CRA_RULESET_VERSION = process.env.CRA_RULESET_VERSION ?? '2026.09.1';

export const SOURCES: Record<string, ComplianceSource> = {
  'cra.itc.documentation': {
    id: 'cra.itc.documentation',
    authority: 'CRA',
    title: 'Input tax credit — documentation requirements',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/gst-hst-input-tax-credits.html',
    ruleVersion: CRA_RULESET_VERSION,
  },
  'cra.itc.meals': {
    id: 'cra.itc.meals',
    authority: 'CRA',
    title: 'Meals and entertainment — ITC limitation',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/calculate-prepare-report/gst-hst-input-tax-credits/meals-entertainment.html',
    ruleVersion: CRA_RULESET_VERSION,
  },
  'cra.gifi': {
    id: 'cra.gifi',
    authority: 'CRA',
    title: 'General Index of Financial Information (GIFI)',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/general-index-financial-information.html',
    ruleVersion: CRA_RULESET_VERSION,
  },
  'cra.gst-hst.number': {
    id: 'cra.gst-hst.number',
    authority: 'CRA',
    title: 'GST/HST registry and registration number format',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-your-gst-hst/when-charge-gst-hst.html',
    ruleVersion: CRA_RULESET_VERSION,
  },
};
