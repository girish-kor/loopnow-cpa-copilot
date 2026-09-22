/**
 * Money is stored as integer minor units (cents) to avoid float drift.
 * All arithmetic is integer. Rendering is decimal-string.
 */
export class Money {
  private constructor(readonly cents: bigint) {}

  static zero(): Money {
    return new Money(0n);
  }

  static fromCents(cents: bigint | number): Money {
    const v = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(cents));
    return new Money(v);
  }

  static fromDecimalString(input: string): Money {
    const s = input.trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error(`Invalid money string: ${s}`);
    const neg = s.startsWith('-');
    const body = neg ? s.slice(1) : s;
    const parts = body.split('.');
    const intPart = parts[0] ?? '0';
    const fracPart = parts[1] ?? '';
    const frac = (fracPart + '00').slice(0, 2);
    const cents = BigInt(intPart) * 100n + BigInt(frac);
    return new Money(neg ? -cents : cents);
  }

  static fromNumber(n: number): Money {
    if (!Number.isFinite(n)) throw new Error('Non-finite money');
    return Money.fromDecimalString(n.toFixed(2));
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }
  sub(other: Money): Money {
    return new Money(this.cents - other.cents);
  }
  isZero(): boolean {
    return this.cents === 0n;
  }
  isNegative(): boolean {
    return this.cents < 0n;
  }
  gte(other: Money): boolean {
    return this.cents >= other.cents;
  }
  lt(other: Money): boolean {
    return this.cents < other.cents;
  }

  /**
   * Multiply by a ratio in [0,1] expressed as numerator/denominator.
   * Rounds half away from zero at cent precision.
   */
  mulRatio(num: bigint, den: bigint): Money {
    if (den === 0n) throw new Error('Division by zero');
    const n = this.cents * num;
    const q = n / den;
    const r = n % den;
    const absR2 = (r < 0n ? -r : r) * 2n;
    const absDen = den < 0n ? -den : den;
    if (absR2 >= absDen) {
      const sign = n < 0n ? -1n : 1n;
      return new Money(q + sign);
    }
    return new Money(q);
  }

  toString(): string {
    const neg = this.cents < 0n;
    const abs = neg ? -this.cents : this.cents;
    const int = abs / 100n;
    const frac = (abs % 100n).toString().padStart(2, '0');
    return `${neg ? '-' : ''}${int}.${frac}`;
  }

  toJSON(): string {
    return this.toString();
  }
}
