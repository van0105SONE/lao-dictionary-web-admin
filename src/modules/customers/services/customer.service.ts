/**
 * src/modules/customers/services/customer.service.ts
 *
 * Server-side service for the Firestore "users" collection (app customers).
 * Runs only in API routes via the Firebase Admin SDK.
 *
 * Firestore has no substring/case-insensitive search, so the list endpoint
 * loads the (projected) collection and filters/sorts/paginates in memory.
 * That is fine for a few thousand documents; past that, move search to a
 * dedicated index (e.g. Algolia/Typesense) or prefix queries.
 */

import { getFirestoreAdmin } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type {
  Customer,
  CustomerListResponse,
  CustomerSort,
  CustomerUpdateBody,
} from "@/types/customer";

const USERS_COLLECTION = "users";

export class CustomerServiceError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return new Date((value as { seconds: number }).seconds * 1000).toISOString();
  }
  if (typeof value === "string") return value;
  return null;
}

function toCustomer(id: string, data: FirebaseFirestore.DocumentData): Customer {
  return {
    id,
    uid: data.uid ?? id,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    createdAt: toIso(data.createdAt),
    lastResetDate: data.lastResetDate ?? null,
    freeDailyTokens: Number(data.freeDailyTokens ?? 0),
    paidTokenBalance: Number(data.paidTokenBalance ?? 0),
  };
}

const sorters: Record<CustomerSort, (a: Customer, b: Customer) => number> = {
  newest: (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  oldest: (a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
  balance: (a, b) => b.paidTokenBalance - a.paidTokenBalance,
  email: (a, b) => a.email.localeCompare(b.email),
};

export async function listCustomers(opts: {
  search?: string;
  page: number;
  limit: number;
  sort?: CustomerSort;
  onlyPaying?: boolean;
}): Promise<CustomerListResponse> {
  const db = getFirestoreAdmin();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .select(
      "uid",
      "email",
      "displayName",
      "createdAt",
      "lastResetDate",
      "freeDailyTokens",
      "paidTokenBalance"
    )
    .get();

  const all = snapshot.docs.map((d) => toCustomer(d.id, d.data()));

  const stats = {
    totalCustomers: all.length,
    payingCustomers: all.filter((c) => c.paidTokenBalance > 0).length,
    totalPaidBalance: all.reduce((sum, c) => sum + c.paidTokenBalance, 0),
  };

  const q = opts.search?.trim().toLowerCase() ?? "";
  let filtered = q
    ? all.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          c.displayName.toLowerCase().includes(q) ||
          c.uid.toLowerCase().includes(q)
      )
    : all;
  if (opts.onlyPaying) filtered = filtered.filter((c) => c.paidTokenBalance > 0);

  filtered.sort(sorters[opts.sort ?? "newest"] ?? sorters.newest);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / opts.limit));
  const page = Math.min(opts.page, totalPages);
  const start = (page - 1) * opts.limit;

  return {
    customers: filtered.slice(start, start + opts.limit),
    pagination: { page, limit: opts.limit, total, totalPages },
    stats,
  };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const snap = await getFirestoreAdmin().collection(USERS_COLLECTION).doc(id).get();
  return snap.exists ? toCustomer(snap.id, snap.data()!) : null;
}

function validTokenCount(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

export async function updateCustomer(
  id: string,
  body: CustomerUpdateBody
): Promise<Customer> {
  const update: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || body.displayName.length > 100) {
      throw new CustomerServiceError("displayName must be a string (max 100 chars)");
    }
    update.displayName = body.displayName.trim();
  }
  if (body.freeDailyTokens !== undefined) {
    if (!validTokenCount(body.freeDailyTokens)) {
      throw new CustomerServiceError("freeDailyTokens must be a non-negative integer");
    }
    update.freeDailyTokens = body.freeDailyTokens;
  }
  if (body.paidTokenBalance !== undefined) {
    if (!validTokenCount(body.paidTokenBalance)) {
      throw new CustomerServiceError("paidTokenBalance must be a non-negative integer");
    }
    update.paidTokenBalance = body.paidTokenBalance;
  }

  if (Object.keys(update).length === 0) {
    throw new CustomerServiceError("Nothing to update");
  }

  const ref = getFirestoreAdmin().collection(USERS_COLLECTION).doc(id);
  try {
    // update() fails if the document does not exist (no accidental creation)
    await ref.update(update);
  } catch (err: any) {
    if (err?.code === 5 /* NOT_FOUND */) {
      throw new CustomerServiceError("Customer not found", 404);
    }
    throw err;
  }

  const snap = await ref.get();
  return toCustomer(snap.id, snap.data()!);
}
