# Refactor notes

Structural improvements applied without changing CRA semantics.

## Module boundaries

| Before | After |
|--------|--------|
| Keyword list embedded in `classify-expense` tool | `domain/expenses/classify.ts` (shared by tools + eval) |
| System prompt inline in `runtime.ts` | `agent/prompts/system.ts` |
| AI SDK tool wiring inside `runtime.ts` | `agent/tools/registry.ts` |
| Deep relative imports for CRA | `domain/cra/index.ts` barrel |
| Money scattered | `domain/money/index.ts` + `serialize.ts` |

## Tool contracts

- `calculate_eligible_itc` returns **JSON-safe strings** for money fields (`grossTax`, `eligibleITC`), not `Money` instances.
- Commercial use is documented as **ratio 0–1**; DB conversion remains in `lib/money/commercial-use.ts` at the receipt boundary.

## Agent loop

1. Rate limit  
2. Load selected receipt → injection scan → wrap untrusted  
3. `generateText` with allowlisted tools via registry  
4. Stream tool events to UI  
5. Prefer `self_verify_classification` before claiming complete  

## What did not change

- Integer-cent ITC arithmetic  
- Documentation tiers, meals policy, GIFI catalogue  
- Idempotent expense upsert  
- Audit hashing + rule version  
- Security: untrusted wrap, injection patterns, API key, redaction  

## Verification

```bash
npm run test:domain   # 37/37
npm run eval          # 71/71, false-approval 0%
```
