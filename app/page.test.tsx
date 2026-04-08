import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the home shell", async () => {
    const ui = await Home();
    const { container } = render(ui);
    expect(container.firstElementChild).toHaveClass("flex", "min-h-screen", "flex-col");
  });
});
