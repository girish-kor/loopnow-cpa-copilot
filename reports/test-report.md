# Test Report

Generated from `npm run report` (domain self-test + evaluation harness).

## Domain self-test

| Suite | Result |
|-------|--------|
| Money | Pass |
| Documentation tiers | Pass |
| GST/HST format | Pass |
| ITC engine | Pass |
| GIFI | Pass |
| Injection | Pass |
| Commercial-use scale | Pass |
| ITC invariants | Pass |
| **Total** | **37 / 37** |

## Evaluation harness (`evaluation/golden-cases.json`)

| Metric | Value |
|--------|-------|
| Total cases | **71** |
| Passed | **71** |
| Failed | **0** |
| Pass rate | **100%** |
| False approval count | **0** |
| False approval rate | **0%** |

### By category

| Category | Passed / Total |
|----------|----------------|
| normal | 13 / 13 |
| tax_edge | 18 / 18 |
| missing_docs | 6 / 6 |
| ambiguous | 10 / 10 |
| injection | 10 / 10 |
| bad_instruction | 5 / 5 |
| tool_failure | 4 / 4 |
| state_sync | 5 / 5 |

## Unit / property / security (Vitest)

Files under `tests/unit`, `tests/property`, `tests/security`. Require `npm install`.

## E2E

Playwright smoke under `tests/e2e` (dashboard, queue, copilot, approvals).

## Safety philosophy

False approval of ineligible ITC is treated as the primary risk metric. Current harness reports **0% false approval rate**.
