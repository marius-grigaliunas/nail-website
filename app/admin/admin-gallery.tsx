"use client";

import { GalleryDropzone } from "./_components/upload/gallery-dropzone";
import { GalleryPreview } from "./_components/upload/gallery-preview";
import { UploadBasicFields } from "./_components/upload/basic-fields";
import { useGalleryDropzone } from "./_hooks/use-gallery-dropzone";
import { uploadNailDesignFileWithThumbnail } from "@/lib/appwrite";
import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import type { Design, NailShape } from "@/lib/designInterface";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type ExistingImage = {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
};

function designExistingImages(design: Design): ExistingImage[] {
  return design.image_urls.map((imageUrl, index) => ({
    id: `${design.$id}-${index}-${imageUrl}`,
    imageUrl,
    thumbnailUrl: design.thumbnail_urls?.[index],
  }));
}

function formatPrice(price?: number) {
  if (price === undefined) return "No price";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function tagListForSubmit(tags: string[], draft: string) {
  const rawDraft = draft.trim().replace(/^#/, "");
  const fromDraft = rawDraft
    ? rawDraft
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...tags, ...fromDraft]) {
    const cleaned = tag.trim().replace(/^#/, "");
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(cleaned);
    }
  }
  return out;
}

function TagEditor({
  tags,
  tagDraft,
  onTagsChange,
  onTagDraftChange,
}: {
  tags: string[];
  tagDraft: string;
  onTagsChange: (tags: string[]) => void;
  onTagDraftChange: (value: string) => void;
}) {
  const commitDraft = () => {
    const next = tagListForSubmit(tags, tagDraft);
    if (next.length === tags.length && tagDraft.trim() === "") return;
    onTagsChange(next);
    onTagDraftChange("");
  };

  return (
    <div>
      <label htmlFor="edit-tags" className="block text-sm font-medium">
        Tags
      </label>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Press Enter or comma to add tags. Tags help future gallery filters.
      </p>
      <div className="mt-3 flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
            className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-red-950/50 dark:hover:text-red-200"
            aria-label={`Remove ${tag} tag`}
          >
            #{tag}
          </button>
        ))}
        <input
          id="edit-tags"
          type="text"
          value={tagDraft}
          onChange={(e) => onTagDraftChange(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
              onTagsChange(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length === 0 ? "minimalist, floral, seasonal" : "Add tag"}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function EditDesignPanel({
  design,
  onCancel,
  onSaved,
}: {
  design: Design;
  onCancel: () => void;
  onSaved: (design: Design, warning?: string) => void;
}) {
  const gallery = useGalleryDropzone();
  const [designName, setDesignName] = useState(design.name);
  const [shape, setShape] = useState<NailShape>(design.shape);
  const [priceInput, setPriceInput] = useState(
    design.price === undefined ? "" : String(design.price),
  );
  const [tags, setTags] = useState(design.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [existingImages, setExistingImages] = useState(() => designExistingImages(design));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDesignName(design.name);
    setShape(design.shape);
    setPriceInput(design.price === undefined ? "" : String(design.price));
    setTags(design.tags);
    setTagDraft("");
    setExistingImages(designExistingImages(design));
    setError(null);
    gallery.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  const imageCount = existingImages.length + gallery.galleryFiles.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const name = designName.trim();
    if (!name) {
      setError("Name is required.");
      return;
    }
    if (imageCount === 0) {
      setError("Keep or add at least one image.");
      return;
    }

    const priceTrimmed = priceInput.trim();
    let price: number | undefined;
    if (priceTrimmed !== "") {
      const parsedPrice = Number.parseFloat(priceTrimmed.replace(",", "."));
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        setError("Price must be a positive number or left blank.");
        return;
      }
      price = parsedPrice;
    }

    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await Promise.all(
        gallery.galleryFiles.map((file) => uploadNailDesignFileWithThumbnail(file)),
      );
      const image_urls = [
        ...existingImages.map((image) => image.imageUrl),
        ...uploaded.map((pair) => pair.image.secureUrl),
      ];
      const thumbnail_urls = [
        ...existingImages.map((image) => image.thumbnailUrl ?? image.imageUrl),
        ...uploaded.map((pair) => pair.thumbnail.secureUrl),
      ];

      const res = await fetchWithAppwriteJwt(
        `/api/admin/designs/${encodeURIComponent(design.$id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            shape,
            tags: tagListForSubmit(tags, tagDraft),
            image_urls,
            thumbnail_urls,
            ...(price !== undefined ? { price } : {}),
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as
        | { design?: Design; cleanupWarning?: string; error?: string }
        | null;
      if (!res.ok || !body?.design) {
        throw new Error(body?.error ?? `Could not update design (${res.status})`);
      }
      onSaved(body.design, body.cleanupWarning);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update design.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-design-title"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:max-w-3xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Edit design
            </p>
            <h3
              id="edit-design-title"
              className="mt-1 text-xl font-semibold text-neutral-950 dark:text-neutral-50"
            >
              {design.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-7">
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </p>
          ) : null}

          <UploadBasicFields
            designName={designName}
            shape={shape}
            priceInput={priceInput}
            onNameChange={setDesignName}
            onShapeChange={setShape}
            onPriceChange={setPriceInput}
          />

          <div>
            <p className="text-sm font-medium">Current images</p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {existingImages.map((image) => (
                <li
                  key={image.id}
                  className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={image.thumbnailUrl ?? image.imageUrl}
                      alt={`${design.name} preview`}
                      fill
                      sizes="(max-width: 640px) 50vw, 180px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExistingImages((prev) => prev.filter((x) => x.id !== image.id))
                    }
                    disabled={submitting}
                    className="absolute right-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white opacity-100 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {existingImages.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                All current images are marked for removal. Add a new image before saving.
              </p>
            ) : null}
          </div>

          <GalleryDropzone
            dragGallery={gallery.dragGallery}
            galleryInputRef={gallery.galleryInputRef}
            onDragGalleryChange={gallery.setDragGallery}
            onAddGalleryFromList={gallery.addGalleryFromList}
          />
          <GalleryPreview
            galleryFiles={gallery.galleryFiles}
            galleryPreviewUrls={gallery.galleryPreviewUrls}
            onRemove={gallery.removeGalleryAt}
          />

          <TagEditor
            tags={tags}
            tagDraft={tagDraft}
            onTagsChange={setTags}
            onTagDraftChange={setTagDraft}
          />

          <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 sm:-mx-6 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || imageCount === 0 || !designName.trim()}
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminGallery() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const totalImages = useMemo(
    () => designs.reduce((sum, design) => sum + design.image_urls.length, 0),
    [designs],
  );

  const loadDesigns = useCallback(async () => {
    setListError(null);
    setListNotice(null);
    setLoading(true);
    try {
      const res = await fetchWithAppwriteJwt("/api/admin/designs");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setListError(body?.error ?? `Could not load designs (${res.status})`);
        setDesigns([]);
        return;
      }
      const data = (await res.json()) as { designs?: Design[] };
      setDesigns(Array.isArray(data.designs) ? data.designs : []);
    } catch {
      setListError("Could not load designs.");
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDesigns();
  }, [loadDesigns]);

  async function handleDelete(design: Design) {
    const ok = window.confirm(
      `Delete design “${design.name}”? This removes Cloudinary images and the database row.`,
    );
    if (!ok) return;

    setDeletingId(design.$id);
    setListError(null);
    try {
      const res = await fetchWithAppwriteJwt(`/api/admin/designs/${encodeURIComponent(design.$id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setListError(body?.error ?? `Delete failed (${res.status})`);
        return;
      }
      setDesigns((prev) => prev.filter((d) => d.$id !== design.$id));
    } catch {
      setListError("Delete request failed.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(design: Design, warning?: string) {
    setDesigns((prev) => prev.map((item) => (item.$id === design.$id ? design : item)));
    setEditingDesign(null);
    setListNotice(warning ?? "Design updated.");
  }

  if (loading) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="min-h-48 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {editingDesign ? (
        <EditDesignPanel
          design={editingDesign}
          onCancel={() => setEditingDesign(null)}
          onSaved={handleSaved}
        />
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-linear-to-br from-white to-neutral-50 p-4 dark:border-neutral-800 dark:from-neutral-950 dark:to-neutral-900/60 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Portfolio library
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
              {designs.length} design{designs.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
            {totalImages} image{totalImages === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {listError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {listError}
        </p>
      ) : null}
      {listNotice ? (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
        >
          {listNotice}
        </p>
      ) : null}

      {designs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-950">
          <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            No designs yet
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Upload the first nail set, then it will appear here for editing and preview.
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((design) => {
            const preview = design.display_urls[0];
            return (
              <li
                key={design.$id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="relative aspect-4/3 bg-neutral-100 dark:bg-neutral-900">
                  {preview ? (
                    <Image
                      src={preview}
                      alt={design.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 340px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-neutral-400">
                      No image
                    </span>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-neutral-900 shadow-sm backdrop-blur dark:bg-neutral-950/85 dark:text-neutral-100">
                    {design.shape}
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-950 dark:text-neutral-50">
                        {design.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Updated {formatDate(design.$updatedAt)}
                      </p>
                    </div>
                    <p className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                      {formatPrice(design.price)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                      {design.image_urls.length} image{design.image_urls.length === 1 ? "" : "s"}
                    </span>
                    {design.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700 dark:bg-pink-950/30 dark:text-pink-200"
                      >
                        #{tag}
                      </span>
                    ))}
                    {design.tags.length > 4 ? (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                        +{design.tags.length - 4}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setListError(null);
                        setListNotice(null);
                        setEditingDesign(design);
                      }}
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(design)}
                      disabled={deletingId === design.$id}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      {deletingId === design.$id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
