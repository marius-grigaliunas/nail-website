export function AdminSidebar({
  adminPanel,
  onUploadClick,
  onGalleryClick,
  onLogoutClick,
  submitting,
}: {
  adminPanel: "home" | "upload" | "gallery";
  onUploadClick: () => void;
  onGalleryClick: () => void;
  onLogoutClick: () => void;
  submitting: boolean;
}) {
  return (
    <aside
      className="flex h-fit w-full shrink-0 flex-col border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950/50 md:w-56 md:border-b-0 md:border-r"
      aria-label="Admin tools"
    >
      <div className="border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Tools
        </p>
      </div>
      <nav className="flex flex-row gap-2 overflow-x-auto p-3 md:flex-col md:gap-1">
        <button
          type="button"
          onClick={onUploadClick}
          className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
            adminPanel === "upload"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-700 hover:bg-neutral-200/80 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={onGalleryClick}
          className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
            adminPanel === "gallery"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-700 hover:bg-neutral-200/80 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          Gallery
        </button>
        <button
          type="button"
          onClick={onLogoutClick}
          disabled={submitting}
          className="shrink-0 rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-200/80 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 md:mt-4"
        >
          {submitting ? "Signing out…" : "Log out"}
        </button>
      </nav>
    </aside>
  );
}
