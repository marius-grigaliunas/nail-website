"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-base font-medium">Admin page failed to load.</p>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Retry
      </button>
    </div>
  );
}
