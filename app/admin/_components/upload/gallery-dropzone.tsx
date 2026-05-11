import type { RefObject } from "react";

export function GalleryDropzone({
  dragGallery,
  galleryInputRef,
  onDragGalleryChange,
  onAddGalleryFromList,
}: {
  dragGallery: boolean;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  onDragGalleryChange: (active: boolean) => void;
  onAddGalleryFromList: (list: FileList | File[]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">
        Images <span className="text-red-600 dark:text-red-400">*</span>
      </label>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Images upload to Cloudinary when you choose <span className="font-medium">Upload design</span> (preset
        &quot;nail design&quot;), then a row is created in Appwrite.
      </p>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="Choose images"
        onChange={(e) => {
          const list = e.target.files;
          if (list?.length) onAddGalleryFromList(list);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            galleryInputRef.current?.click();
          }
        }}
        onClick={() => galleryInputRef.current?.click()}
        onDragEnter={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onDragGalleryChange(true);
        }}
        onDragOver={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        }}
        onDragLeave={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!ev.currentTarget.contains(ev.relatedTarget as Node)) onDragGalleryChange(false);
        }}
        onDrop={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          onDragGalleryChange(false);
          if (ev.dataTransfer.files?.length) onAddGalleryFromList(ev.dataTransfer.files);
        }}
        className={`mt-3 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
          dragGallery
            ? "border-neutral-500 bg-neutral-100 dark:border-neutral-400 dark:bg-neutral-900"
            : "border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900/30 dark:hover:border-neutral-500"
        }`}
      >
        Drop images here or click to select
      </div>
    </div>
  );
}
