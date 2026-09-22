import { CRA_RULESET_VERSION } from "../../domain/cra/sources";
import { hashPayload } from "../../lib/security/hash";
import { db } from "../client";

export interface AuditInput {
  actor: "agent" | "user" | "system";
  receiptId: string | null;
  action: string;
  input: unknown;
  result: unknown;
  model?: string | null;
  status: "success" | "failure" | "review";
}

export async function writeAudit(input: AuditInput) {
  const row = await db.auditEvent.create({
    data: {
      actor: input.actor,
      receiptId: input.receiptId,
      action: input.action,
      inputHash: hashPayload(input.input),
      resultHash: hashPayload(input.result),
      ruleVersion: CRA_RULESET_VERSION,
      model: input.model ?? null,
      status: input.status,
    },
  });
  return row;
}
