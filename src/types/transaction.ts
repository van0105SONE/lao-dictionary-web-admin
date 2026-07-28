/**
 * src/types/transaction.ts
 *
 * TypeScript types mirroring the Firestore "transactions" collection schema.
 */

/** Raw shape of a Firestore transaction document */
export interface FirestoreTransaction {
  /** Price in Lao Kip */
  amountLAK: number;
  /** Number of AI text characters granted by this package */
  characters: number;
  /** Reference ID of the purchased package */
  packageId: string;
  /** ISO string or Firestore Timestamp representing when the request was made */
  requestedAt: string | { seconds: number; nanoseconds: number };
  /** Current approval status of the transaction */
  status: "pending" | "approved" | "rejected";
  /** Firestore UID of the app user who made the purchase */
  userId: string;
}

/** A transaction with its Firestore document ID attached (used on the frontend) */
export interface Transaction extends FirestoreTransaction {
  id: string;
}

/** Body sent from the UI to /api/admin/transactions/process */
export interface ProcessTransactionBody {
  transactionId: string;
  action: "approve" | "reject";
}

/** Generic API response shape */
export interface ProcessTransactionResponse {
  success: boolean;
  message: string;
}
