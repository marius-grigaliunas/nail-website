import { describe, expect, it } from "vitest";
import { rowToDesign } from "./mappers";

describe("rowToDesign", () => {
  it("prefers thumbnail urls for display urls", () => {
    const out = rowToDesign({
      $id: "1",
      $createdAt: "2026-01-01",
      $updatedAt: "2026-01-01",
      name: "Test",
      shape: "round",
      tags: ["a"],
      image_urls: ["full-1"],
      thumbnail_urls: ["thumb-1"],
    } as never);

    expect(out.display_urls).toEqual(["thumb-1"]);
  });

  it("falls back to image urls when thumbnails are missing", () => {
    const out = rowToDesign({
      $id: "1",
      $createdAt: "2026-01-01",
      $updatedAt: "2026-01-01",
      name: "Test",
      shape: "round",
      tags: ["a"],
      image_urls: ["full-1"],
    } as never);

    expect(out.display_urls).toEqual(["full-1"]);
  });

  it("normalizes malformed rows", () => {
    const out = rowToDesign({
      $id: "1",
      $createdAt: "2026-01-01",
      $updatedAt: "2026-01-01",
      shape: "unknown",
      image_urls: "[]",
      tags: "not-json",
    } as never);

    expect(out.name).toBe("Untitled");
    expect(out.shape).toBe("round");
    expect(out.tags).toEqual([]);
    expect(out.image_urls).toEqual([]);
    expect(out.display_urls).toEqual([]);
  });
});
