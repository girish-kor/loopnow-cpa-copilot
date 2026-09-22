import { getCurrentReceiptTool } from './get-current-receipt';
import { getReceiptDetailsTool } from './get-receipt-details';
import { validateCraDocumentationTool } from './validate-cra-documentation';
import { validateGstHstFormatTool } from './validate-gst-hst-format';
import { calculateItcTool } from './calculate-itc';
import { classifyExpenseTool } from './classify-expense';
import { assignGifiTool } from './assign-gifi';
import { updateClassificationTool } from './update-classification';
import { requestHumanReviewTool } from './request-human-review';
import { getProcessingStatusTool } from './get-processing-status';
import { selfVerifyTool } from './self-verify';

export const TOOLS = [
  getCurrentReceiptTool,
  getReceiptDetailsTool,
  validateCraDocumentationTool,
  validateGstHstFormatTool,
  calculateItcTool,
  classifyExpenseTool,
  assignGifiTool,
  updateClassificationTool,
  requestHumanReviewTool,
  getProcessingStatusTool,
  selfVerifyTool,
] as const;

export const TOOL_NAMES = TOOLS.map((t) => t.name);
