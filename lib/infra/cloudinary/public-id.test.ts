import { describe, expect, it } from "vitest";
import { cloudinaryPublicIdFromUrl, isCloudinaryDeliveryUrl } from "./public-id";

describe("cloudinaryPublicIdFromUrl", () => {
  it("parses URL with version segment", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v1699312344/folder/my-design.webp";
    expect(cloudinaryPublicIdFromUrl(url)).toBe("folder/my-design");
  });

  it("parses URL with transformation segment before version", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/nails/photo.jpg";
    expect(cloudinaryPublicIdFromUrl(url)).toBe("nails/photo");
  });

  it("returns null for non-Cloudinary URLs", () => {
    expect(cloudinaryPublicIdFromUrl("https://example.com/a/b.jpg")).toBeNull();
  });
});

describe("isCloudinaryDeliveryUrl", () => {
  it("detects res.cloudinary.com", () => {
    expect(
      isCloudinaryDeliveryUrl("https://res.cloudinary.com/x/image/upload/v1/a.webp"),
    ).toBe(true);
    expect(isCloudinaryDeliveryUrl("https://example.com/x")).toBe(false);
  });
});
