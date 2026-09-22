/**
 * Bridges domain ToolDefinition → AI SDK tool() with Zod parse + telemetry hooks.
 */
import { tool as aiTool } from 'ai';
import { TOOLS } from './index';
import type { ToolContext } from './types';
import { Errors } from '../../lib/errors';

export type ToolEventHandler = (
  name: string,
  status: 'start' | 'end',
  payload?: unknown,
) => void;

export function buildAiSdkTools(ctx: ToolContext, onToolCall?: ToolEventHandler) {
  return Object.fromEntries(
    TOOLS.map((t) => [
      t.name,
      aiTool({
        description: t.description,
        parameters: t.inputSchema,
        execute: async (raw: unknown) => {
          onToolCall?.(t.name, 'start');
          const parsed = t.inputSchema.safeParse(raw);
          if (!parsed.success) {
            onToolCall?.(t.name, 'end', { error: 'INVALID_ARGS' });
            throw Errors.BadRequest(`Invalid args for ${t.name}`);
          }
          try {
            // Heterogeneous tool list: each tool's execute is typed to its own schema.
            // After safeParse, data matches that tool's input; cast through unknown.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const execute = t.execute as (input: unknown, ctx: ToolContext) => Promise<unknown>;
            const result = await execute(parsed.data, ctx);
            onToolCall?.(t.name, 'end', result);
            return result;
          } catch (e) {
            onToolCall?.(t.name, 'end', { error: (e as Error).message });
            throw e;
          }
        },
      }),
    ]),
  );
}
