import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders core hero and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Drop the mask");
    await expect(page.getByRole("link", { name: "Write a confession" })).toBeVisible();
  });

  test("home CTA navigates to submit page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Write a confession" }).click();
    await expect(page).toHaveURL(/\/submit$/);
    await expect(page.getByRole("heading", { name: "Share your confession" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit confession" })).toBeVisible();
  });

  test("guidelines page renders content headings", async ({ page }) => {
    await page.goto("/guidelines");
    await expect(page.getByRole("heading", { name: "Simple safety rules" })).toBeVisible();
    await expect(page.getByText("Content we welcome", { exact: true })).toBeVisible();
    await expect(page.getByText("Content we reject", { exact: true })).toBeVisible();
  });

  test("admin login form loads and is initially disabled", async ({ page }) => {
    await page.goto("/adminlogin");
    await expect(page.getByText("Admin sign in", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });
});
