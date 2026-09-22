import type { ReceiptSummary } from '../dashboard/dashboard-shell';

export function ReceiptDetail({ receipt }: { receipt: ReceiptSummary }) {
  return (
    <article className="rounded-lg border border-border bg-bg-subtle p-5">
      <header className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">{receipt.vendor ?? 'Unknown vendor'}</h1>
          <p className="text-xs text-fg-muted">{receipt.id}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded border border-border">{receipt.status}</span>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Total" value={`$${receipt.total}`} />
        <Field label="GST/HST" value={`$${receipt.taxAmount}`} />
        <Field label="Category" value={receipt.category} />
      </dl>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
