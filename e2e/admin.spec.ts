import { test, expect } from "@playwright/test";

test("admin page shows sign-in when not authenticated", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /^admin$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("admin can sign in and see admin content", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
  test.skip(
    !email || !password,
    "Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD to run this test.",
  );

  await page.goto("/admin");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/^password$/i).fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(
    page.getByText(/you are signed in/i),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
});
