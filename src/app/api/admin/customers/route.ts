/**
 * src/app/api/admin/customers/route.ts
 *
 * GET /api/admin/customers?page=1&limit=10&search=&sort=newest|oldest|balance|email&paying=1
 * Lists app customers from the Firestore "users" collection.
 *
 * Protected: superadmin only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth/services/auth.service";
import { listCustomers } from "@/modules/customers/services/customer.service";
import type { CustomerSort } from "@/types/customer";

const ALLOWED_ROLES = ["superadmin"];
const SORTS: CustomerSort[] = ["newest", "oldest", "balance", "email"];

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(currentUser.role?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));
  const sortParam = searchParams.get("sort") as CustomerSort | null;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "newest";

  try {
    const result = await listCustomers({
      search: searchParams.get("search") ?? "",
      page,
      limit,
      sort,
      onlyPaying: searchParams.get("paying") === "1",
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/customers]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
