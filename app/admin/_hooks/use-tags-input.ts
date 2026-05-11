"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";

export function useTagsInput() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  const commitTagFromDraft = () => {
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
  };

  const tagsForSubmit = (): string[] => {
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
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTagFromDraft();
    }
    if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const reset = () => {
    setTags([]);
    setTagDraft("");
  };

  return {
    tags,
    tagDraft,
    setTagDraft,
    commitTagFromDraft,
    tagsForSubmit,
    removeTag,
    handleTagKeyDown,
    reset,
  };
}
