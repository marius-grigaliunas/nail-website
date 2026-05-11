import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import Home from "@/app/page";

vi.mock("@/lib/appwrite-server", () => ({
  listDesignsForGallery: vi.fn(async () => []),
}));

describe("Home page", () => {
  it("renders the home shell", async () => {
    const ui = await Home();
    const { container } = render(ui);
    expect(container.firstElementChild).toHaveClass("flex", "min-h-screen", "flex-col");
  });
});
