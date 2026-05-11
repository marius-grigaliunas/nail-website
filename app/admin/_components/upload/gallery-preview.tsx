export function GalleryPreview({
  galleryFiles,
  galleryPreviewUrls,
  onRemove,
}: {
  galleryFiles: File[];
  galleryPreviewUrls: string[];
  onRemove: (index: number) => void;
}) {
  if (galleryFiles.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium">Preview</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {galleryFiles.map((file, index) => (
          <li
            key={`g-${file.name}-${file.size}`}
            className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={galleryPreviewUrls[index]} alt="" className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
            >
              Remove
            </button>
            <p className="truncate px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400">{file.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
