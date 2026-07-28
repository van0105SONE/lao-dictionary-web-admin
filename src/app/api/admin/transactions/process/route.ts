/**
 * src/app/api/admin/transactions/process/route.ts
 *
 * POST /api/admin/transactions/process
 *
 * Processes a transaction approval or rejection.
 *
 * Expected JSON body:
 *   { "transactionId": string, "action": "approve" | "reject" }
 *
 * When action === "approve":
 *   - Uses a Firestore runTransaction to atomically:
 *       a) Verify the transaction is still "pending"
 *       b) Set transaction.status → "approved"
 *       c) Increment user.paidTokenBalance by transaction.characters
 *
 * When action === "reject":
 *   - Uses a Firestore runTransaction to atomically:
 *       a) Verify the transaction is still "pending"
 *       b) Set transaction.status → "rejected"
 *
 * Protected: requires a valid session cookie AND role of superadmin or admin.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/auth.service";
import {
  approveTransaction,
  rejectTransaction,
} from "@/modules/transactions/services/transaction.service";
import type { ProcessTransactionBody } from "@/types/transaction";

const ALLOWED_ROLES = ["superadmin"];

export async function POST(request: Request) {
  // ── 1. Auth guard ─────────────────────────────────────────────────────────
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Role guard ─────────────────────────────────────────────────────────
  if (!ALLOWED_ROLES.includes(currentUser.role?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 3. Parse & validate request body ──────────────────────────────────────
  let body: ProcessTransactionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { transactionId, action } = body;

  if (!transactionId || typeof transactionId !== "string") {
    return NextResponse.json(
      { error: "transactionId is required and must be a string" },
      { status: 400 }
    );
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: 'action must be "approve" or "reject"' },
      { status: 400 }
    );
  }

  // ── 4. Execute atomic Firestore transaction ────────────────────────────────
  try {
    if (action === "approve") {
      await approveTransaction(transactionId);
      return NextResponse.json({
        success: true,
        message: "Transaction approved and user balance updated successfully.",
      });
    } else {
      await rejectTransaction(transactionId);
      return NextResponse.json({
        success: true,
        message: "Transaction has been rejected.",
      });
    }
  } catch (error: unknown) {
    // Service layer throws descriptive errors — surface them to the client.
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing the transaction.";

    console.error(
      `[POST /api/admin/transactions/process] action=${action} id=${transactionId}`,
      error
    );

    // Distinguish between business-logic errors (409) and server errors (500)
    const isBusinessError =
      message.includes("already") ||
      message.includes("not found") ||
      message.includes("missing");

    return NextResponse.json(
      { error: message },
      { status: isBusinessError ? 409 : 500 }
    );
  }
}
