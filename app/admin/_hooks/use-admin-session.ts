"use client";

import { account } from "@/lib/appwrite";
import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import { AppwriteException } from "appwrite";
import { useCallback, useEffect, useState } from "react";

type AuthState = "signed-in" | "signed-out";
type SessionCheckState = "pending" | "done";
export type ServerGate = "idle" | "ok" | "error";

const SESSION_CHECK_TIMEOUT_MS = 15_000;
const SESSION_CHECK_UI_CLEAR_MS = 4_000;

export function useAdminSession() {
  const [auth, setAuth] = useState<AuthState>("signed-out");
  const [sessionCheck, setSessionCheck] = useState<SessionCheckState>("pending");
  const [serverGate, setServerGate] = useState<ServerGate>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          "Could not reach Appwrite in time. Check Wi-Fi or cellular data, VPN/ad blockers, and that your Appwrite endpoint is reachable from this device.",
        );
        setAuth("signed-out");
        return;
      }
      setAuth("signed-in");
    } catch (err) {
      if (err instanceof AppwriteException && err.code === 401) {
        setAuth("signed-out");
        return;
      }
      if (err instanceof AppwriteException) {
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

  const login = useCallback(async () => {
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
  }, [email, password, refreshSession]);

  const logout = useCallback(async () => {
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
  }, []);

  return {
    auth,
    sessionCheck,
    serverGate,
    email,
    setEmail,
    password,
    setPassword,
    error,
    bootstrapError,
    submitting,
    login,
    logout,
  };
}
