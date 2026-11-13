"use client";

/**
 * src/app/admin/customers/page.tsx
 *
 * Customer management for the mobile app (Firestore "users" collection).
 *  - Summary stats, search (email / name / UID), sort, "paying only" filter
 *  - Responsive table (desktop) + card list (mobile), pagination
 *  - Edit dialog for display name and token balances
 */

import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Coins,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/app/hooks/use-toast";
import type {
  Customer,
  CustomerListResponse,
  CustomerSort,
} from "@/types/customer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const nf = new Intl.NumberFormat();

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function initials(c: Customer): string {
  return (c.displayName || c.email || "?").charAt(0).toUpperCase();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Page {page} of {totalPages} · {nf.format(total)} results
        </p>
        <Select
          value={limit.toString()}
          onValueChange={(v) => {
            onLimitChange(Number(v));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Previous
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type EditForm = {
  displayName: string;
  freeDailyTokens: string;
  paidTokenBalance: string;
};

export default function CustomersPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerListResponse["stats"] | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<CustomerSort>("newest");
  const [onlyPaying, setOnlyPaying] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<EditForm>({
    displayName: "",
    freeDailyTokens: "0",
    paidTokenBalance: "0",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (onlyPaying) params.set("paying", "1");

      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load customers");

      const result = data as CustomerListResponse;
      setCustomers(result.customers);
      setStats(result.stats);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      if (result.pagination.page !== page) setPage(result.pagination.page);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, debouncedSearch, onlyPaying, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (c: Customer) => {
    setEditing(c);
    setFormError(null);
    setForm({
      displayName: c.displayName,
      freeDailyTokens: String(c.freeDailyTokens),
      paidTokenBalance: String(c.paidTokenBalance),
    });
  };

  const copyUid = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      toast({ title: "Copied", description: "UID copied to clipboard." });
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);

    const free = Number(form.freeDailyTokens);
    const paid = Number(form.paidTokenBalance);
    if (!Number.isInteger(free) || free < 0 || !Number.isInteger(paid) || paid < 0) {
      setFormError("Token values must be whole numbers ≥ 0");
      return;
    }

    // Only send fields that changed
    const body: Record<string, unknown> = {};
    if (form.displayName.trim() !== editing.displayName) body.displayName = form.displayName;
    if (free !== editing.freeDailyTokens) body.freeDailyTokens = free;
    if (paid !== editing.paidTokenBalance) body.paidTokenBalance = paid;

    if (Object.keys(body).length === 0) {
      setEditing(null);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      const updated = data as Customer;
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast({ title: "Customer updated", description: updated.email || updated.uid });
      setEditing(null);
      // Refresh stats (balances may have changed)
      loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const avatar = (c: Customer) => (
    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-accent-foreground">{initials(c)}</span>
    </div>
  );

  const paidDelta =
    editing && form.paidTokenBalance !== ""
      ? Number(form.paidTokenBalance) - editing.paidTokenBalance
      : 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        description="Manage mobile app customers and their token balances"
        action={
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total customers"
          value={stats ? nf.format(stats.totalCustomers) : "—"}
        />
        <StatCard
          icon={Wallet}
          label="With paid balance"
          value={stats ? nf.format(stats.payingCustomers) : "—"}
        />
        <StatCard
          icon={Coins}
          label="Total paid tokens"
          value={stats ? nf.format(stats.totalPaidBalance) : "—"}
        />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search email, name or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as CustomerSort);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="balance">Highest paid balance</SelectItem>
              <SelectItem value="email">Email A–Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="only-paying"
              checked={onlyPaying}
              onCheckedChange={(v) => {
                setOnlyPaying(v);
                setPage(1);
              }}
            />
            <Label htmlFor="only-paying" className="text-sm cursor-pointer">
              Paid balance only
            </Label>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>UID</TableHead>
                <TableHead className="text-right">Free daily</TableHead>
                <TableHead className="text-right">Paid balance</TableHead>
                <TableHead>Last reset</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin inline-block text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className={loading ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {avatar(c)}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {c.displayName || <span className="text-muted-foreground">No name</span>}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{c.email || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => copyUid(c.uid)}
                        title="Copy UID"
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        {c.uid.slice(0, 8)}…
                        <Copy className="w-3 h-3" />
                      </button>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {nf.format(c.freeDailyTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {nf.format(c.paidTokenBalance)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.lastResetDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="block md:hidden divide-y divide-border">
          {loading && customers.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">No customers found</p>
          ) : (
            customers.map((c) => (
              <div key={c.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {avatar(c)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {c.displayName || "No name"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{c.email || "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Free daily</p>
                    <p className="font-medium tabular-nums">{nf.format(c.freeDailyTokens)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Paid balance</p>
                    <p className="font-medium tabular-nums">{nf.format(c.paidTokenBalance)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDate(c.createdAt)} · Last reset {c.lastResetDate ?? "—"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => openEdit(c)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>
            ))
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <UserRound className="w-4 h-4" />
              {editing?.email || editing?.uid}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                maxLength={100}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freeDailyTokens">Free daily tokens</Label>
                <Input
                  id="freeDailyTokens"
                  type="number"
                  min={0}
                  step={1}
                  value={form.freeDailyTokens}
                  onChange={(e) => setForm({ ...form, freeDailyTokens: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidTokenBalance">Paid token balance</Label>
                <Input
                  id="paidTokenBalance"
                  type="number"
                  min={0}
                  step={1}
                  value={form.paidTokenBalance}
                  onChange={(e) => setForm({ ...form, paidTokenBalance: e.target.value })}
                  required
                />
              </div>
            </div>
            {editing && paidDelta !== 0 && Number.isFinite(paidDelta) && (
              <p className="text-sm text-muted-foreground">
                Paid balance will change by{" "}
                <span className={paidDelta > 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                  {paidDelta > 0 ? "+" : ""}
                  {nf.format(paidDelta)}
                </span>
              </p>
            )}
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
