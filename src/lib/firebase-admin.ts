/**
 * src/lib/firebase-admin.ts
 *
 * Initializes the Firebase Admin SDK using the modern modular sub-package
 * imports (firebase-admin/app, firebase-admin/firestore) which resolve
 * correctly under Next.js's ESM/CommonJS hybrid bundler.
 *
 * Using `import * as admin from "firebase-admin"` causes `admin.apps` to be
 * undefined in some Next.js versions — the modular approach below avoids this.
 *
 * Required environment variables (add to your .env.local):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (double-quoted string with literal \n escapes)
 */

import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { App } from "firebase-admin/app";

/**
 * Returns the existing Firebase Admin App if already initialised,
 * otherwise creates a new one from environment variables.
 */
function getFirebaseAdminApp(): App {
  // getApps() from "firebase-admin/app" is always an array (never undefined)
  if (getApps().length > 0) {
    return getApp(); // Return the default app
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Un-escape literal \n sequences stored in the env file
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. " +
        "Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and " +
        "FIREBASE_PRIVATE_KEY are set in your .env.local file."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

/** Firestore instance — ready to use in any API route. */
export function getFirestoreAdmin() {
  getFirebaseAdminApp(); // Ensure the app is initialised before getting Firestore
  return getFirestore();
}

export { getFirebaseAdminApp };
