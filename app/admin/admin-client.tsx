"use client";

import { account } from "@/lib/appwrite";
import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import { AppwriteException } from "appwrite";
import { useCallback, useEffect, useState } from "react";

type AuthState = "loading" | "signed-in" | "signed-out";
type ServerGate = "idle" | "ok" | "error";

export function AdminClient() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [serverGate, setServerGate] = useState<ServerGate>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshSession = useCallback(async () => {
    setError(null);
    try {
      await account.get();
      setAuth("signed-in");
    } catch {
      setAuth("signed-out");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (auth !== "signed-in") {
      setServerGate("idle");
      return;
    }
    setServerGate("idle");
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchWithAppwriteJwt("/api/admin/me");
        if (!cancelled) {
          setServerGate(res.ok ? "ok" : "error");
        }
      } catch {
        if (!cancelled) setServerGate("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await account.createEmailPasswordSession({ email, password });
      await refreshSession();
    } catch (err) {
      const message =
        err instanceof AppwriteException
          ? err.message
          : "Could not sign in. Check your email and password.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError(null);
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Session may already be invalid; still treat as signed out locally.
    } finally {
      setSubmitting(false);
      setAuth("signed-out");
    }
  }

  if (auth === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (auth === "signed-in") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          You are signed in. Upload tools will go here next.
        </p>
        {serverGate === "ok" ? (
          <p className="mt-3 text-sm text-green-700 dark:text-green-400">
            Server verified your session (JWT to /api/admin/me).
          </p>
        ) : serverGate === "error" ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-400" role="status">
            Could not verify server JWT. Check the network tab and Appwrite project settings.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={submitting}
          className="mt-8 rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Sign in with the studio Appwrite account.
      </p>
      <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-4">
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
