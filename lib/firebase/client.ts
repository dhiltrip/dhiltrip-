"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public web config; each value must be written out in full so Next.js can inline it.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Without a config the app falls back to the on-device demo. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

const app = () => getApps()[0] ?? initializeApp(config);
export const clientAuth = () => getAuth(app());
export const clientDb = () => getFirestore(app());

export type ApiResult<T extends object = object> = ({ ok: true } & T) | { ok: false; message: string };

/** Calls one of the app's API routes as the signed-in user. */
export async function callApi<T extends object = object>(
  path: string,
  body?: unknown,
  method?: "DELETE",
): Promise<ApiResult<T>> {
  try {
    const token = (await clientAuth().currentUser?.getIdToken()) ?? "";
    const response = await fetch(path, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await response.json()) as ApiResult<T>;
  } catch {
    return { ok: false, message: "No connection. Please try again." };
  }
}
