import { db } from "@/db/client";
import { writeAudit } from "@/db/repositories/audit";
import { getReceiptByExternalId } from "@/db/repositories/receipts";
import { getActorFromRequest, requireApiKey } from "@/lib/auth/api-key";
import { Errors } from "@/lib/errors";
import { NextRequest } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  receiptId: z.string().min(1),
  action: z.string().min(1).max(64),
  decision: z.enum(["approve", "reject", "edit"]),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireApiKey(req);
  } catch (e) {
    const err = e as { code?: string; status?: number };
    return Response.json(
      { error: err.code ?? "UNAUTHORIZED" },
      { status: err.status ?? 401 },
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });

  const receipt = await getReceiptByExternalId(parsed.data.receiptId);
  if (!receipt) throw Errors.NotFound("Receipt");

  const actor = getActorFromRequest(req);

  const row = await db.approval.create({
    data: {
      receiptId: receipt.id,
      action: parsed.data.action,
      actor,
      decision: parsed.data.decision,
      comment: parsed.data.comment ?? null,
    },
  });

  await writeAudit({
    actor: "user",
    receiptId: receipt.id,
    action: `approval.${parsed.data.decision}`,
    input: parsed.data,
    result: row,
    status: "success",
  });

  return Response.json({ approval: row });
}
