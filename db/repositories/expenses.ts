import { db } from "../client";

export interface ExpenseUpsertInput {
  receiptId: string;
  category: string;
  gifiCode: string | null;
  grossTax: string;
  eligibilityPercentage: string;
  eligibleItc: string;
  reasonCode: string;
  status: string;
  ruleVersion: string;
  idempotencyKey: string;
}

export async function upsertExpense(input: ExpenseUpsertInput) {
  const existing = await db.expense.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return { row: existing, created: false };

  try {
    const created = await db.expense.create({ data: input });
    return { row: created, created: true };
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (!/unique|duplicate/i.test(msg)) throw e;
  }

  const after = await db.expense.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (!after) throw new Error("Expense upsert failed after conflict");
  return { row: after, created: false };
}
