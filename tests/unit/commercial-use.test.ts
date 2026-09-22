import { describe, it, expect } from 'vitest';
import { commercialUseToRatio, commercialUseToDbString } from '../../lib/money/commercial-use';

describe('commercial-use scale conversion', () => {
  it('converts DB percentage (0–100) to ratio (0–1)', () => {
    expect(commercialUseToRatio('100.00')).toBe(1);
    expect(commercialUseToRatio('50.00')).toBe(0.5);
    expect(commercialUseToRatio('0.00')).toBe(0);
    expect(commercialUseToRatio(75)).toBe(0.75);
  });

  it('leaves already-ratio values unchanged', () => {
    expect(commercialUseToRatio(1)).toBe(1);
    expect(commercialUseToRatio(0.5)).toBe(0.5);
    expect(commercialUseToRatio(0)).toBe(0);
  });

  it('defaults null/undefined/NaN to 1', () => {
    expect(commercialUseToRatio(null)).toBe(1);
    expect(commercialUseToRatio(undefined)).toBe(1);
    expect(commercialUseToRatio('abc')).toBe(1);
  });

  it('round-trips ratio → DB string → ratio', () => {
    const ratio = 0.8;
    const db = commercialUseToDbString(ratio);
    expect(db).toBe('80.00');
    expect(commercialUseToRatio(db)).toBe(0.8);
  });

  it('rejects invalid ratio for DB encoding', () => {
    expect(() => commercialUseToDbString(1.5)).toThrow();
    expect(() => commercialUseToDbString(-0.1)).toThrow();
  });
});
