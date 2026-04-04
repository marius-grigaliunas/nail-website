import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the home shell", () => {
    const { container } = render(<Home />);
    expect(container.firstElementChild).toHaveClass("flex", "flex-1");
  });
});
