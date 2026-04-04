"use client";

import { account } from "@/lib/appwrite";
import type { Models } from "appwrite";
import Link from "next/link";
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

export function SiteNavbar() {
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

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 dark:border-neutral-800">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground hover:opacity-90"
        >
          Elena&apos;s Nail Studio
        </Link>
        {adminLabel ? (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">{adminLabel}</span>
        ) : null}
      </div>
    </header>
  );
}
