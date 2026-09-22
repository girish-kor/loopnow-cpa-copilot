import { describe, it, expect } from 'vitest';
import { Money } from '../../domain/money/money';

describe('Money', () => {
  it('parses and renders decimal strings', () => {
    expect(Money.fromDecimalString('82.00').toString()).toBe('82.00');
    expect(Money.fromDecimalString('0.10').toString()).toBe('0.10');
    expect(Money.fromDecimalString('-4.10').toString()).toBe('-4.10');
  });
  it('adds and subtracts without float drift', () => {
    const a = Money.fromDecimalString('0.10');
    const b = Money.fromDecimalString('0.20');
    expect(a.add(b).toString()).toBe('0.30');
  });
  it('multiplies by ratio with half-up rounding', () => {
    const t = Money.fromDecimalString('12.00');
    expect(t.mulRatio(50n, 100n).toString()).toBe('6.00');
    const odd = Money.fromDecimalString('0.05');
    expect(odd.mulRatio(50n, 100n).toString()).toBe('0.03'); // 2.5 → 3
  });
  it('rejects malformed input', () => {
    expect(() => Money.fromDecimalString('abc')).toThrow();
    expect(() => Money.fromDecimalString('1.234')).toThrow();
  });
});
