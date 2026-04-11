"use client";

import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import type { Design } from "@/lib/designInterface";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function AdminGallery() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDesigns = useCallback(async () => {
    setListError(null);
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

  if (loading) {
    return <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">Loading designs…</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {listError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {listError}
        </p>
      ) : null}

      {designs.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">No designs yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {designs.map((design) => {
            const preview = design.display_urls[0];
            return (
              <li
                key={design.$id}
                className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                  {preview ? (
                    <Image
                      src={preview}
                      alt={design.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-neutral-400">
                      No image
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{design.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {design.shape} · {design.image_urls.length} image
                    {design.image_urls.length === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDelete(design)}
                    disabled={deletingId === design.$id}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {deletingId === design.$id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
