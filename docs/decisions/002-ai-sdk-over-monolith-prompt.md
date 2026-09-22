# ADR 002: AI SDK tool loop vs monolith prompt

## Status
Accepted

## Context
A single system prompt that “does bookkeeping” cannot guarantee schema validity or visible tool execution.

## Decision
Use Vercel AI SDK `generateText` + Zod tools with `maxSteps`, streaming tool events to the UI via SSE.

## Consequences
+ Observable multi-step behaviour  
+ Provider abstraction  
− Need careful tool design and self-verification
