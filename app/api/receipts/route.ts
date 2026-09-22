import { NextRequest, NextResponse } from 'next/server';
import { listReceipts } from '@/db/repositories/receipts';
import { requireApiKey } from '@/lib/auth/api-key';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    requireApiKey(req);
  } catch (e) {
    const err = e as { code?: string; status?: number };
    return NextResponse.json({ error: err.code ?? 'UNAUTHORIZED' }, { status: err.status ?? 401 });
  }
  const rows = await listReceipts();
  return NextResponse.json({ receipts: rows });
}
