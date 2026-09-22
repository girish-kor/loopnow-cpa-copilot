# Threat Model — Loopnow CPA Copilot

Lightweight model aligned with OWASP LLM Top 10 and NIST AI RMF concepts.

## Assets

- Financial classifications and ITC amounts  
- Receipt content (may contain PII / GST numbers)  
- Model API keys and database credentials  
- Audit trail integrity  

## Threats & mitigations

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Prompt injection** (receipt / OCR text) | Wrong ITC, rule bypass | `wrapUntrusted`, injection detectors, audit on detect, never execute receipt text as instructions |
| **Indirect injection** via vendor names/notes | Same | Same boundary; treat all external text as data |
| **Excessive agency** | Unauthorized financial mutations | Least-privilege tools; no shell; human approval for review states |
| **Tool abuse / invalid args** | Corrupt state | Zod schemas; domain re-validation; self-verify gate |
| **Model hallucination** (fake GIFI / %) | Incorrect books | Controlled GIFI catalogue; deterministic ITC; reject unknown codes |
| **Incorrect tax calculation** | Compliance risk | Integer-cent Money; property tests; self-verify recomputes ITC |
| **Credential leakage** | Account takeover | Secrets only in server env; Dockerfile blocks build-time keys; redaction |
| **Data exfiltration** | Privacy | No tools that export bulk data; redaction; API-key gate |
| **Replay / duplicate mutations** | Double entries | Idempotency keys on expense upsert |
| **Unauthorized state change** | Fraud | API-key auth; future firm-scoped queries |
| **False approval** | Claim ineligible ITC | Prefer review over silent approve; false-approval metric in eval |

## Trust boundaries

1. Browser → API (untrusted input, rate limited)  
2. API → Agent runtime (authenticated when `API_KEY` set)  
3. Agent → Tools (allowlisted only)  
4. Tools → Domain (pure functions)  
5. Tools → DB (repository layer)  

## Residual risk

Sophisticated multi-turn injection may still require ongoing pattern updates and human review. External CRA registry verification is intentionally out of scope.
