/**
 * Minimal .env loader (no dotenv dependency).
 * Loads KEY=VALUE pairs from .env into process.env if not already set.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

let loaded = false;

export function loadEnv(cwd: string = process.cwd()): void {
  if (loaded) return;
  loaded = true;

  const path = resolve(cwd, '.env');
  if (!existsSync(path)) return;

  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
