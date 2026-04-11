"use client";

import { uploadNailDesignFileWithThumbnail } from "@/lib/appwrite";
import { type NailShape } from "@/lib/designInterface";
import { fetchWithAppwriteJwt } from "@/lib/fetch-with-appwrite-jwt";
import { useRef, useState } from "react";

export function useUploadForm() {
  const [designName, setDesignName] = useState("");
  const [shape, setShape] = useState<NailShape>("round");
  const [priceInput, setPriceInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submittingRef = useRef(false);

  const submit = async ({
    galleryFiles,
    resolvedTags,
    onSuccess,
  }: {
    galleryFiles: File[];
    resolvedTags: string[];
    onSuccess: () => void;
  }) => {
    if (submittingRef.current) return;
    const name = designName.trim();
    if (!name || galleryFiles.length === 0) return;

    const priceTrimmed = priceInput.trim();
    let price: number | undefined;
    if (priceTrimmed !== "") {
      const n = Number.parseFloat(priceTrimmed.replace(",", "."));
      if (Number.isNaN(n) || n < 0) return;
      price = n;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const pairs = await Promise.all(
        galleryFiles.map((file) => uploadNailDesignFileWithThumbnail(file)),
      );
      const image_urls = pairs.map((p) => p.image.secureUrl);
      const thumbnail_urls = pairs.map((p) => p.thumbnail.secureUrl);

      const saveRes = await fetchWithAppwriteJwt("/api/admin/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shape,
          tags: resolvedTags,
          image_urls,
          thumbnail_urls,
          ...(price !== undefined ? { price } : {}),
        }),
      });
      if (!saveRes.ok) {
        const body = (await saveRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Could not save design (${saveRes.status})`);
      }

      onSuccess();
      setSubmitSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the design.";
      setSubmitError(message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDesignName("");
    setShape("round");
    setPriceInput("");
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return {
    designName,
    setDesignName,
    shape,
    setShape,
    priceInput,
    setPriceInput,
    submitting,
    submitError,
    submitSuccess,
    submit,
    reset,
  };
}
