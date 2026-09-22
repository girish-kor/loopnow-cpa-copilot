'use client';
import { useState } from 'react';

export interface PendingApproval {
  receiptId: string;
  reason: string;
  status: string;
}

export function ApprovalPanel({
  items,
  onDecided,
}: {
  items: PendingApproval[];
  onDecided?: (receiptId: string, decision: 'approve' | 'reject') => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  async function decide(receiptId: string, decision: 'approve' | 'reject') {
    setBusy(receiptId);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId,
          action: 'review_decision',
          decision,
          comment: comment || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDecided?.(receiptId, decision);
      setComment('');
    } catch (e) {
      console.error('approval failed', e);
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-bg-subtle p-4">
        <h3 className="text-xs uppercase tracking-wide text-fg-muted mb-2">Approvals</h3>
        <p className="text-sm text-fg-muted">No items pending human review.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-bg-subtle p-4 space-y-3" aria-label="Pending approvals">
      <h3 className="text-xs uppercase tracking-wide text-fg-muted">Pending approvals</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.receiptId} className="border border-border rounded-md p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-mono">{item.receiptId}</span>
              <span className="text-warn text-xs uppercase">{item.status}</span>
            </div>
            <p className="text-xs text-fg-muted">{item.reason}</p>
            <div className="flex gap-2 items-center">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment"
                className="flex-1 bg-bg-raised border border-border rounded px-2 py-1 text-xs"
                aria-label="Approval comment"
              />
              <button
                disabled={busy === item.receiptId}
                onClick={() => void decide(item.receiptId, 'approve')}
                className="px-2 py-1 text-xs rounded bg-ok/20 text-ok border border-ok/40 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busy === item.receiptId}
                onClick={() => void decide(item.receiptId, 'reject')}
                className="px-2 py-1 text-xs rounded bg-err/20 text-err border border-err/40 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
