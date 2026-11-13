/**
 * src/types/customer.ts
 *
 * Types mirroring the Firestore "users" collection (mobile-app customers).
 */

/** Customer as returned by the admin API (Timestamps normalised to ISO strings) */
export interface Customer {
  /** Firestore document ID (same as Firebase Auth UID) */
  id: string;
  uid: string;
  email: string;
  displayName: string;
  createdAt: string | null;
  /** YYYY-MM-DD of the last free-token reset */
  lastResetDate: string | null;
  freeDailyTokens: number;
  paidTokenBalance: number;
}

/** Fields an admin is allowed to edit */
export interface CustomerUpdateBody {
  displayName?: string;
  freeDailyTokens?: number;
  paidTokenBalance?: number;
}

export type CustomerSort = "newest" | "oldest" | "balance" | "email";

export interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalCustomers: number;
    payingCustomers: number;
    totalPaidBalance: number;
  };
}
