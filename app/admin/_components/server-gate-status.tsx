import type { ServerGate } from "../_hooks/use-admin-session";

export function ServerGateStatus({ serverGate }: { serverGate: ServerGate }) {
  if (serverGate === "ok") {
    return (
      <p className="mt-2 text-sm text-green-700 dark:text-green-400">
        Server verified your session (JWT to /api/admin/me).
      </p>
    );
  }
  if (serverGate === "error") {
    return (
      <p className="mt-2 text-sm text-amber-700 dark:text-amber-400" role="status">
        Could not verify server JWT. Check the network tab and Appwrite project settings.
      </p>
    );
  }
  return <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Checking server…</p>;
}
