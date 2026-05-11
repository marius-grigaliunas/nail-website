import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("submits through callback", () => {
    const onSubmit = vi.fn(async () => {});
    const onEmailChange = vi.fn();
    const onPasswordChange = vi.fn();

    render(
      <LoginForm
        email="a@a.com"
        password="pw"
        error={null}
        bootstrapError={null}
        sessionCheck="done"
        submitting={false}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
