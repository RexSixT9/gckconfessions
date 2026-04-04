import { expect, test } from "@playwright/test";

type ViewportCheck = {
  name: string;
  width: number;
  height: number;
  expectSnap: boolean;
};

const viewportChecks: ViewportCheck[] = [
  { name: "desktop-tall", width: 1440, height: 900, expectSnap: true },
  { name: "desktop-short", width: 1366, height: 768, expectSnap: false },
  { name: "mobile-large", width: 390, height: 844, expectSnap: false },
  { name: "mobile-small", width: 360, height: 740, expectSnap: false },
];

test.describe("admin login interactions", () => {
  test("password visibility toggle works on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/adminlogin", { waitUntil: "networkidle" });

    const passwordInput = page.getByLabel("Password");
    const toggleButton = page.getByRole("button", { name: "Show password" });
    const secret = "averysecurepass";

    await passwordInput.fill(secret);
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(toggleButton).toHaveAttribute("aria-pressed", "false");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(passwordInput).toHaveValue(secret);
    await expect(passwordInput).toBeFocused();
    await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveValue(secret);
    await expect(passwordInput).toBeFocused();
  });

  test("password visibility toggle works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/adminlogin", { waitUntil: "networkidle" });

    const passwordInput = page.getByLabel("Password");
    const toggleButton = page.getByRole("button", { name: "Show password" });

    await passwordInput.fill("averysecurepass");
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(passwordInput).toBeFocused();

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toBeFocused();
  });
});

test.describe("home page scroll spacing", () => {
  for (const viewport of viewportChecks) {
    test(`section spacing and scroll alignment on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "networkidle" });

      const hasHomeSnap = await page.evaluate(() => document.documentElement.classList.contains("home-snap"));
      expect(hasHomeSnap).toBe(viewport.expectSnap);

      const gaps = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll<HTMLElement>("section.snap-section"));
        const sectionIds = sections.map((section) => section.id || "(no-id)");
        const computedGaps = sections.slice(1).map((section, index) => {
          const prev = sections[index];
          return section.offsetTop - (prev.offsetTop + prev.offsetHeight);
        });
        return { sectionIds, computedGaps };
      });

      for (const gap of gaps.computedGaps) {
        expect(gap, `Unexpected large gap between home sections in ${viewport.name}`).toBeLessThanOrEqual(48);
      }

      for (const targetId of ["highlights", "how-it-works"]) {
        await page.evaluate((id) => {
          const section = document.getElementById(id);
          section?.scrollIntoView({ behavior: "auto", block: "start" });
        }, targetId);

        await page.waitForTimeout(120);

        const topOffset = await page.evaluate((id) => {
          const section = document.getElementById(id);
          return section ? Math.round(section.getBoundingClientRect().top) : null;
        }, targetId);

        expect(topOffset, `Missing section ${targetId}`).not.toBeNull();
        expect(topOffset!, `${targetId} top offset too high on ${viewport.name}`).toBeGreaterThanOrEqual(20);
        expect(topOffset!, `${targetId} top offset too low on ${viewport.name}`).toBeLessThanOrEqual(140);
      }
    });
  }
});
