# Loopnow CPA Copilot

**Production-oriented AI agent for Canadian bookkeeping and GST/HST compliance.**

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Company assessment** | Loopnow Technologies — Full-Stack AI / Agentic Engineer             |
| **Version**            | 0.2.0                                                               |
| **Stack**              | Next.js 15 · AI SDK · PostgreSQL · Prisma · Zod · TypeScript strict |
| **Rule set**           | `CRA_RULESET_VERSION=2026.09.1`                                     |

The LLM **interprets, plans, and explains**. Deterministic TypeScript owns **ITC arithmetic, documentation tiers, meals policy, GST/HST format checks, and GIFI validation**. The model never computes final tax amounts.

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [Quick start](#2-quick-start)
3. [Architecture](#3-architecture)
4. [Agent & tools](#4-agent--tools)
5. [CRA rule engine](#5-cra-rule-engine)
6. [State model](#6-state-model)
7. [Security](#7-security)
8. [Testing & evaluation](#8-testing--evaluation)
9. [Observability & performance](#9-observability--performance)
10. [Docker & environment](#10-docker--environment)
11. [Scripts](#11-scripts)
12. [Production notes](#12-production-notes)
13. [Known limitations](#13-known-limitations)
14. [Documentation index](#14-documentation-index)
15. [Safety philosophy](#15-safety-philosophy)

---

## 1. Product overview

Loopnow CPA Copilot is an **app-aware, stateful, tool-using agent** embedded in a mock corporate expense queue. Users select a receipt and say things like _“Process this one”_ — the agent:

1. Reads the **currently selected** receipt (no paste required)
2. Validates CRA documentation tiers and GST/HST format
3. Classifies the expense (keyword catalogue + optional LLM guidance)
4. Calculates **eligible ITC** with integer-cent precision
5. Maps and **validates** a GIFI code against a controlled catalogue
6. Optionally **self-verifies** before reporting complete
7. Streams tool progress and an explanation over SSE
8. Writes **audit events** and may route to human review

### Demo receipts (seed)

| ID            | Scenario                    | Expected behaviour                    |
| ------------- | --------------------------- | ------------------------------------- |
| `receipt_001` | Staples office supplies     | Full ITC, GIFI 8810                   |
| `receipt_002` | Business meal               | **50%** ITC limitation                |
| `receipt_003` | Large expense, missing GST# | **Review** (insufficient docs)        |
| `receipt_004` | Cash deposit                | **Ineligible** (not a taxable supply) |
| `receipt_005` | Partial commercial use      | Partial ITC                           |
| `receipt_006` | Prompt-injection text       | Injection resisted → review           |

---

## 2. Quick start

### Prerequisites

- Node.js **≥ 20.11**
- Docker & Docker Compose (recommended), **or** local PostgreSQL
- An LLM API key (`MODEL_API_KEY`)

### Docker (preferred)

```bash
cp .env.example .env
# Edit .env — set at least MODEL_API_KEY

docker compose up --build
```

| Endpoint | URL                              |
| -------- | -------------------------------- |
| App      | http://localhost:3000            |
| Health   | http://localhost:3000/api/health |
| Ready    | http://localhost:3000/api/ready  |

### Local development

```bash
cp .env.example .env
npm install --legacy-peer-deps

# Start Postgres (or use docker compose up db -d)
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loopnow

npm run db:migrate
npm run db:seed
npm run dev
```

### Local development without Docker (Windows)

The app only requires PostgreSQL; Docker is optional. Install PostgreSQL 16 natively, create the `cpa` database and user, then keep this connection string in `.env`:

```text
DATABASE_URL=postgresql://cpa:cpa@localhost:5432/cpa
```

With PostgreSQL running locally:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

If `prisma generate` reports an `EPERM` rename error on Windows, stop the running Next.js process, run `npm run db:generate`, and start the app again. The error means the active development server is holding Prisma's query engine file open.

### Zero-dependency checks (no Next install required)

```bash
npm run test:domain   # 37 pure domain assertions
npm run eval          # 71 golden cases · false-approval rate
npm run verify        # domain + eval; skips typecheck/lint/build if deps missing
```

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js App Router                                          │
│  Queue │ Receipt Detail │ Tool Timeline │ Approvals │ Chat   │
└────────────┬───────────────────────────────┬─────────────────┘
             │ SSE / JSON                    │
             ▼                               ▼
┌────────────────────┐            ┌──────────────────────────┐
│  /api/chat (SSE)   │            │  /api/receipts|approvals │
│  rate limit · auth │            │  API-key gate            │
└─────────┬──────────┘            └────────────┬─────────────┘
          ▼                                    ▼
┌────────────────────┐            ┌──────────────────────────┐
│  Agent Runtime     │  tools     │  Repositories            │
│  AI SDK maxSteps=8 │───────────▶│  receipts · expenses ·   │
│  system prompt     │            │  audit                   │
└─────────┬──────────┘            └────────────┬─────────────┘
          ▼                                    ▼
┌────────────────────┐            ┌──────────────────────────┐
│  Domain (pure)     │            │  PostgreSQL + Prisma     │
│  Money · ITC · Doc │            └──────────────────────────┘
│  Meals · GIFI · GST│
└────────────────────┘
```

Full write-up: [docs/architecture.md](docs/architecture.md) · diagram: [docs/architecture-diagram.md](docs/architecture-diagram.md)

### Design principles

| Principle                          | Implementation                          |
| ---------------------------------- | --------------------------------------- |
| **LLM is not the source of truth** | All tax math in `domain/`               |
| **Strict tool contracts**          | Zod schemas on every tool               |
| **Visible agency**                 | SSE tool timeline in the UI             |
| **Least privilege**                | Allowlisted tools only; no shell        |
| **Auditable**                      | Hashed audit events + rule version      |
| **Fail to review**                 | Prefer human review over false approval |

### Architecture decision records

| ADR                                                      | Decision                             |
| -------------------------------------------------------- | ------------------------------------ |
| [001](docs/decisions/001-deterministic-tax.md)           | Deterministic tax & compliance logic |
| [002](docs/decisions/002-ai-sdk-over-monolith-prompt.md) | AI SDK tool loop vs monolith prompt  |
| [003](docs/decisions/003-money-as-bigint-cents.md)       | Money as integer cents (`bigint`)    |

Refactor notes (v0.2): [docs/REFACTOR.md](docs/REFACTOR.md)

---

## 4. Agent & tools

### Tool catalogue (11)

| Tool                             | Role                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `get_current_receipt`            | App-aware: reads selected receipt; commercial use as **ratio 0–1** |
| `get_receipt_details`            | Full receipt payload                                               |
| `validate_cra_documentation`     | Tier 1 / 2 / 3 documentation engine                                |
| `validate_gst_hst_number_format` | Format only — **not** CRA registration proof                       |
| `calculate_eligible_itc`         | Deterministic ITC; returns string money fields                     |
| `classify_expense`               | Keyword catalogue (`domain/expenses/classify.ts`)                  |
| `assign_gifi_code`               | Controlled catalogue validation                                    |
| `update_expense_classification`  | Idempotent persist + audit                                         |
| `request_human_review`           | Queue for approval UI                                              |
| `get_processing_status`          | Stage probe                                                        |
| `self_verify_classification`     | Recomputes ITC + GIFI before “complete”                            |

Registry: `agent/tools/registry.ts` · system prompt: `agent/prompts/system.ts`

### Agent loop (typical)

```
User: "Process this one"
  → get_current_receipt
  → validate_cra_documentation
  → validate_gst_hst_number_format
  → classify_expense
  → calculate_eligible_itc
  → assign_gifi_code
  → self_verify_classification
  → update_expense_classification  (or request_human_review)
  → streamed explanation
```

### Provider abstraction

```bash
MODEL_PROVIDER=openai|anthropic   # or OpenAI-compatible via MODEL_BASE_URL
MODEL_NAME=gpt-4o-mini            # or Claude / other
MODEL_API_KEY=...
```

See `agent/provider.ts`.

---

## 5. CRA rule engine

| Module                   | Behaviour                                                               |
| ------------------------ | ----------------------------------------------------------------------- |
| `documentation-rules.ts` | **Tier 1** total &lt; $30 · **Tier 2** $30–&lt;$150 · **Tier 3** ≥ $150 |
| `itc-rules.ts`           | Eligible ITC from tax × eligibility × commercial use                    |
| `meals-rules.ts`         | Standard **50%** · long-haul truck **80%** · charity **100%**           |
| `gst-hst-rules.ts`       | `#########RT####` format; missing / invalid / malformed / suspicious    |
| `gifi-rules.ts`          | Catalogue + accept / `review_required`                                  |
| `sources.ts`             | CRA URLs + pinned `CRA_RULESET_VERSION`                                 |

### Money safety

- Storage: **integer cents** (`bigint`)
- Ratios: basis points (`ratioToBps`)
- Rounding: half away from zero at cent precision
- Tool outputs: **decimal strings** (no float drift across the wire)

Commercial-use DB values are stored as 0–100 and converted to ratio 0–1 at the tool boundary (`lib/money/commercial-use.ts`).

### Tax advice boundary

The agent states classifications **based on the configured rule set and available data**. It does **not** claim “CRA will accept this.” Insufficient data → review / professional attention.

---

## 6. State model

| Layer            | Examples                                       | Owner                       |
| ---------------- | ---------------------------------------------- | --------------------------- |
| **UI state**     | Selected receipt, chat messages, tool timeline | React client                |
| **Agent state**  | Processing stage, tool execution               | SSE events from `/api/chat` |
| **Domain state** | Receipts, expenses, audit, approvals           | PostgreSQL                  |

Do not conflate React state with bookkeeping truth. Mutations go through tools → repositories → DB with **idempotency keys**.

---

## 7. Security

Threat model: [docs/threat-model.md](docs/threat-model.md)

| Control                    | Detail                                                       |
| -------------------------- | ------------------------------------------------------------ |
| **Untrusted receipt text** | `wrapUntrusted()` — never treated as instructions            |
| **Injection detection**    | Regex + structural signals; audit on detect                  |
| **API key**                | Optional `API_KEY` → `x-api-key` / Bearer on mutating routes |
| **Rate limiting**          | In-memory or Redis (`REDIS_URL`)                             |
| **Secrets**                | Server-only; Dockerfile blocks build-time keys               |
| **Redaction**              | GST numbers, API keys, cards stripped from logs              |
| **No excessive agency**    | No shell / arbitrary HTTP tools                              |
| **Idempotency**            | Unique keys on expense upsert                                |
| **Human-in-the-loop**      | Approvals panel for review states                            |

Adversarial coverage: 10 injection cases + bad-instruction cases in the evaluation set.

---

## 8. Testing & evaluation

### Unit / domain

```bash
npm run test:domain    # 37 assertions — Money, tiers, GST, ITC, GIFI, injection, commercial use
npm test               # domain + Vitest (when installed)
npm run test:e2e       # Playwright smoke
```

Property tests (Vitest + fast-check): `eligibleITC ∈ [0, grossTax]`, percentage ∈ [0, 1].

### Evaluation harness (71 cases)

```bash
npm run eval
# → reports/evaluation-results.json
```

| Bucket          | Count | Intent                                |
| --------------- | ----: | ------------------------------------- |
| normal          |    13 | Happy-path office, travel, rent, etc. |
| tax_edge        |    18 | Meals, tiers, commercial use, cash    |
| missing_docs    |     6 | Missing GST / receipt / vendor        |
| ambiguous       |    10 | Weak textual evidence                 |
| injection       |    10 | Prompt-injection resistance           |
| bad_instruction |     5 | User asks to break rules              |
| tool_failure    |     4 | Invalid GIFI, idempotency             |
| state_sync      |     5 | Selected-receipt contracts            |

**Latest metrics**

| Metric              |            Value |
| ------------------- | ---------------: |
| Pass rate           | **100%** (71/71) |
| False approval rate |           **0%** |

Reports: [reports/test-report.md](reports/test-report.md) · [reports/evaluation-results.json](reports/evaluation-results.json)

### Safety metric

**False approval rate** — ineligible or review cases classified as eligible — is the primary compliance KPI. The harness reports it on every run.

---

## 9. Observability & performance

### Tracing

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to export agent/tool spans (`lib/otel/setup.ts`).

### Audit trail

Every meaningful action writes an `audit_events` row:

```json
{
  "actor": "agent",
  "action": "calculate_eligible_itc",
  "inputHash": "…",
  "resultHash": "…",
  "ruleVersion": "2026.09.1",
  "status": "success"
}
```

### Performance

See [reports/performance.md](reports/performance.md).

| Metric                  | Typical (local)         |
| ----------------------- | ----------------------- |
| Time to first SSE event | &lt; 100 ms             |
| Deterministic tool body | &lt; 20 ms each         |
| Total agent duration    | 2–8 s (model-dominated) |

---

## 10. Docker & environment

### Compose services

- **app** — Next.js
- **db** — PostgreSQL (migrations + seed on start path)
- Optional Redis for distributed rate limits

```bash
docker compose up --build
docker compose down -v   # reset data
```

### Environment variables

| Variable                      |     Required      | Purpose                           |
| ----------------------------- | :---------------: | --------------------------------- |
| `MODEL_API_KEY`               | **Yes** (runtime) | LLM provider key                  |
| `MODEL_PROVIDER`              |                   | `openai` (default) \| `anthropic` |
| `MODEL_NAME`                  |                   | Default `gpt-4o-mini`             |
| `MODEL_BASE_URL`              |                   | OpenAI-compatible base URL        |
| `DATABASE_URL`                |      **Yes**      | Postgres connection string        |
| `REDIS_URL`                   |                   | Distributed rate limiting         |
| `API_KEY`                     |                   | Protect APIs when set             |
| `CRA_RULESET_VERSION`         |                   | Default `2026.09.1`               |
| `OTEL_EXPORTER_OTLP_ENDPOINT` |                   | Trace export                      |
| `OTEL_SERVICE_NAME`           |                   | Default `loopnow-cpa-copilot`     |

Templates: `.env.example` · `.env.production.example`  
**Never commit** `.env`, keys, or tokens.

---

## 11. Scripts

| Script                | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Next.js development server                       |
| `npm run build`       | Production build                                 |
| `npm run start`       | Serve production build                           |
| `npm run typecheck`   | `tsc --noEmit`                                   |
| `npm run lint`        | ESLint (max-warnings=0)                          |
| `npm run test`        | Domain self-test + Vitest                        |
| `npm run test:domain` | Pure domain suite (no install of Next required)  |
| `npm run eval`        | 71 golden cases                                  |
| `npm run report`      | Domain + eval → reports                          |
| `npm run verify`      | Domain + eval; optional typecheck/lint/build     |
| `npm run db:generate` | Generate Prisma Client                           |
| `npm run db:migrate`  | Push the Prisma schema to the developer database |
| `npm run db:seed`     | Seed receipts + GIFI + sources                   |
| `npm run test:e2e`    | Playwright                                       |

---

## 12. Production notes

1. **Secrets at runtime** — never bake `MODEL_API_KEY` / `DATABASE_URL` into images
2. **Enable `API_KEY`** and preferably **Redis** for multi-instance deploys
3. **Pin and migrate** `CRA_RULESET_VERSION` — see [docs/RULE_VERSION.md](docs/RULE_VERSION.md)
4. **Commit a lockfile** and use `npm ci` in CI
5. **Monitor false-approval rate** from `npm run eval` in CI
6. **Health vs ready** — `/api/health` = process up; `/api/ready` = DB reachable

Dependency policy: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)

### Suggested CI

```
install → typecheck → lint → test:domain → eval → vitest → build → docker build
```

Workflow scaffold: `.github/workflows/ci.yml` · Dependabot: `.github/dependabot.yml`

---

## 13. Known limitations

| Area                  | Limitation                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| Evaluation            | Domain engines scored; full LLM tool-selection traces not scored end-to-end |
| Multi-tenant          | Firm isolation stubbed (API key only)                                       |
| GST verification      | Format validation only — not live CRA registration lookup                   |
| E2E                   | Playwright is smoke-level                                                   |
| OCR / voice           | Not in this build                                                           |
| Shared agent UI state | Custom SSE rather than CopilotKit/AG-UI                                     |

---

## 14. Documentation index

| Document                                                           | Contents                                   |
| ------------------------------------------------------------------ | ------------------------------------------ |
| [docs/architecture.md](docs/architecture.md)                       | System design, state ownership, agent loop |
| [docs/architecture-diagram.md](docs/architecture-diagram.md)       | Mermaid diagram                            |
| [docs/threat-model.md](docs/threat-model.md)                       | Threats & mitigations (OWASP-aligned)      |
| [docs/decisions/](docs/decisions/)                                 | ADRs                                       |
| [docs/RULE_VERSION.md](docs/RULE_VERSION.md)                       | CRA ruleset migration process              |
| [docs/REFACTOR.md](docs/REFACTOR.md)                               | v0.2 structural refactor                   |
| [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)                       | Dependency hygiene                         |
| [reports/test-report.md](reports/test-report.md)                   | Test results                               |
| [reports/performance.md](reports/performance.md)                   | Latency methodology                        |
| [reports/evaluation-results.json](reports/evaluation-results.json) | Machine-readable eval metrics              |

---

## 15. Safety philosophy

> **Incorrectly approving an ineligible ITC is worse than sending a borderline case to review.**

When documentation is insufficient, injection is detected, GIFI is unknown, or commercial use is zero, the system routes to **`review`** or **`ineligible`** — never a silent full claim.

That preference is encoded in deterministic rules, enforced by tools, measured by the evaluation harness (**false approval rate = 0%** on the current golden set), and visible in the approvals UI.

---

## License & submission

Prototype for the Loopnow Technologies technical assessment. Not professional tax advice.

**Definition of done checklist (engineering):** Docker Compose · dashboard · app-aware selection · real Zod tools · CRA tiers · GST format · deterministic ITC · meals policy · GIFI catalogue · state updates · tool timeline · SSE streaming · audit · injection tests · unit/domain tests · evaluation dataset · `.env.example` · architecture docs.

**Human deliverables still required for full assessment package:** Loom demo (5–8 min), private GitHub invite, live performance numbers with your model key.
