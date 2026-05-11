export function UploadSubmitActions({
  submitting,
  disabled,
  onClear,
}: {
  submitting: boolean;
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
      >
        {submitting ? "Uploading…" : "Upload design"}
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={submitting}
        className="text-sm text-neutral-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-neutral-400"
      >
        Clear form
      </button>
    </div>
  );
}
