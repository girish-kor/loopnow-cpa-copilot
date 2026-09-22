import { generateText, type CoreMessage } from 'ai';
import { getModel } from './provider';
import { buildAiSdkTools } from './tools/registry';
import type { ToolContext } from './tools/types';
import { Errors } from '../lib/errors';
import {
  wrapUntrusted,
  containsInjectionAttempt,
  logInjectionDetection,
} from '../lib/security/untrusted';
import { writeAudit } from '../db/repositories/audit';
import { getReceiptByExternalId } from '../db/repositories/receipts';
import { checkRateLimit } from '../lib/security/rate-limit';
import { startAgentSpan, initOtel } from '../lib/otel/setup';
import { SYSTEM_PROMPT } from './prompts/system';

export interface RunAgentInput {
  requestId: string;
  selectedReceiptId: string | null;
  userMessage: string;
  onToolCall?: (name: string, status: 'start' | 'end', payload?: unknown) => void;
}

export async function runAgent(input: RunAgentInput) {
  await initOtel();
  const span = startAgentSpan('agent.run', {
    requestId: input.requestId,
    selectedReceiptId: input.selectedReceiptId ?? '',
  });

  const rl = checkRateLimit(`agent:${input.requestId}`, { windowMs: 60_000, max: 30 });
  if (!rl.ok) {
    span.setStatus({ code: 2, message: 'rate_limited' });
    span.end();
    throw Errors.RateLimited();
  }

  const model = getModel();
  const ctx: ToolContext = {
    requestId: input.requestId,
    selectedReceiptId: input.selectedReceiptId,
    model: process.env.MODEL_NAME ?? 'gpt-4o-mini',
  };

  const tools = buildAiSdkTools(ctx, input.onToolCall);

  let receiptContext = '';
  if (input.selectedReceiptId) {
    const r = await getReceiptByExternalId(input.selectedReceiptId);
    if (r) {
      if (containsInjectionAttempt(r.rawText)) {
        logInjectionDetection(r.externalId, r.rawText ?? '');
        await writeAudit({
          actor: 'system',
          receiptId: r.id,
          action: 'prompt_injection_detected',
          input: { receiptId: r.externalId },
          result: { flagged: true },
          status: 'review',
        });
      }
      receiptContext = wrapUntrusted('receipt.rawText', r.rawText);
    }
  }

  const messages: CoreMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: receiptContext
        ? `${input.userMessage}\n\n${receiptContext}`
        : input.userMessage,
    },
  ];

  const started = Date.now();
  try {
    const result = await generateText({
      model,
      messages,
      tools,
      maxSteps: 8,
    });
    const elapsed = Date.now() - started;
    const toolCallCount = result.steps.reduce((n, s) => n + s.toolCalls.length, 0);
    span.setAttribute('toolCallCount', toolCallCount);
    span.setAttribute('elapsedMs', elapsed);
    span.end();
    return {
      text: result.text,
      steps: result.steps,
      elapsedMs: elapsed,
      toolCallCount,
    };
  } catch (e) {
    span.setStatus({ code: 2, message: (e as Error).message });
    span.end();
    throw e;
  }
}
