import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * The service account comes from FIREBASE_SERVICE_ACCOUNT (the JSON itself, used on Vercel)
 * or FIREBASE_SERVICE_ACCOUNT_FILE (a path to the downloaded key, used locally).
 * The key is secret and must never be sent to the browser.
 */
function serviceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) return JSON.parse(raw) as ServiceAccount;
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (file) return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file), "utf8")) as ServiceAccount;
  throw new Error("Firebase service account is not configured.");
}

function app() {
  return getApps()[0] ?? initializeApp({ credential: cert(serviceAccount()) });
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
