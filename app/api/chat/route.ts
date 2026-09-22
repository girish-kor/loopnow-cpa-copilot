import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runAgent } from '@/agent/runtime';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { requireApiKey } from '@/lib/auth/api-key';

export const runtime = 'nodejs';

const BodySchema = z.object({
  requestId: z.string().min(1).max(128),
  selectedReceiptId: z.string().min(1).max(128).nullable(),
  message: z.string().min(1).max(4_000),
});

export async function POST(req: NextRequest) {
  try {
    requireApiKey(req);
  } catch (e) {
    const err = e as { code?: string; status?: number; message?: string };
    return Response.json({ error: err.code ?? 'UNAUTHORIZED' }, { status: err.status ?? 401 });
  }

  const rl = checkRateLimit(`chat:${req.headers.get('x-forwarded-for') ?? 'local'}`, { windowMs: 60_000, max: 60 });
  if (!rl.ok) return Response.json({ error: 'RATE_LIMITED' }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: 'BAD_JSON' }, { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'BAD_REQUEST', issues: parsed.error.issues }, { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        push('state', { stage: 'reading' });
        const result = await runAgent({
          requestId: parsed.data.requestId,
          selectedReceiptId: parsed.data.selectedReceiptId,
          userMessage: parsed.data.message,
          onToolCall: (name, status, payload) => push('tool', { name, status, payload }),
        });
        push('state', { stage: 'complete' });
        push('message', { text: result.text });
        push('done', { elapsedMs: result.elapsedMs, toolCallCount: result.toolCallCount });
      } catch (e) {
        const err = e instanceof Error ? e : new Error('AGENT_FAILURE');
        push('error', { code: (e as { code?: string }).code ?? 'AGENT_FAILURE', message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
