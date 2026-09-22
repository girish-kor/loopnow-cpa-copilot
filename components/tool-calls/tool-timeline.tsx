'use client';
import type { ToolEvent } from '../dashboard/dashboard-shell';
import clsx from 'clsx';

const STATUS_ICON = { start: '●', end: '✓' } as const;

export function ToolTimeline({ events, stage }: { events: ToolEvent[]; stage: string }) {
  return (
    <section aria-label="Agent activity" className="rounded-lg border border-border bg-bg-subtle p-4">
      <h3 className="text-xs uppercase tracking-wide text-fg-muted mb-2">Agent activity</h3>
      <ol className="space-y-1 text-sm font-mono" aria-live="polite" aria-atomic="false">
        {events.length === 0 && <li className="text-fg-muted">Idle — send a message to begin.</li>}
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className={clsx(e.status === 'start' ? 'text-accent' : 'text-ok')}>{STATUS_ICON[e.status]}</span>
            <span>{e.name}</span>
            {e.status === 'end' && e.payload ? <span className="text-fg-muted truncate">{summarize(e.payload)}</span> : null}
          </li>
        ))}
      </ol>
      <div className="mt-2 text-xs text-fg-muted">Stage: {stage}</div>
    </section>
  );
}

function summarize(p: unknown): string {
  if (p && typeof p === 'object' && 'error' in p) return `error: ${(p as { error: string }).error}`;
  const s = JSON.stringify(p);
  return s && s.length > 60 ? s.slice(0, 60) + '…' : s ?? '';
}
