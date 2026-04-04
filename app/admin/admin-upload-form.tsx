"use client";

import {
  createDesignDocument,
  uploadNailDesignFileToCloudinary,
} from "@/lib/appwrite";
import { NAIL_SHAPES, type NailShape } from "@/lib/designInterface";
import { AppwriteException } from "appwrite";
import { useEffect, useMemo, useRef, useState } from "react";

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [urls]);
  return urls;
}

function mergeImageFiles(prev: File[], incoming: File[]) {
  const next = [...prev, ...incoming.filter((f) => f.type.startsWith("image/"))];
  const seen = new Set<string>();
  return next.filter((f) => {
    const key = `${f.name}-${f.size}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function AdminUploadForm() {
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [designName, setDesignName] = useState("");
  const [shape, setShape] = useState<NailShape>("round");
  const [priceInput, setPriceInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [dragGallery, setDragGallery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const galleryPreviewUrls = useObjectUrls(galleryFiles);

  function addGalleryFromList(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    setGalleryFiles((prev) => mergeImageFiles(prev, incoming));
  }

  function removeGalleryAt(index: number) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function commitTagFromDraft() {
    const raw = tagDraft.trim().replace(/^#/, "");
    if (!raw) return;
    const parts = raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => {
      const seen = new Set(prev.map((t) => t.toLowerCase()));
      const out = [...prev];
      for (const p of parts) {
        const k = p.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          out.push(p);
        }
      }
      return out;
    });
    setTagDraft("");
  }

  /** Include draft field so a tag typed but not blurred is saved on submit */
  function tagsForSubmit(): string[] {
    const raw = tagDraft.trim().replace(/^#/, "");
    const fromDraft = raw
      ? raw
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const seen = new Set(tags.map((t) => t.toLowerCase()));
    const out = [...tags];
    for (const p of fromDraft) {
      const k = p.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(p);
      }
    }
    return out;
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTagFromDraft();
    }
    if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function handleUploadFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = designName.trim();
    if (!name || galleryFiles.length === 0) return;

    const priceTrimmed = priceInput.trim();
    let price: number | undefined;
    if (priceTrimmed !== "") {
      const n = Number.parseFloat(priceTrimmed.replace(",", "."));
      if (Number.isNaN(n) || n < 0) return;
      price = n;
    }

    const resolvedTags = tagsForSubmit();

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const assets = await Promise.all(
        galleryFiles.map((file) => uploadNailDesignFileToCloudinary(file)),
      );
      const image_urls = assets.map((a) => a.secureUrl);

      await createDesignDocument({
        name,
        shape,
        tags: resolvedTags,
        image_urls,
        ...(price !== undefined ? { price } : {}),
      });

      resetFormFields();
      setSubmitSuccess(true);
    } catch (err) {
      const message =
        err instanceof AppwriteException
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong while saving the design.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetFormFields() {
    setGalleryFiles([]);
    setDesignName("");
    setShape("round");
    setPriceInput("");
    setTags([]);
    setTagDraft("");
  }

  function clearForm() {
    resetFormFields();
    setSubmitSuccess(false);
    setSubmitError(null);
  }

  return (
    <form onSubmit={(e) => void handleUploadFormSubmit(e)} className="mt-8 space-y-8">
      {submitError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {submitError}
        </p>
      ) : null}
      {submitSuccess ? (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          Design saved to the database.
        </p>
      ) : null}

      <div>
        <label htmlFor="design-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="design-name"
          name="name"
          type="text"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="e.g. Snowy Mountains"
          required
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
        />
      </div>

      <div>
        <label htmlFor="design-shape" className="block text-sm font-medium">
          Nail shape
        </label>
        <select
          id="design-shape"
          name="shape"
          value={shape}
          onChange={(e) => setShape(e.target.value as NailShape)}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {NAIL_SHAPES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="design-price" className="block text-sm font-medium">
          Price <span className="font-normal text-neutral-500 dark:text-neutral-400">(optional)</span>
        </label>
        <input
          id="design-price"
          name="price"
          type="text"
          inputMode="decimal"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          placeholder="e.g. 45 or 45.00"
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
        />
      </div>

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
            if (list?.length) addGalleryFromList(list);
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
            setDragGallery(true);
          }}
          onDragOver={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
          }}
          onDragLeave={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (!ev.currentTarget.contains(ev.relatedTarget as Node)) setDragGallery(false);
          }}
          onDrop={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            setDragGallery(false);
            if (ev.dataTransfer.files?.length) addGalleryFromList(ev.dataTransfer.files);
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

      {galleryFiles.length > 0 ? (
        <div>
          <p className="text-sm font-medium">Preview</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleryFiles.map((file, index) => (
              <li
                key={`g-${file.name}-${file.size}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryPreviewUrls[index]}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeGalleryAt(index)}
                  className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  Remove
                </button>
                <p className="truncate px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400">{file.name}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <label htmlFor="design-tags" className="block text-sm font-medium">
          Tags
        </label>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Type a tag and press Enter or comma. Use semicolons for several at once.
        </p>
        <div className="mt-2 flex min-h-[42px] flex-wrap gap-2 rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-600">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="design-tags"
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => commitTagFromDraft()}
            placeholder={"Add tag…"}
            className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting || galleryFiles.length === 0 || !designName.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {submitting ? "Uploading…" : "Upload design"}
        </button>
        <button
          type="button"
          onClick={clearForm}
          disabled={submitting}
          className="text-sm text-neutral-600 underline-offset-2 hover:underline disabled:opacity-50 dark:text-neutral-400"
        >
          Clear form
        </button>
      </div>
    </form>
  );
}
