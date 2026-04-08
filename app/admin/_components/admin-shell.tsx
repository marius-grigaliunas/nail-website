import type { ReactNode } from "react";
import { ServerGateStatus } from "./server-gate-status";

export function AdminShell({
  serverGate,
  adminPanel,
  uploadView,
}: {
  serverGate: "idle" | "ok" | "error";
  adminPanel: "home" | "upload";
  uploadView: ReactNode;
}) {
  return (
    <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <ServerGateStatus serverGate={serverGate} />

        {adminPanel === "home" ? (
          <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-400">
            Open navigation and choose{" "}
            <span className="font-medium text-neutral-800 dark:text-neutral-200">Admin panel - Upload</span>{" "}
            to add nail designs.
          </p>
        ) : (
          uploadView
        )}
      </div>
    </main>
  );
}
