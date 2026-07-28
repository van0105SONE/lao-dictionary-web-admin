/**
 * src/modules/transactions/services/transaction.service.ts
 *
 * Server-side service layer for Firestore transaction operations.
 * All functions run exclusively in a Node.js / Next.js API Route context
 * (never in the browser) using the Firebase Admin SDK.
 */

import { getFirestoreAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { FirestoreTransaction, Transaction } from "@/types/transaction";

// ─── Collection names ────────────────────────────────────────────────────────
const TRANSACTIONS_COLLECTION = "transactions";
const USERS_COLLECTION = "users"; // App-side Firestore user profiles

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts a raw Firestore document snapshot into our Transaction type,
 * normalising the `requestedAt` Timestamp to an ISO string.
 */
function snapshotToTransaction(
  id: string,
  data: FirestoreTransaction
): Transaction {
  let requestedAt: string;

  if (
    data.requestedAt &&
    typeof data.requestedAt === "object" &&
    "seconds" in data.requestedAt
  ) {
    // Firestore Timestamp object → ISO string
    requestedAt = new Date(
      (data.requestedAt as { seconds: number }).seconds * 1000
    ).toISOString();
  } else {
    requestedAt = data.requestedAt as string;
  }

  return {
    id,
    ...data,
    requestedAt,
  };
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * Fetches all transactions, optionally filtered by status.
 * Returns the most recent requests first.
 */
export async function getAllTransactions(
  statusFilter?: "pending" | "approved" | "rejected"
): Promise<Transaction[]> {
  const db = getFirestoreAdmin();

  let query: FirebaseFirestore.Query = db
    .collection(TRANSACTIONS_COLLECTION)
    .orderBy("requestedAt", "desc");

  // Apply status filter only when provided
  if (statusFilter) {
    query = query.where("status", "==", statusFilter);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) =>
    snapshotToTransaction(doc.id, doc.data() as FirestoreTransaction)
  );
}

/**
 * Atomically approves a transaction and SETS the user's paidTokenBalance
 * to the `characters` value from the transaction document.
 *
 * Uses a Firestore `runTransaction` to guarantee atomicity:
 *  1. Read the transaction document and verify status === "pending"
 *  2. Set transaction.status → "approved"
 *  3. Read the user document using userId (upsert if not found)
 *  4. Set user.paidTokenBalance = characters  ← direct assignment, not increment
 *
 * If any step fails the entire operation rolls back with no partial writes.
 *
 * NOTE: If the user document does not exist yet, it will be created automatically
 * (upsert via set+merge) so the quota refill never fails due to a missing user row.
 *
 * @throws If the transaction is not "pending" or the transactionId is missing.
 */
export async function approveTransaction(transactionId: string): Promise<void> {
  const db = getFirestoreAdmin();

  const txDocRef = db.collection(TRANSACTIONS_COLLECTION).doc(transactionId);

  await db.runTransaction(async (firestoreTx: any) => {
    // ── Step 1: Read the transaction document ──────────────────────────────
    const txSnapshot = await firestoreTx.get(txDocRef);

    if (!txSnapshot.exists) {
      throw new Error(`Transaction "${transactionId}" not found.`);
    }

    const txData = txSnapshot.data() as FirestoreTransaction;

    // ── Step 2: Verify the transaction is still pending ────────────────────
    if (txData.status !== "pending") {
      throw new Error(
        `Transaction is already "${txData.status}" and cannot be approved.`
      );
    }

    const { userId, characters } = txData;

    if (!userId) {
      throw new Error("Transaction is missing a userId field.");
    }

    // ── Step 3: Read the user document (upsert-safe) ───────────────────────
    // We no longer throw if the user document is missing. Instead we use
    // set({ merge: true }) so the balance field is written whether the
    // document already exists or needs to be created from scratch.
    const userDocRef = db.collection(USERS_COLLECTION).doc(userId);
    const userSnapshot = await firestoreTx.get(userDocRef);

    if (!userSnapshot.exists) {
      console.warn(
        `[approveTransaction] User document "${userId}" not found in Firestore. ` +
          `A new document will be created with paidTokenBalance = ${characters}.`
      );
    }

    // ── Step 4: Write both updates atomically ──────────────────────────────

    // Update transaction status → "approved"
    firestoreTx.update(txDocRef, {
      status: "approved",
      processedAt: FieldValue.serverTimestamp(),
    });

    // SET paidTokenBalance = characters using set+merge so it works for both
    // existing and brand-new user documents (upsert behaviour).
    firestoreTx.set(
      userDocRef,
      { paidTokenBalance: characters },
      { merge: true }
    );
  });
}

/**
 * Rejects a transaction by atomically setting its status to "rejected".
 * Verifies the document is still "pending" before writing.
 *
 * @throws If the transaction is not found or not in "pending" state.
 */
export async function rejectTransaction(transactionId: string): Promise<void> {
  const db = getFirestoreAdmin();

  const txDocRef = db.collection(TRANSACTIONS_COLLECTION).doc(transactionId);

  await db.runTransaction(async (firestoreTx: any) => {
    // ── Step 1: Read & verify ──────────────────────────────────────────────
    const txSnapshot = await firestoreTx.get(txDocRef);

    if (!txSnapshot.exists) {
      throw new Error(`Transaction "${transactionId}" not found.`);
    }

    const txData = txSnapshot.data() as FirestoreTransaction;

    if (txData.status !== "pending") {
      throw new Error(
        `Transaction is already "${txData.status}" and cannot be rejected.`
      );
    }

    // ── Step 2: Update status → "rejected" ────────────────────────────────
    firestoreTx.update(txDocRef, {
      status: "rejected",
      processedAt: FieldValue.serverTimestamp(),
    });
  });
}
