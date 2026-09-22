import { DashboardShell, type ReceiptSummary } from '@/components/dashboard/dashboard-shell';
import { listReceipts } from '@/db/repositories/receipts';

export const dynamic = 'force-dynamic';

const FALLBACK_RECEIPTS: ReceiptSummary[] = [
  {
    id: 'receipt_001',
    vendor: 'Staples Canada',
    total: '86.10',
    taxAmount: '4.10',
    category: 'unknown',
    status: 'pending',
  },
  {
    id: 'receipt_002',
    vendor: 'Restaurant ABC',
    total: '252.00',
    taxAmount: '12.00',
    category: 'unknown',
    status: 'pending',
  },
  {
    id: 'receipt_003',
    vendor: 'Unknown Vendor',
    total: '1260.00',
    taxAmount: '60.00',
    category: 'unknown',
    status: 'pending',
  },
  {
    id: 'receipt_004',
    vendor: 'Bank',
    total: '5000.00',
    taxAmount: '0.00',
    category: 'cash_deposit',
    status: 'pending',
  },
];

export default async function DashboardPage() {
  let initialReceipts: ReceiptSummary[] = FALLBACK_RECEIPTS;
  try {
    const receipts = await listReceipts();
    if (receipts.length > 0) {
      initialReceipts = receipts.map((r) => ({
        id: r.externalId,
        vendor: r.vendor ?? null,
        total: String(r.total),
        taxAmount: String(r.taxAmount),
        category: r.category,
        status: r.status,
      }));
    }
  } catch {
    // DB unavailable during build or local offline — use fallback mock data
  }
  return <DashboardShell initialReceipts={initialReceipts} />;
}
