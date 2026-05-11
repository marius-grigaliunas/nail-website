import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DesignGallery } from "./design-gallery";
import type { Design } from "@/lib/designInterface";

function design(overrides: Partial<Design> = {}): Design {
  return {
    $id: "design-1",
    name: "Stela",
    shape: "coffin",
    tags: ["black", "white"],
    image_urls: [
      "https://res.cloudinary.com/demo/image/upload/v1/nails/full-1.webp",
      "https://res.cloudinary.com/demo/image/upload/v1/nails/full-2.webp",
    ],
    thumbnail_urls: [
      "https://res.cloudinary.com/demo/image/upload/v1/nails/thumb-1.webp",
      "https://res.cloudinary.com/demo/image/upload/v1/nails/thumb-2.webp",
    ],
    display_urls: [
      "https://res.cloudinary.com/demo/image/upload/v1/nails/thumb-1.webp",
      "https://res.cloudinary.com/demo/image/upload/v1/nails/thumb-2.webp",
    ],
    $createdAt: "2026-05-01T00:00:00.000Z",
    $updatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function decodedSrc(img: HTMLElement) {
  return decodeURIComponent(img.getAttribute("src") ?? "");
}

afterEach(() => {
  cleanup();
});

describe("DesignGallery", () => {
  it("renders one preview image per design initially", () => {
    render(
      <DesignGallery
        designs={[
          design(),
          design({
            $id: "design-2",
            name: "Pearl",
            image_urls: [
              "https://res.cloudinary.com/demo/image/upload/v1/nails/pearl-full-1.webp",
              "https://res.cloudinary.com/demo/image/upload/v1/nails/pearl-full-2.webp",
            ],
            display_urls: [
              "https://res.cloudinary.com/demo/image/upload/v1/nails/pearl-thumb-1.webp",
              "https://res.cloudinary.com/demo/image/upload/v1/nails/pearl-thumb-2.webp",
            ],
          }),
        ]}
      />,
    );

    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getAllByText("1/2")).toHaveLength(2);
  });

  it("changes the card preview with carousel controls", () => {
    render(<DesignGallery designs={[design()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Show next photo for Stela" }));

    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(decodedSrc(screen.getByRole("img", { name: "Stela nail design" }))).toContain(
      "/image/upload/f_auto,q_auto:low/v1/nails/thumb-2.webp",
    );
  });

  it("opens high resolution images in a keyboard navigable viewer", () => {
    render(<DesignGallery designs={[design()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Stela gallery" }));

    const dialog = screen.getByRole("dialog", { name: "Stela" });
    expect(within(dialog).getByText("1 of 2")).toBeInTheDocument();
    expect(decodedSrc(within(dialog).getByAltText("Stela nail design photo 1"))).toContain(
      "/image/upload/f_auto,q_auto:good/v1/nails/full-1.webp",
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(within(dialog).getByText("2 of 2")).toBeInTheDocument();
    expect(decodedSrc(within(dialog).getByAltText("Stela nail design photo 2"))).toContain(
      "/image/upload/f_auto,q_auto:good/v1/nails/full-2.webp",
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
