import { AdminBadge } from "@/app/_components/site-navbar/admin-badge.client";
import Link from "next/link";

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 dark:border-neutral-800">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground hover:opacity-90"
        >
          Elena&apos;s Nail Studio
        </Link>
        <AdminBadge />
      </div>
    </header>
  );
}
