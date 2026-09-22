# ADR 003: Money as integer cents (bigint)

## Status
Accepted

## Context
IEEE floats are unsuitable for tax amounts.

## Decision
`Money` stores `bigint` cents; all ratios use integer basis points with half-away-from-zero rounding.

## Consequences
+ No float drift  
+ Property tests can assert eligibleITC ∈ [0, grossTax]
