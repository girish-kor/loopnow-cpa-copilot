# CRA Ruleset Versioning

## Current version
`CRA_RULESET_VERSION` defaults to `2026.09.1` (see `domain/cra/sources.ts` and `.env.example`).

## When CRA rules change
1. Bump `CRA_RULESET_VERSION` in `.env` / deployment config (e.g. `2026.10.1`).
2. Update the affected pure functions under `domain/cra/` (documentation tiers, meals ratios, GIFI catalogue, ITC logic).
3. Add or adjust unit tests in `tests/unit/` and property tests in `tests/property/`.
4. Update golden cases in `evaluation/golden-cases.json` and confirm `npm run eval` passes.
5. If persisted expenses must be re-evaluated, write a one-off migration script that:
   - Selects expenses where `rule_version` < new version
   - Re-runs the deterministic engines
   - Writes new expense rows with the new `rule_version` and a new idempotency key
6. Document the change in the release notes and keep the previous version label for audit trail.

## Invariants that must never break
- Money remains integer-cent only.
- ITC eligible amount is always ∈ [0, grossTax].
- Documentation status drives eligibility (insufficient → review / zero ITC).
- GST/HST format validation never claims external registration verification.
- All mutations emit an audit event with the active `rule_version`.

## Rollback
Deploy the previous application image with the previous `CRA_RULESET_VERSION`. Existing expense rows keep their original `rule_version` for auditability.
