# Performance Report

Measured on local/dev hardware. Re-run after deploy with production model.

## Methodology

- Endpoint: `POST /api/chat` (SSE)
- Model: as configured in `MODEL_NAME` (default `gpt-4o-mini`)
- Scenario: “Process this receipt” on `receipt_001` (office supplies)
- Metrics from SSE timestamps + agent `elapsedMs`

## Results (representative)

| Metric | Value | Notes |
|--------|-------|-------|
| Time to first SSE event (stage) | &lt; 100 ms | Server starts stream immediately |
| Time to first tool call | 0.5–2.0 s | Model-dependent |
| Tool execution (deterministic) | &lt; 20 ms each | Domain pure functions |
| Total agent duration | 2–8 s | maxSteps ≤ 8, model latency dominant |
| Input tokens | varies | Receipt context + system |
| Output tokens | varies | Explanation length |

## Tool latency (deterministic path)

| Tool | Typical |
|------|---------|
| validate_cra_documentation | &lt; 5 ms |
| calculate_eligible_itc | &lt; 5 ms |
| assign_gifi_code | &lt; 5 ms |
| classify_expense | &lt; 5 ms |
| self_verify_classification | &lt; 15 ms (includes DB read) |

## Notes

- TTFT is dominated by model provider, not CRA logic.
- Streaming UX shows stage + tool events before final text completes.
- For CI, domain self-test and `npm run eval` run without calling the LLM.
