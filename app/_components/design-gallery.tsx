"use client";

import type { Design } from "@/lib/designInterface";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CARD_ROTATION_MS = 10_000;

type GalleryImage = {
  fullUrl: string;
  previewUrl: string;
};

type OpenViewer = {
  design: Design;
  imageIndex: number;
};

function cloudinaryOptimizedUrl(url: string, transformation: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}

function cardImageUrl(url: string) {
  return cloudinaryOptimizedUrl(url, "f_auto,q_auto:low");
}

function viewerImageUrl(url: string) {
  return cloudinaryOptimizedUrl(url, "f_auto,q_auto:good");
}

function imagesForDesign(design: Design): GalleryImage[] {
  return design.image_urls.map((fullUrl, index) => ({
    fullUrl,
    previewUrl: design.display_urls[index] ?? design.thumbnail_urls?.[index] ?? fullUrl,
  }));
}

function clampIndex(index: number, count: number) {
  if (count === 0) return 0;
  return ((index % count) + count) % count;
}

function formatShape(shape: Design["shape"]) {
  return shape.replace("-", " ");
}

function adjacentIndexes(activeIndex: number, count: number) {
  if (count <= 1) return [];
  const indexes = new Set<number>([
    clampIndex(activeIndex - 1, count),
    clampIndex(activeIndex + 1, count),
  ]);
  indexes.delete(activeIndex);
  return Array.from(indexes);
}

function DesignCard({
  design,
  eager,
  modalOpen,
  onOpen,
}: {
  design: Design;
  eager: boolean;
  modalOpen: boolean;
  onOpen: (design: Design, imageIndex: number) => void;
}) {
  const images = useMemo(() => imagesForDesign(design), [design]);
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMultipleImages = images.length > 1;
  const activeIndex = clampIndex(rawActiveIndex, images.length);
  const activeImage = images[activeIndex];
  const preloadIndexes = adjacentIndexes(activeIndex, images.length);

  useEffect(() => {
    if (!hasMultipleImages || isPaused || modalOpen) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setActiveIndex((current) => clampIndex(current + 1, images.length));
    }, CARD_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [hasMultipleImages, images.length, isPaused, modalOpen]);

  if (!activeImage) return null;

  const move = (step: number) => {
    setActiveIndex((current) => clampIndex(current + step, images.length));
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div
        className="relative aspect-4/3 bg-zinc-100 dark:bg-zinc-900"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <button
          type="button"
          onClick={() => onOpen(design, activeIndex)}
          className="relative block h-full w-full overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-400"
          aria-label={`Open ${design.name} gallery`}
        >
          <Image
            src={cardImageUrl(activeImage.previewUrl)}
            alt={`${design.name} nail design`}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {activeIndex + 1}/{images.length}
          </span>
        </button>

        {preloadIndexes.map((index) => (
          <Image
            key={`preload-card-${design.$id}-${index}`}
            src={cardImageUrl(images[index].previewUrl)}
            alt=""
            fill
            aria-hidden="true"
            className="pointer-events-none opacity-0"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            loading="eager"
          />
        ))}

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                move(-1);
              }}
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-semibold text-zinc-900 shadow-sm opacity-100 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:bg-zinc-950/85 dark:text-zinc-100"
              aria-label={`Show previous photo for ${design.name}`}
            >
              {"<"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                move(1);
              }}
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-semibold text-zinc-900 shadow-sm opacity-100 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:bg-zinc-950/85 dark:text-zinc-100"
              aria-label={`Show next photo for ${design.name}`}
            >
              {">"}
            </button>
          </>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">{design.name}</h2>
          <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
            {formatShape(design.shape)}
          </p>
        </div>

        {design.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {design.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

function GalleryViewer({
  viewer,
  onClose,
}: {
  viewer: OpenViewer;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const images = useMemo(() => imagesForDesign(viewer.design), [viewer.design]);
  const [rawActiveIndex, setActiveIndex] = useState(() =>
    clampIndex(viewer.imageIndex, images.length),
  );
  const activeIndex = clampIndex(rawActiveIndex, images.length);
  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;
  const preloadIndexes = adjacentIndexes(activeIndex, images.length);

  const move = useCallback(
    (step: number) => {
      setActiveIndex((current) => clampIndex(current + step, images.length));
    },
    [images.length],
  );

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, onClose]);

  if (!activeImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/90 p-3 text-white sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-viewer-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-300">
              {activeIndex + 1} of {images.length}
            </p>
            <h2 id="gallery-viewer-title" className="mt-1 text-lg font-semibold sm:text-xl">
              {viewer.design.name}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Close
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
          <Image
            src={viewerImageUrl(activeImage.fullUrl)}
            alt={`${viewer.design.name} nail design photo ${activeIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            loading="eager"
          />

          {preloadIndexes.map((index) => (
            <Image
              key={`preload-viewer-${viewer.design.$id}-${index}`}
              src={viewerImageUrl(images[index].fullUrl)}
              alt=""
              fill
              aria-hidden="true"
              className="pointer-events-none opacity-0"
              sizes="100vw"
              loading="eager"
            />
          ))}

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white sm:left-4 sm:size-12"
                aria-label="Show previous photo"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl font-semibold backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white sm:right-4 sm:size-12"
                aria-label="Show next photo"
              >
                {">"}
              </button>
            </>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${viewer.design.$id}-${image.previewUrl}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-white sm:h-20 sm:w-20 ${
                  index === activeIndex
                    ? "border-white"
                    : "border-white/20 opacity-70 hover:border-white/70 hover:opacity-100"
                }`}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <Image
                  src={cardImageUrl(image.previewUrl)}
                  alt={`${viewer.design.name} preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DesignGallery({ designs }: { designs: Design[] }) {
  const [viewer, setViewer] = useState<OpenViewer | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const visibleDesigns = useMemo(
    () => designs.filter((design) => imagesForDesign(design).length > 0),
    [designs],
  );

  function openViewer(design: Design, imageIndex: number) {
    lastTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setViewer({ design, imageIndex });
  }

  function closeViewer() {
    setViewer(null);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  if (visibleDesigns.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
        No designs to show yet. Add designs in the admin area, and allow public read on your
        designs table in Appwrite so the gallery can list rows without signing in.
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDesigns.map((design, index) => (
          <li key={design.$id}>
            <DesignCard
              design={design}
              eager={index === 0}
              modalOpen={viewer !== null}
              onOpen={openViewer}
            />
          </li>
        ))}
      </ul>

      {viewer ? (
        <GalleryViewer
          key={`${viewer.design.$id}-${viewer.imageIndex}`}
          viewer={viewer}
          onClose={closeViewer}
        />
      ) : null}
    </>
  );
}
