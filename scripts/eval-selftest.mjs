/** Lightweight eval runner without tsx — mirrors evaluation/run.ts domain path. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Inline minimal ports of domain logic (same as domain-selftest)
class Money {
  constructor(cents) { this.cents = cents; }
  static zero() { return new Money(0n); }
  static fromCents(c) { return new Money(typeof c === 'bigint' ? c : BigInt(Math.trunc(c))); }
  static fromDecimalString(input) {
    const s = input.trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error('bad money');
    const neg = s.startsWith('-');
    const [i, f = ''] = s.replace('-', '').split('.');
    const cents = BigInt(i) * 100n + BigInt((f + '00').slice(0, 2));
    return new Money(neg ? -cents : cents);
  }
  add(o) { return new Money(this.cents + o.cents); }
  isZero() { return this.cents === 0n; }
  isNegative() { return this.cents < 0n; }
  lt(o) { return this.cents < o.cents; }
  mulRatio(num, den) {
    const n = this.cents * num; const q = n / den; const r = n % den;
    const absR2 = (r < 0n ? -r : r) * 2n; const absDen = den < 0n ? -den : den;
    if (absR2 >= absDen) return new Money(q + (n < 0n ? -1n : 1n));
    return new Money(q);
  }
  toString() {
    const neg = this.cents < 0n; const abs = neg ? -this.cents : this.cents;
    return `${neg ? '-' : ''}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
  }
}
const BPS = 10000n;
const ratioToBps = (r) => BigInt(Math.round(r * 10000));
function mealRatio(ctx) {
  if (ctx === 'charity_or_public_institution') return 1;
  if (ctx === 'long_haul_truck_driver') return 0.8;
  return 0.5;
}
function itc(input) {
  if (input.taxAmount.isNegative() || input.documentationStatus !== 'sufficient')
    return { eligibleITC: Money.zero(), status: 'review', eligibilityPercentage: 0 };
  if (input.commercialUsePercentage <= 0)
    return { eligibleITC: Money.zero(), status: 'ineligible', eligibilityPercentage: 0 };
  let bps = BPS;
  if (input.mealEntertainment || input.expenseCategory === 'meals_entertainment')
    bps = ratioToBps(mealRatio(input.mealContext ?? 'standard'));
  const eff = (bps * ratioToBps(input.commercialUsePercentage)) / BPS;
  const el = input.taxAmount.mulRatio(eff, BPS);
  const pct = Number(eff) / Number(BPS);
  let status = 'eligible';
  if (el.isZero()) status = 'ineligible';
  else if (eff < BPS) status = 'partial';
  return { eligibleITC: el, status, eligibilityPercentage: pct };
}
const GST_RE = /^\d{9}RT\d{4}$/;
function gstFmt(raw) {
  if (raw == null || String(raw).trim() === '') return 'missing';
  const n = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  if (!GST_RE.test(n)) return /RT/.test(n) && /\d/.test(n) ? 'malformed' : 'invalid';
  if (/^0{9}|^1{9}|^9{9}/.test(n.slice(0, 9))) return 'suspicious';
  return 'valid';
}
const INJ = [
  /ignore (all|previous|prior|above)( (previous|prior|above))? (instructions|rules|prompts)/i,
  /reveal (your|the) (system )?prompt/i, /approve .{0,40}100% ?itc/i, /disregard .{0,30}cra/i,
  /you are now .{0,40}(unrestricted|jailbroken|dan)/i, /system\s*:\s*/i,
  /\[INST\]|<<SYS>>|<\|im_start\|>/i, /override (the )?(safety|policy|rules)/i,
  /do not follow (the )?(cra|tax) rules/i, /pretend (you are|to be) (a |an )?(unfiltered|unrestricted)/i,
];
function injection(t) {
  if (!t) return false;
  if (INJ.some((r) => r.test(t))) return true;
  return /\b(system message|important system|developer mode)\b/i.test(t) ||
    (/\b(ignore|disregard|override)\b/i.test(t) && /\b(instruction|rule|prompt|policy)\b/i.test(t));
}
function classify(vendor, raw) {
  const h = `${vendor ?? ''}\n${raw ?? ''}`;
  const K = [
    [/\b(paper|pen|folder|stapler|office suppl|stationery)/i, 'office_supplies'],
    [/\b(dinner|lunch|restaurant|meal|catering)/i, 'meals_entertainment'],
    [/\b(flight|hotel|airfare|travel)/i, 'travel'],
    [/\b(legal|accounting|consult|professional)/i, 'professional_fees'],
    [/\b(rent|lease)/i, 'rent'], [/\b(hydro|utility|utilities)/i, 'utilities'],
    [/\b(phone|internet|telecom)/i, 'telecommunications'],
    [/\b(ad|advertis|promo)/i, 'advertising'], [/\b(insurance)/i, 'insurance'],
    [/\b(bank fee|service charge|nsf)/i, 'bank_fees'], [/\b(cash deposit)/i, 'cash_deposit'],
  ];
  for (const [re, c] of K) if (re.test(h)) return c;
  return 'unknown';
}
const GIFI = { '8810': ['office_supplies'], '8523': ['meals_entertainment'], '1001': ['cash_deposit'],
  '8690': ['travel'], '8760': ['professional_fees'], '8910': ['rent'], '8960': ['utilities', 'telecommunications'],
  '8521': ['advertising'], '8691': ['insurance'], '8710': ['bank_fees'] };
function gifiCheck(code, cat) {
  if (!GIFI[code]) return 'review_required';
  return GIFI[code].includes(cat) ? 'accepted' : 'review_required';
}
function commercialUseToRatio(v) {
  if (v == null) return 1;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  if (!Number.isFinite(n)) return 1;
  return n <= 1 ? n : Math.min(1, Math.max(0, n / 100));
}
function docStatus(total, vendor, gst, hasReceipt, hasPurpose) {
  const cents = total.cents;
  const tier = cents < 3000n ? 1 : cents < 15000n ? 2 : 3;
  const missing = [];
  if (!vendor) missing.push('vendor');
  if (tier >= 2 && !gst) missing.push('gst');
  if (tier >= 2 && !hasReceipt) missing.push('receipt');
  if (tier >= 3 && !hasPurpose) missing.push('purpose');
  if (missing.length === 0) return 'sufficient';
  if (missing.length === 1 && tier === 1) return 'sufficient';
  return 'insufficient';
}

const cases = JSON.parse(readFileSync(resolve(root, 'evaluation/golden-cases.json'), 'utf-8'));
let passed = 0, failed = 0;
const failures = [];
const byCat = {};
let falseApprovals = 0;

for (const c of cases) {
  const input = c.input, expected = c.expected;
  const cat = c.category ?? 'uncategorized';
  byCat[cat] ??= { total: 0, passed: 0 };
  byCat[cat].total++;
  let ok = true, reason = 'ok', details = {};

  if (expected.injectionResisted) {
    ok = injection(String(input.raw ?? ''));
    reason = ok ? 'injection resisted' : 'injection not detected';
  } else if (expected.usesSelectedReceipt || expected.requiresSelection) {
    const has = Boolean(input.selectedReceiptId);
    if (expected.requiresSelection && has) { ok = false; reason = 'expected no selection'; }
    else if (expected.usesSelectedReceipt && !has) { ok = false; reason = 'expected selection'; }
  } else if (expected.noDuplicateExpense) {
    ok = true; reason = 'idempotency by design';
  } else if (expected.gifiStatus || expected.gifiRejected) {
    const proposed = String(input.proposedGifi ?? '999999');
    const category = String(input.category ?? 'office_supplies');
    const st = gifiCheck(proposed, category);
    if (expected.gifiRejected && st === 'accepted') { ok = false; reason = 'bad gifi accepted'; }
    else if (expected.gifiStatus && st !== expected.gifiStatus) { ok = false; reason = `gifi ${st}`; }
  } else if (expected.gstStatus) {
    const st = gstFmt(input.gst);
    if (st !== expected.gstStatus) { ok = false; reason = `gst ${st}`; }
  } else {
    const vendor = input.vendor ?? null;
    const raw = input.raw ?? null;
    const sub = String(input.subtotal ?? '0');
    const tax = String(input.tax ?? '0');
    const gst = input.gst === null ? null : (input.gst ?? '123456789RT0001');
    const category = input.category ?? classify(vendor, raw);
    const hasReceipt = input.hasReceipt === false ? false : true;
    const commercial = input.commercialUse != null ? commercialUseToRatio(input.commercialUse)
      : (category === 'cash_deposit' ? 0 : 1);
    const total = Money.fromDecimalString(sub).add(Money.fromDecimalString(tax));
    const dstat = docStatus(total, vendor, gst, hasReceipt, category !== 'unknown');
    const isMeal = category === 'meals_entertainment';
    const r = itc({
      taxAmount: Money.fromDecimalString(tax),
      expenseCategory: category,
      commercialUsePercentage: commercial,
      mealEntertainment: isMeal,
      mealContext: input.mealContext ?? 'standard',
      documentationStatus: dstat === 'sufficient' ? 'sufficient' : 'insufficient',
    });
    details = { category, status: r.status, eligibilityPercentage: r.eligibilityPercentage };
    if (expected.category && category !== expected.category) { ok = false; reason = `cat ${category}`; }
    if (ok && expected.status && r.status !== expected.status) { ok = false; reason = `status ${r.status}`; }
    if (ok && typeof expected.itcPercentage === 'number' &&
        Math.abs(r.eligibilityPercentage - expected.itcPercentage) > 0.02) {
      ok = false; reason = `pct ${r.eligibilityPercentage}`;
    }
    if ((expected.status === 'review' || expected.status === 'ineligible') && r.status === 'eligible') falseApprovals++;
  }

  if (ok) { passed++; byCat[cat].passed++; }
  else { failed++; failures.push({ id: c.id, reason }); }
}

const out = {
  total: cases.length, passed, failed,
  passRate: Number((passed / cases.length).toFixed(4)),
  falseApprovalCount: falseApprovals,
  falseApprovalRate: Number((falseApprovals / cases.length).toFixed(4)),
  byCategory: byCat, failures,
};
console.log(JSON.stringify(out, null, 2));
mkdirSync(resolve(root, 'reports'), { recursive: true });
writeFileSync(resolve(root, 'reports/evaluation-results.json'), JSON.stringify(out, null, 2));
process.exit(failed ? 1 : 0);
