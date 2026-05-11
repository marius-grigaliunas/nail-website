"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function useObjectUrls(files: File[]) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [urls]);
  return urls;
}

export function useGalleryDropzone() {
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [dragGallery, setDragGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const galleryPreviewUrls = useObjectUrls(galleryFiles);

  const addGalleryFromList = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    setGalleryFiles((prev) => mergeImageFiles(prev, incoming));
  };

  const removeGalleryAt = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setGalleryFiles([]);
    setDragGallery(false);
  };

  return {
    galleryFiles,
    dragGallery,
    setDragGallery,
    galleryInputRef,
    galleryPreviewUrls,
    addGalleryFromList,
    removeGalleryAt,
    reset,
  };
}
