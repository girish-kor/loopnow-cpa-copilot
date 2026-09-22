import { NextRequest } from 'next/server';
import { Errors } from '../errors';

/**
 * Minimal API-key auth for production hardening.
 * When API_KEY env is set, require header `x-api-key` or `Authorization: Bearer <key>`.
 * When unset (local dev), requests are allowed (development convenience).
 */
export function requireApiKey(req: NextRequest): void {
  const expected = process.env.API_KEY;
  if (!expected) return; // auth disabled in environments without API_KEY

  const headerKey =
    req.headers.get('x-api-key') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null;

  if (!headerKey || headerKey !== expected) {
    throw Errors.Unauthorized();
  }
}

export function getActorFromRequest(req: NextRequest): string {
  // Future: decode JWT and return firmId/userId. For now a stable label.
  return req.headers.get('x-actor') ?? 'user';
}
