import type { GstHstFormatStatus } from './types';

export interface GstHstValidationResult {
  status: GstHstFormatStatus;
  normalized: string | null;
  formatValid: boolean;
  registrationVerified: false; // always false — we never claim external verification
  notes: string;
}

const GST_REGEX = /^\d{9}RT\d{4}$/;

export function validateGstHstFormat(raw: string | null | undefined): GstHstValidationResult {
  if (raw == null || raw.trim() === '') {
    return {
      status: 'missing',
      normalized: null,
      formatValid: false,
      registrationVerified: false,
      notes: 'No GST/HST registration number was provided.',
    };
  }
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, '');
  const normalized = trimmed.startsWith('RT') ? trimmed : trimmed;

  // Heuristic: suspicious when length is wrong but contains RT
  if (!GST_REGEX.test(normalized)) {
    if (/RT/.test(normalized) && /\d/.test(normalized)) {
      return {
        status: 'malformed',
        normalized,
        formatValid: false,
        registrationVerified: false,
        notes: 'Number contains RT marker but does not match the expected 9-digit + RT + 4-digit format.',
      };
    }
    return {
      status: 'invalid',
      normalized,
      formatValid: false,
      registrationVerified: false,
      notes: 'Number does not match the expected Canadian GST/HST registration number format.',
    };
  }

  // Luhn-like checksum is not mandated by CRA in public documentation;
  // we only flag patterns commonly seen in placeholder data.
  const businessNumber = normalized.slice(0, 9);
  if (/^0{9}$/.test(businessNumber) || /^1{9}$/.test(businessNumber) || /^9{9}$/.test(businessNumber)) {
    return {
      status: 'suspicious',
      normalized,
      formatValid: true,
      registrationVerified: false,
      notes: 'Format is valid but the business number is a known placeholder pattern.',
    };
  }

  return {
    status: 'valid',
    normalized,
    formatValid: true,
    registrationVerified: false,
    notes: 'Format is valid. External CRA registration verification was NOT performed.',
  };
}
