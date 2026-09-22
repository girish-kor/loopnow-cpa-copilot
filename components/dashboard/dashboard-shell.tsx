'use client';
import { useState, useMemo } from 'react';
import { ReceiptQueue } from '../receipt/receipt-queue';
import { ReceiptDetail } from '../receipt/receipt-detail';
import { CopilotPanel } from '../copilot/copilot-panel';
import { ToolTimeline } from '../tool-calls/tool-timeline';
import { ApprovalPanel, type PendingApproval } from '../approvals/approval-panel';

export interface ReceiptSummary {
  id: string;
  vendor: string | null;
  total: string;
  taxAmount: string;
  category: string;
  status: string;
}

export interface ToolEvent { name: string; status: 'start' | 'end'; payload?: unknown }

export function DashboardShell({ initialReceipts }: { initialReceipts: ReceiptSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(initialReceipts[0]?.id ?? null);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [stage, setStage] = useState<string>('idle');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [receipts, setReceipts] = useState(initialReceipts);

  const selected = receipts.find((r) => r.id === selectedId) ?? null;

  const pendingApprovals: PendingApproval[] = useMemo(
    () =>
      receipts
        .filter((r) => r.status === 'review' || r.status === 'pending')
        .map((r) => ({
          receiptId: r.id,
          reason: r.status === 'review' ? 'Agent requested human review' : 'Awaiting classification',
          status: r.status,
        })),
    [receipts],
  );

  function onDecided(receiptId: string, decision: 'approve' | 'reject') {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId ? { ...r, status: decision === 'approve' ? 'approved' : 'rejected' } : r,
      ),
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[320px_1fr_400px] gap-0">
      <ReceiptQueue receipts={receipts} selectedId={selectedId} onSelect={setSelectedId} />
      <section className="border-x border-border p-6 space-y-4" aria-live="polite">
        {selected ? <ReceiptDetail receipt={selected} /> : <EmptyState />}
        <ToolTimeline events={toolEvents} stage={stage} />
        <ApprovalPanel items={pendingApprovals} onDecided={onDecided} />
      </section>
      <CopilotPanel
        selectedReceiptId={selectedId}
        messages={messages}
        onMessage={(m) => setMessages((prev) => [...prev, m])}
        onToolEvent={(e) => setToolEvents((prev) => [...prev, e])}
        onStage={setStage}
      />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="text-fg-muted text-sm">Select a receipt from the queue to begin.</div>
  );
}
