import { expect, test } from "@playwright/test";

type ViewportCase = {
  name: string;
  width: number;
  height: number;
};

const viewports: ViewportCase[] = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const routes = ["/", "/submit", "/guidelines", "/transparency", "/adminlogin"];

test.describe("responsive-audit", () => {
  for (const route of routes) {
    test.describe(`route ${route}`, () => {
      for (const viewport of viewports) {
        test(`${viewport.name} has no horizontal overflow`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(route, { waitUntil: "networkidle" });

          const pageTitle = page.getByRole("heading", { level: 1 }).first();
          await expect(pageTitle).toBeVisible();

          const overflow = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
            const innerWidth = window.innerWidth;
            return {
              hasOverflow: scrollWidth > innerWidth + 1,
              scrollWidth,
              innerWidth,
            };
          });

          expect(
            overflow.hasOverflow,
            `Horizontal overflow on ${route} @ ${viewport.name} (scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth})`
          ).toBeFalsy();
        });
      }
    });
  }
});
