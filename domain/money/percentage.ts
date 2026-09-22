export interface Percentage { readonly ratio: number; } // 0..1

export function pct(ratio: number): Percentage {
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    throw new Error(`Invalid percentage ratio: ${ratio}`);
  }
  return { ratio };
}

export function ratioToBps(ratio: number): bigint {
  // basis points: 1% = 100 bps, 0.5% = 50 bps
  return BigInt(Math.round(ratio * 10000));
}

export const BPS_DENOM = 10000n;
