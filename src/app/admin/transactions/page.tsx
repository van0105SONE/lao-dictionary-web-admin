"use client";

/**
 * src/app/admin/transactions/page.tsx
 *
 * Transaction Approval Management Page
 *
 * Features:
 *  - Tab filter: All / Pending / Approved / Rejected
 *  - Responsive table (desktop) + card list (mobile)
 *  - Per-row approve/reject with loading spinners via TransactionActionButtons
 *  - Optimistic local state update after approve/reject (no full page reload)
 *  - Summary stat cards at the top
 */

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldOff,
  TrendingUp,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionActionButtons } from "@/components/transactions/TransactionActionButtons";
import { useToast } from "@/app/hooks/use-toast";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import type { Transaction } from "@/types/transaction";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "pending" | "approved" | "rejected";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string | { seconds: number }): string {
  if (typeof value === "object" && "seconds" in value) {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("lo-LA", {
    style: "currency",
    currency: "LAK",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-warning/40 bg-warning/10 text-warning text-xs"
      >
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-success/40 bg-success/10 text-success text-xs"
      >
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-destructive/40 bg-destructive/10 text-destructive text-xs"
    >
      <XCircle className="w-3 h-3" />
      Rejected
    </Badge>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Revenue Card ─────────────────────────────────────────────────────────────

interface RevenueCardProps {
  label: string;
  amountLAK: number;
  icon: React.ReactNode;
  colorClass: string;
}

function RevenueCard({ label, amountLAK, icon, colorClass }: RevenueCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground tabular-nums truncate">
          {formatCurrency(amountLAK)}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────

interface FilterTabProps {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}

function FilterTab({ label, active, count, onClick }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
          active ? "bg-primary-foreground/20" : "bg-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Allowed roles ────────────────────────────────────────────────────────────
const ALLOWED_ROLES = ["superadmin"];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const { toast } = useToast();
  const { user, loading: userLoading } = useCurrentUser();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadTransactions = useCallback(async (filter: StatusFilter) => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/transactions${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTransactions(activeFilter);
  }, [activeFilter, loadTransactions]);

  // ── Role guard ─────────────────────────────────────────────────────────────
  // While the user session is loading, show nothing; AdminLayout handles redirect
  // for unauthenticated users. Once loaded, block non-allowed roles.
  if (!userLoading && user && !ALLOWED_ROLES.includes(user.role?.toLowerCase() ?? "")) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">ບໍ່ມີສິດເຂົ້າເຖິງ</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            ທ່ານບໍ່ມີສິດທິ໌ໃນການເບິ່ງໜ້ານີ້.
            ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ.
          </p>
        </div>
      </AdminLayout>
    );
  }

  // ── Optimistic update after approve/reject ─────────────────────────────────
  const handleActionSuccess = (
    transactionId: string,
    action: "approve" | "reject"
  ) => {
    // Update local state so the row immediately reflects the new status
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId
          ? { ...tx, status: action === "approve" ? "approved" : "rejected" }
          : tx
      )
    );

    toast({
      title: action === "approve" ? "Transaction Approved ✓" : "Transaction Rejected",
      description:
        action === "approve"
          ? "User's token balance has been updated successfully."
          : "The transaction has been marked as rejected.",
    });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  // Always computed from the full unfiltered list when filter is "all",
  // otherwise approximate from the loaded slice.
  const allTx = transactions; // NOTE: for accurate counts, load all then filter client-side
  const pendingCount = allTx.filter((t) => t.status === "pending").length;
  const approvedCount = allTx.filter((t) => t.status === "approved").length;
  const rejectedCount = allTx.filter((t) => t.status === "rejected").length;
  const approvedRevenue = allTx
    .filter((t) => t.status === "approved")
    .reduce((sum, t) => sum + (t.amountLAK ?? 0), 0);

  return (
    <AdminLayout>
      <PageHeader
        title="Transaction Approvals"
        description="Review and approve or reject user payment transactions"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTransactions(activeFilter)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total"
          value={allTx.length}
          icon={<Receipt className="w-5 h-5 text-primary" />}
          colorClass="bg-primary/10"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={<Clock className="w-5 h-5 text-warning" />}
          colorClass="bg-warning/10"
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          colorClass="bg-success/10"
        />
        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon={<XCircle className="w-5 h-5 text-destructive" />}
          colorClass="bg-destructive/10"
        />
        <RevenueCard
          label="Revenue Received"
          amountLAK={approvedRevenue}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          colorClass="bg-emerald-500/10"
        />
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(
          [
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ] as { key: StatusFilter; label: string }[]
        ).map(({ key, label }) => (
          <FilterTab
            key={key}
            label={label}
            active={activeFilter === key}
            count={
              key === "all"
                ? allTx.length
                : key === "pending"
                ? pendingCount
                : key === "approved"
                ? approvedCount
                : rejectedCount
            }
            onClick={() => setActiveFilter(key)}
          />
        ))}
      </div>

      {/* ── Table / Card Container ─────────────────────────────────────── */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        {/* ── Desktop Table (md+) ─────────────────────────────────────── */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Package</TableHead>
                <TableHead className="text-right">Amount (LAK)</TableHead>
                <TableHead className="text-right">Characters</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin inline-block text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {tx.id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {tx.userId}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.packageId}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(tx.amountLAK)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {tx.characters.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.requestedAt as string)}
                    </TableCell>
                    <TableCell>
                      <TransactionActionButtons
                        transaction={tx}
                        onSuccess={handleActionSuccess}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Mobile Card List (<md) ─────────────────────────────────── */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center py-12 text-sm text-muted-foreground">
              No transactions found
            </p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono break-all">
                      {tx.id}
                    </code>
                    <p className="text-xs text-muted-foreground pt-1">User ID</p>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono break-all">
                      {tx.userId}
                    </code>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Package</p>
                    <p className="font-medium truncate">{tx.packageId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(tx.amountLAK)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Characters</p>
                    <p className="font-medium tabular-nums">
                      {tx.characters.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requested</p>
                    <p className="text-xs">
                      {formatDate(tx.requestedAt as string)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <TransactionActionButtons
                  transaction={tx}
                  onSuccess={handleActionSuccess}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
