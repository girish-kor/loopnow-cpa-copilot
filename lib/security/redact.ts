const PATTERNS: Array<[RegExp, string]> = [
  [/\b\d{9}RT\d{4}\b/g, '[REDACTED_GST]'],
  [/\bsk-[A-Za-z0-9]{10,}\b/g, '[REDACTED_KEY]'],
  [/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_CARD]'],
];

export function redact(input: unknown): unknown {
  if (typeof input === 'string') {
    let out = input;
    for (const [re, rep] of PATTERNS) out = out.replace(re, rep);
    return out;
  }
  if (Array.isArray(input)) return input.map(redact);
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) out[k] = redact(v);
    return out;
  }
  return input;
}
