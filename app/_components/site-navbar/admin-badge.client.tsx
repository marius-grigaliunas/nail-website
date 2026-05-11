"use client";

import { account } from "@/lib/appwrite";
import type { Models } from "appwrite";
import { useEffect, useState } from "react";

function displayUsername(user: Models.User): string {
  const name = user.name?.trim();
  if (name) return name;
  const email = user.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    return local && local.length > 0 ? local : email;
  }
  return "Admin";
}

function isGuestUser(user: Models.User, session: Models.Session | null): boolean {
  if (user.labels?.includes("guest")) return true;
  if (session?.provider === "anonymous") return true;
  return false;
}

export function AdminBadge() {
  const [adminLabel, setAdminLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await account.get();
        let session: Models.Session | null = null;
        try {
          session = await account.getSession({ sessionId: "current" });
        } catch {
          session = null;
        }
        if (cancelled) return;
        if (!isGuestUser(user, session)) {
          setAdminLabel(`admin - ${displayUsername(user)}`);
        } else {
          setAdminLabel(null);
        }
      } catch {
        if (!cancelled) setAdminLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!adminLabel) return null;
  return <span className="text-sm text-neutral-600 dark:text-neutral-400">{adminLabel}</span>;
}
