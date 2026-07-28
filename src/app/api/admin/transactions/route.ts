/**
 * src/app/api/admin/transactions/route.ts
 *
 * GET /api/admin/transactions
 * Returns a list of transactions, optionally filtered by ?status=pending|approved|rejected
 *
 * Protected: requires a valid admin session cookie.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/auth.service";
import { getAllTransactions } from "@/modules/transactions/services/transaction.service";

const ALLOWED_ROLES = ["superadmin"];

export async function GET(request: Request) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Role guard ────────────────────────────────────────────────────────────
  if (!ALLOWED_ROLES.includes(currentUser.role?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | null;

  try {
    const transactions = await getAllTransactions(status ?? undefined);
    return NextResponse.json({ transactions });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions";
    console.error("[GET /api/admin/transactions]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
