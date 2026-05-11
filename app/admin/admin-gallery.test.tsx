import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminGallery } from "./admin-gallery";

const fetchWithAppwriteJwt = vi.fn();

vi.mock("@/lib/fetch-with-appwrite-jwt", () => ({
  fetchWithAppwriteJwt: (...args: unknown[]) => fetchWithAppwriteJwt(...args),
}));

vi.mock("@/lib/appwrite", () => ({
  uploadNailDesignFileWithThumbnail: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

const design = {
  $id: "row-1",
  name: "Original Set",
  shape: "round",
  price: 35,
  tags: ["floral"],
  image_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/original.webp"],
  thumbnail_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/original-thumb.webp"],
  display_urls: ["https://res.cloudinary.com/demo/image/upload/v1/nails/original-thumb.webp"],
  $createdAt: "2026-01-01T00:00:00.000Z",
  $updatedAt: "2026-01-02T00:00:00.000Z",
} as const;

describe("AdminGallery", () => {
  beforeEach(() => {
    fetchWithAppwriteJwt.mockReset();
  });

  it("opens the edit panel and saves design changes", async () => {
    fetchWithAppwriteJwt
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ designs: [design] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          design: {
            ...design,
            name: "Updated Set",
            tags: ["floral", "pink"],
            $updatedAt: "2026-01-03T00:00:00.000Z",
          },
        }),
      });

    render(<AdminGallery />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Updated Set" },
    });
    fireEvent.change(screen.getByPlaceholderText("Add tag"), {
      target: { value: "pink" },
    });
    fireEvent.keyDown(screen.getByPlaceholderText("Add tag"), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchWithAppwriteJwt).toHaveBeenLastCalledWith(
        "/api/admin/designs/row-1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Updated Set"),
        }),
      );
    });

    expect(await screen.findByText("Design updated.")).toBeInTheDocument();
    expect(screen.getByText("Updated Set")).toBeInTheDocument();
  });
});
