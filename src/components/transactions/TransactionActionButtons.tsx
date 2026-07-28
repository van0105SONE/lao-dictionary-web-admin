"use client";

/**
 * src/components/transactions/TransactionActionButtons.tsx
 *
 * A modular action-buttons component for a single transaction row.
 *
 * Features:
 *  - Per-row loading spinners (only the active row shows a spinner)
 *  - Optimistic UI: buttons become disabled once a decision is made
 *  - Displays inline error messages below the buttons
 *  - Calls onSuccess so the parent page can refresh or update local state
 */

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction, ProcessTransactionResponse } from "@/types/transaction";

interface TransactionActionButtonsProps {
  transaction: Transaction;
  /** Called after a successful approve OR reject so the parent can refresh. */
  onSuccess: (
    transactionId: string,
    action: "approve" | "reject"
  ) => void;
}

type LoadingState = "idle" | "approving" | "rejecting";

export function TransactionActionButtons({
  transaction,
  onSuccess,
}: TransactionActionButtonsProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  // If the transaction is no longer pending, show a read-only status badge
  if (transaction.status !== "pending") {
    return (
      <div className="flex items-center gap-1.5">
        {transaction.status === "approved" ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        )}
      </div>
    );
  }

  const handleAction = async (action: "approve" | "reject") => {
    setError(null);
    setLoadingState(action === "approve" ? "approving" : "rejecting");

    try {
      const res = await fetch("/api/admin/transactions/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.id, action }),
      });

      const data: ProcessTransactionResponse & { error?: string } =
        await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      // Notify parent — parent is responsible for refreshing the row data
      onSuccess(transaction.id, action);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoadingState("idle");
    }
  };

  const isLoading = loadingState !== "idle";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {/* ── Approve Button ── */}
        <Button
          id={`approve-btn-${transaction.id}`}
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => handleAction("approve")}
          className="gap-1.5 border-success/40 text-success hover:bg-success/10 hover:text-success hover:border-success/60 disabled:opacity-50 transition-colors h-7 text-xs px-2.5"
        >
          {loadingState === "approving" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Approving…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Approve
            </>
          )}
        </Button>

        {/* ── Reject Button ── */}
        <Button
          id={`reject-btn-${transaction.id}`}
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => handleAction("reject")}
          className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60 disabled:opacity-50 transition-colors h-7 text-xs px-2.5"
        >
          {loadingState === "rejecting" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Rejecting…
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Reject
            </>
          )}
        </Button>
      </div>

      {/* ── Inline error message ── */}
      {error && (
        <div className="flex items-start gap-1 text-xs text-destructive max-w-[200px]">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}
    </div>
  );
}
