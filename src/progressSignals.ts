

// progressSignals.ts
// Simple callback bundle used by upload/import routines to report progress back to UI.

export type progressSignal = {
  updateRowCount?: (count: number) => void;
  updateCompletedRows?: (count: number) => void;

  // Used to notify that parsing/upload finished successfully (or generally became "valid")
  updateValid?: (valid: boolean) => void;
};
