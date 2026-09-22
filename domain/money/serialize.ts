import { Money } from './money';

/** JSON-safe money fields for tool/API responses. */
export function moneyToJson(m: Money): string {
  return m.toString();
}

export function withMoneyStrings<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = { ...obj };
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Money) out[k] = v.toString();
  }
  return out as T;
}
