'use client';
import type { ReceiptSummary } from '../dashboard/dashboard-shell';
import clsx from 'clsx';

export function ReceiptQueue({
  receipts, selectedId, onSelect,
}: { receipts: ReceiptSummary[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <aside className="p-4" aria-label="Receipt queue">
      <h2 className="text-xs uppercase tracking-wide text-fg-muted mb-3">Queue</h2>
      <ul role="listbox" aria-label="Receipts" className="space-y-1">
        {receipts.map((r) => {
          const isSelected = r.id === selectedId;
          return (
            <li key={r.id}>
              <button
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(r.id)}
                className={clsx(
                  'w-full text-left rounded-md border px-3 py-2 transition-colors',
                  isSelected ? 'border-accent bg-bg-raised' : 'border-border hover:bg-bg-subtle',
                )}
              >
                <div className="text-sm font-medium truncate">{r.vendor ?? 'Unknown vendor'}</div>
                <div className="text-xs text-fg-muted flex justify-between">
                  <span>{r.id}</span>
                  <span className="font-mono">${r.total}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
