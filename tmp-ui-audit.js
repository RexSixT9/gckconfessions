const fs = require('fs');
const { chromium } = require('@playwright/test');

const pages = ['/', '/submit', '/guidelines', '/transparency', '/adminlogin', '/admin'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = [];

  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce',
    });

    for (const path of pages) {
      const page = await ctx.newPage();
      const logs = [];
      const failed = [];
      let status = 'ok';
      let overflowPx = 0;

      try {
        page.on('console', (m) => {
          if (m.type() === 'error') logs.push(m.text());
        });

        page.on('requestfailed', (r) => {
          const reason = r.failure() && r.failure().errorText ? r.failure().errorText : 'failed';
          failed.push(`${r.method()} ${r.url()} :: ${reason}`);
        });

        const resp = await page.goto(`http://127.0.0.1:3001${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        if (!resp || resp.status() >= 400) {
          status = `http_${resp ? resp.status() : 'no_response'}`;
        }

        await page.waitForTimeout(250);

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const metrics = await page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
              bodyClientWidth: document.body ? document.body.clientWidth : 0,
            }));

            overflowPx = Math.max(
              metrics.scrollWidth - metrics.clientWidth,
              metrics.bodyScrollWidth - metrics.bodyClientWidth
            );
            break;
          } catch (inner) {
            if (attempt === 2) {
              throw inner;
            }
            await page.waitForTimeout(350);
          }
        }
      } catch (e) {
        status = status === 'ok' ? 'probe_error' : status;
        logs.push(String(e));
      } finally {
        out.push({
          path,
          viewport: viewport.name,
          status,
          overflowPx,
          consoleErrors: logs.slice(0, 10),
          requestFailures: failed.slice(0, 10),
        });

        await page.close();
      }
    }

    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync('ui-audit.json', JSON.stringify(out, null, 2));
})().catch((e) => {
  fs.writeFileSync('ui-audit.json', JSON.stringify({ error: String(e), stack: e && e.stack ? e.stack : '' }, null, 2));
  process.exit(1);
});
