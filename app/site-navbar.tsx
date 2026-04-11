"use client";

import { useEffect, useState } from "react";
import { AdminBadge } from "@/app/_components/site-navbar/admin-badge.client";
import { account } from "@/lib/appwrite";
import type { Models } from "appwrite";
import Link from "next/link";
import { useRouter } from "next/navigation";

function isGuestUser(user: Models.User, session: Models.Session | null): boolean {
  if (user.labels?.includes("guest")) return true;
  if (session?.provider === "anonymous") return true;
  return false;
}

export function SiteNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

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
        setCanAccessAdmin(!isGuestUser(user, session));
      } catch {
        if (!cancelled) setCanAccessAdmin(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdminLogout() {
    setIsLoggingOut(true);
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Session may already be invalid; still treat as signed out in UI.
    } finally {
      setCanAccessAdmin(false);
      setIsLoggingOut(false);
      setIsOpen(false);
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 dark:border-neutral-800">
        <div className="relative h-14">
          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-drawer-nav"
            onClick={() => setIsOpen((prev) => !prev)}
            className="absolute left-1 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md border border-neutral-300 text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 sm:left-2"
          >
            <span className="sr-only">Toggle navigation menu</span>
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-5 bg-current transition ${
                  isOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] block h-0.5 w-5 bg-current transition ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] block h-0.5 w-5 bg-current transition ${
                  isOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 pl-8">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="text-base font-semibold tracking-tight text-foreground hover:opacity-90"
              >
                Elena&apos;s Nail Studio
              </Link>
            </div>
            <AdminBadge />
          </div>
        </div>
      </header>

      <div className="h-14" />

      <div
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      <aside
        id="mobile-drawer-nav"
        className={`fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] border-r border-neutral-200 bg-background p-5 shadow-2xl transition-transform duration-200 dark:border-neutral-800 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-muted-foreground">
            Navigation
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md p-2 text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Home
          </Link>
          {canAccessAdmin ? (
            <div className="flex flex-col gap-1">
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Admin panel
              </Link>
              <Link
                href="/admin?panel=upload"
                onClick={() => setIsOpen(false)}
                className="ml-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Upload
              </Link>
              <Link
                href="/admin?panel=gallery"
                onClick={() => setIsOpen(false)}
                className="ml-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Gallery
              </Link>
              <button
                type="button"
                onClick={() => void handleAdminLogout()}
                disabled={isLoggingOut}
                className="ml-3 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-neutral-100 disabled:opacity-60 dark:hover:bg-neutral-800"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          ) : null}
        </nav>
      </aside>
    </>
  );
}
