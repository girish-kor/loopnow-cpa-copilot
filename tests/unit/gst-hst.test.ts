import { describe, it, expect } from 'vitest';
import { validateGstHstFormat } from '../../domain/cra/gst-hst-rules';

describe('GST/HST format validation', () => {
  it('missing', () => expect(validateGstHstFormat(null).status).toBe('missing'));
  it('valid', () => expect(validateGstHstFormat('123456789RT0001').status).toBe('valid'));
  it('invalid', () => expect(validateGstHstFormat('abc').status).toBe('invalid'));
  it('malformed', () => expect(validateGstHstFormat('123RT12').status).toBe('malformed'));
  it('suspicious', () => expect(validateGstHstFormat('999999999RT0001').status).toBe('suspicious'));
  it('never claims registration verification', () => {
    expect(validateGstHstFormat('123456789RT0001').registrationVerified).toBe(false);
  });
});
