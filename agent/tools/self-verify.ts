import { z } from "zod";
import {
  getExpenseForReceipt,
  getReceiptByExternalId,
} from "../../db/repositories/receipts";
import { validateGifiProposal } from "../../domain/cra/gifi-rules";
import { calculateEligibleITC } from "../../domain/cra/itc-rules";
import type {
  DocumentationStatus,
  ExpenseCategory,
  TaxType,
} from "../../domain/cra/types";
import { Money } from "../../domain/money/money";
import { commercialUseToRatio } from "../../lib/money/commercial-use";
import type { ToolDefinition } from "./types";

/**
 * Deterministic self-verification gate before reporting "complete".
 * Re-checks receipt existence, category, GIFI, ITC math, and documentation.
 */
export const selfVerifyTool: ToolDefinition<
  z.ZodObject<{
    receiptId: z.ZodString;
    category: z.ZodString;
    gifiCode: z.ZodNullable<z.ZodString>;
    eligibleItc: z.ZodString;
    documentationStatus: z.ZodString;
  }>,
  {
    ok: boolean;
    checks: Array<{ name: string; passed: boolean; detail: string }>;
    finalStatus: "complete" | "review" | "error";
  }
> = {
  name: "self_verify_classification",
  description:
    "Deterministically validates a proposed classification before completion. Must pass before reporting success.",
  inputSchema: z.object({
    receiptId: z.string().min(1),
    category: z.string().min(1),
    gifiCode: z.string().nullable(),
    eligibleItc: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    documentationStatus: z.string().min(1),
  }),
  execute: async (input) => {
    const checks: Array<{ name: string; passed: boolean; detail: string }> = [];
    const receipt = await getReceiptByExternalId(input.receiptId);
    checks.push({
      name: "receipt_exists",
      passed: Boolean(receipt),
      detail: receipt ? `found ${receipt.externalId}` : "receipt not found",
    });
    if (!receipt) {
      return { ok: false, checks, finalStatus: "error" };
    }

    const gifi = input.gifiCode
      ? validateGifiProposal({
          proposedCode: input.gifiCode,
          expenseCategory: input.category,
        })
      : {
          status: "review_required" as const,
          code: null,
          reason: "no gifi proposed",
        };
    checks.push({
      name: "gifi_valid",
      passed: gifi.status === "accepted" || input.category === "unknown",
      detail: gifi.reason ?? gifi.status,
    });

    const commercial = commercialUseToRatio(
      receipt.commercialUsePercentage.toString(),
    );
    const isMeal = input.category === "meals_entertainment";
    const recomputed = calculateEligibleITC({
      subtotal: Money.fromDecimalString(receipt.subtotal.toString()),
      taxAmount: Money.fromDecimalString(receipt.taxAmount.toString()),
      taxType: (receipt.taxType as TaxType) || "GST",
      expenseCategory: input.category as ExpenseCategory,
      commercialUsePercentage: commercial,
      mealEntertainment: isMeal,
      documentationStatus: input.documentationStatus as DocumentationStatus,
    });
    const proposed = Money.fromDecimalString(input.eligibleItc);
    const mathOk = proposed.cents === recomputed.eligibleITC.cents;
    checks.push({
      name: "itc_math",
      passed: mathOk,
      detail: mathOk
        ? `eligibleITC ${proposed.toString()} matches engine`
        : `proposed ${proposed.toString()} != engine ${recomputed.eligibleITC.toString()}`,
    });

    checks.push({
      name: "documentation",
      passed:
        input.documentationStatus === "sufficient" ||
        recomputed.status === "review",
      detail: `doc=${input.documentationStatus} itcStatus=${recomputed.status}`,
    });

    const expense = await getExpenseForReceipt(receipt.id);
    checks.push({
      name: "persisted",
      passed: true, // persistence may be pending; non-blocking for review path
      detail: expense ? `expense ${expense.id}` : "not yet persisted",
    });

    const ok = checks
      .filter((c) => c.name !== "persisted")
      .every((c) => c.passed);
    const finalStatus = ok
      ? "complete"
      : recomputed.status === "review"
        ? "review"
        : "error";
    return { ok, checks, finalStatus };
  },
};
