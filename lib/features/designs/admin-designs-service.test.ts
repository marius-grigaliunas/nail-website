import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadService() {
  vi.resetModules();
  vi.doMock("@/lib/config/env", () => ({
    appwriteDatabaseId: "db",
    appwriteDesignsTableId: "designs",
    cloudinaryCloudName: "demo",
    hasCloudinaryDestroyConfig: () => true,
  }));
  return import("./admin-designs-service");
}

describe("admin design payload parsing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes editable design fields", async () => {
    const { parseAdminDesignUpdateBody } = await loadService();

    const parsed = parseAdminDesignUpdateBody({
      name: "  Spring Set  ",
      shape: "almond",
      tags: [" floral ", "#Floral", "", "pink"],
      price: 45,
      image_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/spring.webp"],
      thumbnail_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/spring-thumb.webp"],
    });

    expect(parsed).toEqual({
      ok: true,
      data: {
        name: "Spring Set",
        shape: "almond",
        tags: ["floral", "pink"],
        price: 45,
        image_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/spring.webp"],
        thumbnail_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/spring-thumb.webp"],
      },
    });
  });

  it("rejects media URLs from another Cloudinary cloud", async () => {
    const { parseAdminDesignCreateBody } = await loadService();

    const parsed = parseAdminDesignCreateBody({
      name: "Bad URL",
      shape: "round",
      tags: [],
      image_urls: ["https://res.cloudinary.com/other/image/upload/v1/nails/a.webp"],
    });

    expect(parsed).toEqual({
      ok: false,
      error: "image_urls must only include this site's Cloudinary image URLs",
    });
  });

  it("requires thumbnail and image arrays to stay aligned", async () => {
    const { parseAdminDesignUpdateBody } = await loadService();

    const parsed = parseAdminDesignUpdateBody({
      name: "Mismatch",
      shape: "round",
      tags: [],
      image_urls: [
        "https://res.cloudinary.com/demo/image/upload/v1/nails/a.webp",
        "https://res.cloudinary.com/demo/image/upload/v1/nails/b.webp",
      ],
      thumbnail_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/a-thumb.webp"],
    });

    expect(parsed).toEqual({
      ok: false,
      error: "thumbnail_urls must match image_urls length when provided",
    });
  });
});
