/**
 * Minimal OpenTelemetry bootstrap.
 * Activates only when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 */
import { trace, type Tracer, type Span } from '@opentelemetry/api';

let tracer: Tracer | null = null;
let initialized = false;

export async function initOtel(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;

  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

    const sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'loopnow-cpa-copilot',
      traceExporter: new OTLPTraceExporter({ url: endpoint }),
    });
    await sdk.start();
    tracer = trace.getTracer('loopnow-cpa-copilot');
  } catch (e) {
    console.warn('OTEL init failed', (e as Error).message);
  }
}

export function getTracer(): Tracer {
  return tracer ?? trace.getTracer('loopnow-cpa-copilot');
}

export interface AgentSpan {
  setAttribute: (key: string, value: string | number | boolean) => void;
  setStatus: (status: { code: number; message?: string }) => void;
  end: () => void;
}

export function startAgentSpan(
  name: string,
  attrs: Record<string, string | number> = {},
): AgentSpan {
  const t = getTracer();
  const span: Span = t.startSpan(name, { attributes: attrs });
  return {
    setAttribute: (key, value) => {
      span.setAttribute(key, value);
    },
    setStatus: (status) => {
      span.setStatus({ code: status.code, message: status.message });
    },
    end: () => {
      span.end();
    },
  };
}
