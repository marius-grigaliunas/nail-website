import type { ReactNode } from "react";
import { ServerGateStatus } from "./server-gate-status";

export function AdminShell({
  serverGate,
  adminPanel,
  uploadView,
  galleryView,
}: {
  serverGate: "idle" | "ok" | "error";
  adminPanel: "home" | "upload" | "gallery";
  uploadView: ReactNode;
  galleryView: ReactNode;
}) {
  const contentWidthClass =
    adminPanel === "gallery" ? "mx-auto w-full max-w-5xl" : "mx-auto max-w-2xl";

  return (
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
      <div className={contentWidthClass}>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <ServerGateStatus serverGate={serverGate} />

        {adminPanel === "home" ? (
          <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-400">
            Use{" "}
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Upload</span> to add
            nail designs, or{" "}
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Gallery</span> to
            review, edit, and delete existing designs.
          </p>
        ) : adminPanel === "gallery" ? (
          <>
            <h2 className="mt-8 text-lg font-medium text-neutral-900 dark:text-neutral-100">Gallery</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              All uploaded designs. Edit details or images, and delete only when a design should be
              removed from Cloudinary and Appwrite.
            </p>
            {galleryView}
          </>
        ) : (
          uploadView
        )}
      </div>
    </main>
  );
}
