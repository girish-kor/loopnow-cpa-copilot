#!/usr/bin/env node
/**
 * Runs every verification step that does not require a full Next.js install.
 * Use this in low-memory / CI-preflight environments.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let failed = 0;

function run(label, cmd, args) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    console.error(`FAIL: ${label}`);
    failed += 1;
    return false;
  }
  console.log(`OK: ${label}`);
  return true;
}

run('domain self-test', 'node', ['scripts/domain-selftest.mjs']);
run('evaluation harness (71 cases)', 'node', ['scripts/eval-selftest.mjs']);

const hasTsc = existsSync(resolve(root, 'node_modules/typescript/bin/tsc'));
const hasVitest = existsSync(resolve(root, 'node_modules/vitest'));
const hasNext = existsSync(resolve(root, 'node_modules/next'));
const hasEslint = existsSync(resolve(root, 'node_modules/eslint'));

if (hasTsc) {
  run('typecheck', 'node', ['node_modules/typescript/bin/tsc', '--noEmit']);
} else {
  console.log('\n── typecheck ── SKIPPED (typescript not installed)');
}

if (hasVitest) {
  run('vitest', 'npx', ['vitest', 'run']);
} else {
  console.log('\n── vitest ── SKIPPED (vitest not installed)');
}

if (hasEslint) {
  run('lint', 'npx', ['eslint', '.', '--max-warnings=0']);
} else {
  console.log('\n── lint ── SKIPPED (eslint not installed)');
}

if (hasNext) {
  run('next build', 'npx', ['next', 'build']);
} else {
  console.log('\n── next build ── SKIPPED (next not installed)');
}

console.log('\n' + '='.repeat(40));
if (failed) {
  console.error(`verify-all: ${failed} step(s) failed`);
  process.exit(1);
}
console.log('verify-all: all available steps passed');
process.exit(0);
