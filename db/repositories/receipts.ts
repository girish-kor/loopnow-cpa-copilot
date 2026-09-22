import { db } from "../client";

export async function listReceipts() {
  return db.receipt.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getReceiptByExternalId(externalId: string) {
  return db.receipt.findUnique({ where: { externalId } });
}

export async function getReceiptById(id: string) {
  return db.receipt.findUnique({ where: { id } });
}

export async function getExpenseForReceipt(receiptId: string) {
  return db.expense.findFirst({ where: { receiptId } });
}
