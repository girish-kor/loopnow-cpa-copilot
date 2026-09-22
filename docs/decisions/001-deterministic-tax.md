# ADR 001: Deterministic tax & compliance logic

## Status
Accepted

## Context
CRA ITC, documentation tiers, and meals limits are regulatory rules. Encoding them only in prompts is non-auditable and non-testable.

## Decision
All tax arithmetic and threshold checks live in pure TypeScript under `domain/`. The LLM may select tools and explain; it never supplies the final number.

## Consequences
+ Unit/property tests prove invariants  
+ Rule versioning (`CRA_RULESET_VERSION`) is meaningful  
− Slightly more code than a “smart prompt”
