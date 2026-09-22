# Architecture — Loopnow CPA Copilot

## Product overview

Loopnow CPA Copilot is an app-aware, tool-using agent for Canadian GST/HST bookkeeping. The LLM plans and explains; **deterministic domain code** owns ITC arithmetic, documentation tiers, meals policy, GIFI validation, and GST/HST format checks.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App Router (React UI)                              │
│  Queue │ Receipt Detail │ Tool Timeline │ Approvals │ Chat  │
└────────────┬───────────────────────────────┬────────────────┘
             │ SSE / JSON                    │ Server Actions
             ▼                               ▼
┌────────────────────┐            ┌──────────────────────────┐
│  /api/chat (SSE)   │            │  /api/receipts|approvals │
│  rate limit + auth │            │  API-key gate            │
└─────────┬──────────┘            └────────────┬─────────────┘
          ▼                                    ▼
┌────────────────────┐            ┌──────────────────────────┐
│  Agent Runtime     │            │  Repositories            │
│  (AI SDK generate) │───────────▶│  receipts / expenses /   │
│  maxSteps=8        │  tools     │  audit                   │
└─────────┬──────────┘            └────────────┬─────────────┘
          │                                    │
          ▼                                    ▼
┌────────────────────┐            ┌──────────────────────────┐
│  Domain (pure)     │            │  PostgreSQL              │
│  Money · ITC · Doc│            │  Prisma schema           │
│  Meals · GIFI · GST│            └──────────────────────────┘
└────────────────────┘
          │
          ▼
┌────────────────────┐
│  Observability     │  OTEL (optional) · audit_events · hashes
└────────────────────┘
```

## State ownership

| Layer            | Examples                                           | Owner               |
| ---------------- | -------------------------------------------------- | ------------------- |
| **UI state**     | selected receipt, messages, tool timeline events   | React client        |
| **Agent state**  | processing stage, tool execution, pending approval | Agent runtime + SSE |
| **Domain state** | receipts, expenses, audit, approvals               | PostgreSQL          |

The agent never owns financial truth. Tools call pure domain functions; persistence goes through repositories with idempotency keys.

## Agent loop

1. User message + selected receipt id
2. Rate limit + API key
3. Wrap receipt `rawText` as untrusted
4. Detect injection → audit + review path
5. `generateText` with tools (max 8 steps)
6. Tools: read → validate docs → GST format → classify → ITC → GIFI → update → **self_verify** → optional human review
7. Stream tool events + final message via SSE

## Why AI SDK (not a single giant prompt)

- Explicit Zod tool contracts
- Multi-step tool loop with visible intermediate results
- Provider abstraction (OpenAI / Anthropic / compatible)
- Streaming of text and tool state

CopilotKit/AG-UI is a valid alternative for richer bidirectional state; this build uses AI SDK + explicit SSE for transparency and fewer dependencies.

## Determinism boundary

| LLM may                 | Deterministic code must          |
| ----------------------- | -------------------------------- |
| Interpret receipt text  | Compute ITC cents                |
| Propose category / GIFI | Validate GIFI catalogue          |
| Plan tool order         | Apply meals % and commercial use |
| Explain decisions       | Evaluate documentation tiers     |
| Route to review         | Persist + audit                  |

## Security boundaries

- No shell / arbitrary code tools
- Untrusted receipt wrapping + injection detection
- API-key on mutating/list routes when `API_KEY` set
- Server-only secrets
- Redaction of GST / keys / cards in logs
- Rate limits (Redis when available)

## Persistence

PostgreSQL via Prisma. The schema is defined in `prisma/schema.prisma`; `npm run db:migrate` uses `prisma db push` for the developer database. Seed provides six adversarial-friendly receipts including injection case.

## Observability

Optional OpenTelemetry (`OTEL_EXPORTER_OTLP_ENDPOINT`). Every mutation writes hashed audit events with `CRA_RULESET_VERSION`.

## Scaling notes

- Horizontal app instances need Redis rate limits (implemented)
- Multi-tenant: add `firmId` scope on repositories (auth stub present)
- Rule changes: see `docs/RULE_VERSION.md`

## Known limitations

- Evaluation harness exercises domain engines, not full LLM tool-selection traces
- E2E Playwright is smoke-level
- No OCR/vision or voice in this build
- GST format validation ≠ CRA registration verification (by design)
