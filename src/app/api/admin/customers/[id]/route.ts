/**
 * src/app/api/admin/customers/[id]/route.ts
 *
 * GET   /api/admin/customers/:id  → single customer
 * PATCH /api/admin/customers/:id  → update displayName / freeDailyTokens / paidTokenBalance
 *
 * Protected: superadmin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/auth.service";
import {
  CustomerServiceError,
  getCustomer,
  updateCustomer,
} from "@/modules/customers/services/customer.service";

const ALLOWED_ROLES = ["superadmin"];

async function guard() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(currentUser.role?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guard();
  if (denied) return denied;

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guard();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const customer = await updateCustomer(id, {
      displayName: body.displayName,
      freeDailyTokens: body.freeDailyTokens,
      paidTokenBalance: body.paidTokenBalance,
    });
    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof CustomerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/admin/customers/:id]", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
