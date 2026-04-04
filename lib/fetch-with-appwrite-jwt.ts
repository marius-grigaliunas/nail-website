"use client";

import { account } from "@/lib/appwrite";

const DEFAULT_JWT_SECONDS = 600;

/**
 * Calls your Next.js API routes (or Server Actions via fetch) with a fresh Appwrite user JWT.
 * Only use while a browser session exists (`account.get()` succeeded).
 */
export async function fetchWithAppwriteJwt(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { jwtDurationSeconds?: number },
): Promise<Response> {
  const { jwt } = await account.createJWT({
    duration: options?.jwtDurationSeconds ?? DEFAULT_JWT_SECONDS,
  });
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${jwt}`);
  return fetch(input, { ...init, headers });
}
