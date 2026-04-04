import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/submit",
  "/guidelines",
  "/transparency",
  "/adminlogin",
  "/what-happens-next",
];

test.describe("ui overflow and breakage", () => {
  for (const route of routes) {
    test(`desktop layout is stable on ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const requestFailures: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("requestfailed", (req) => {
        requestFailures.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText ?? "failed"}`);
      });

      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response, `No response for ${route}`).toBeTruthy();
      expect(response!.status(), `HTTP status for ${route}`).toBeLessThan(400);

      const overflow = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        return Math.max(
          html.scrollWidth - html.clientWidth,
          body ? body.scrollWidth - body.clientWidth : 0
        );
      });

      expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
      expect(requestFailures, `Failed requests on ${route}: ${requestFailures.join("\n")}`).toEqual([]);
      expect(consoleErrors, `Console errors on ${route}: ${consoleErrors.join("\n")}`).toEqual([]);
    });

    test(`mobile layout is stable on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      const consoleErrors: string[] = [];
      const requestFailures: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("requestfailed", (req) => {
        requestFailures.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText ?? "failed"}`);
      });

      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response, `No response for ${route}`).toBeTruthy();
      expect(response!.status(), `HTTP status for ${route}`).toBeLessThan(400);

      const overflow = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        return Math.max(
          html.scrollWidth - html.clientWidth,
          body ? body.scrollWidth - body.clientWidth : 0
        );
      });

      expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
      expect(requestFailures, `Failed requests on ${route}: ${requestFailures.join("\n")}`).toEqual([]);
      expect(consoleErrors, `Console errors on ${route}: ${consoleErrors.join("\n")}`).toEqual([]);
    });
  }
});
