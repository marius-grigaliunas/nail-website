"use client";

import { account } from "@/lib/appwrite";
import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import { AppwriteException } from "appwrite";
import { useCallback, useEffect, useState } from "react";
import { AdminUploadForm } from "./admin-upload-form";

type AuthState = "signed-in" | "signed-out";
type ServerGate = "idle" | "ok" | "error";

/** If the browser never gets a response from Appwrite, `account.get()` can hang; cap wait time. */
const SESSION_CHECK_TIMEOUT_MS = 15_000;
/** Always hide “Checking session…” — `refreshSession` may never finish if fetch + timers stall (e.g. some mobile browsers). */
const SESSION_CHECK_UI_CLEAR_MS = 4_000;

export function AdminClient() {
  /** Session is checked in the background — never block the whole page on Appwrite. */
  const [auth, setAuth] = useState<AuthState>("signed-out");
  const [sessionCheck, setSessionCheck] = useState<"pending" | "done">("pending");
  const [serverGate, setServerGate] = useState<ServerGate>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Set when session check times out (e.g. phone cannot reach Appwrite). */
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [adminPanel, setAdminPanel] = useState<"home" | "upload">("home");

  const refreshSession = useCallback(async () => {
    setError(null);
    setBootstrapError(null);
    const timeout = new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), SESSION_CHECK_TIMEOUT_MS);
    });
    try {
      const result = await Promise.race([account.get().then(() => "ok" as const), timeout]);
      if (result === "timeout") {
        setBootstrapError(
          "Could not reach Appwrite in time. Check Wi‑Fi or cellular data, VPN/ad blockers, and that your Appwrite endpoint is reachable from this device.",
        );
        setAuth("signed-out");
        return;
      }
      setAuth("signed-in");
    } catch (err) {
      // 401 = no session; normal — show sign-in without alarming copy.
      if (err instanceof AppwriteException && err.code === 401) {
        setAuth("signed-out");
        return;
      }
      if (err instanceof AppwriteException) {
        // e.g. 403 Invalid Origin / CORS — Appwrite message names the host to add as a Web platform.
        setBootstrapError(err.message);
      }
      setAuth("signed-out");
    } finally {
      setSessionCheck("done");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSessionCheck("done");
    }, SESSION_CHECK_UI_CLEAR_MS);
    return () => window.clearTimeout(id);
  }, []);

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
      setAdminPanel("home");
    }
  }

  if (auth === "signed-in") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-start">
        <aside
          className="flex h-fit w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950/50"
          aria-label="Admin tools"
        >
          <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Tools
            </p>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            <button
              type="button"
              onClick={() => setAdminPanel("upload")}
              className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                adminPanel === "upload"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-700 hover:bg-neutral-200/80 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={submitting}
              className="mt-4 rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-200/80 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {submitting ? "Signing out…" : "Log out"}
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            {serverGate === "ok" ? (
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                Server verified your session (JWT to /api/admin/me).
              </p>
            ) : serverGate === "error" ? (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400" role="status">
                Could not verify server JWT. Check the network tab and Appwrite project settings.
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Checking server…</p>
            )}

            {adminPanel === "home" ? (
              <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-400">
                Choose <span className="font-medium text-neutral-800 dark:text-neutral-200">Upload</span> in the
                sidebar to add nail designs.
              </p>
            ) : (
              <AdminUploadForm />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Sign in with the admin account.
      </p>
      {sessionCheck === "pending" ? (
        <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
          Checking for an existing session…
        </p>
      ) : null}
      {bootstrapError ? (
        <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {bootstrapError}
        </p>
      ) : null}
      <form method="post" onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-4">
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
