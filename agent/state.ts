export type ProcessingStage =
  | 'idle' | 'reading' | 'validating' | 'categorizing'
  | 'calculating' | 'mapping' | 'review' | 'complete' | 'error';

export interface AppStateSnapshot {
  selectedReceiptId: string | null;
  processingStatus: { receiptId: string | null; stage: ProcessingStage };
  currentAnalysis?: unknown;
  toolExecution?: { activeTool: string | null; completed: string[] };
  pendingApproval?: { receiptId: string; reason: string } | null;
}

export function initialAppState(): AppStateSnapshot {
  return {
    selectedReceiptId: null,
    processingStatus: { receiptId: null, stage: 'idle' },
    toolExecution: { activeTool: null, completed: [] },
    pendingApproval: null,
  };
}
