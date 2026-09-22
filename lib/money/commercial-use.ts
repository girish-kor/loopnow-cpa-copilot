/**
 * DB stores commercial_use_percentage as 0–100 (e.g. "100.00").
 * Domain/ITC engine expects ratio 0–1.
 * Always convert at the boundary; never pass raw DB value into ITC.
 */
export function commercialUseToRatio(dbValue: string | number | null | undefined): number {
  if (dbValue == null) return 1;
  const n = typeof dbValue === 'number' ? dbValue : Number.parseFloat(String(dbValue));
  if (!Number.isFinite(n)) return 1;
  // If already a ratio (≤ 1), leave it; otherwise treat as percentage.
  if (n >= 0 && n <= 1) return n;
  return Math.min(1, Math.max(0, n / 100));
}

export function commercialUseToDbString(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
    throw new Error(`Invalid commercial-use ratio: ${ratio}`);
  }
  return (ratio * 100).toFixed(2);
}
