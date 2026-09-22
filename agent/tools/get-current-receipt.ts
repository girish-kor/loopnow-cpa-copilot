import { z } from "zod";
import { getReceiptByExternalId } from "../../db/repositories/receipts";
import { Errors } from "../../lib/errors";
import { commercialUseToRatio } from "../../lib/money/commercial-use";
import type { ToolDefinition } from "./types";

const InputSchema = z.object({
  /** Reserved; selection comes from ToolContext.selectedReceiptId */
  _unused: z.undefined().optional(),
});

export const getCurrentReceiptTool: ToolDefinition<
  typeof InputSchema,
  {
    receiptId: string;
    vendor: string | null;
    subtotal: string;
    taxAmount: string;
    total: string;
    taxType: string;
    gstHstNumber: string | null;
    receiptAvailable: boolean;
    commercialUsePercentage: number;
    rawText: string | null;
  }
> = {
  name: "get_current_receipt",
  description:
    "Returns the receipt currently selected in the application UI. commercialUsePercentage is a ratio 0–1.",
  inputSchema: InputSchema,
  execute: async (_input, ctx) => {
    if (!ctx.selectedReceiptId)
      throw Errors.BadRequest("No receipt is currently selected.");
    const r = await getReceiptByExternalId(ctx.selectedReceiptId);
    if (!r) throw Errors.NotFound("Selected receipt");
    return {
      receiptId: r.externalId,
      vendor: r.vendor,
      subtotal: r.subtotal.toString(),
      taxAmount: r.taxAmount.toString(),
      total: r.total.toString(),
      taxType: r.taxType,
      gstHstNumber: r.gstHstNumber,
      receiptAvailable: r.receiptAvailable,
      commercialUsePercentage: commercialUseToRatio(
        r.commercialUsePercentage.toString(),
      ),
      rawText: r.rawText,
    };
  },
};
