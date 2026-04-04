const fs = require('fs');
const { chromium } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const longWord = 'X'.repeat(420);
const longUrl = `https://example.com/${'verylongpathsegment'.repeat(24)}?q=${'token'.repeat(50)}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = [];

  for (const viewport of viewports) {
    const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await ctx.newPage();

    const item = { viewport: viewport.name, status: 'ok', baseOverflow: 0, stressOverflow: 0, overflowNodes: [] };

    try {
      const resp = await page.goto('http://127.0.0.1:3001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!resp || resp.status() >= 400) {
        item.status = `http_${resp ? resp.status() : 'no_response'}`;
      }

      await page.waitForTimeout(300);

      item.baseOverflow = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        return Math.max(html.scrollWidth - html.clientWidth, body ? body.scrollWidth - body.clientWidth : 0);
      });

      const stressed = await page.evaluate(({ longWord, longUrl }) => {
        const selectors = [
          '#hero-title > span:first-child',
          '#hero-title > span:last-child',
          '#highlights-heading',
          '#how-it-works-heading',
          'section[aria-labelledby="community-pulse-heading"] p.text-sm.leading-relaxed.text-muted-foreground',
          'section[aria-labelledby="explore-heading"] p.max-w-2xl',
          'section[aria-labelledby="highlights-heading"] p.mx-auto',
          'section[aria-labelledby="how-it-works-heading"] p.mx-auto',
        ];

        selectors.forEach((sel, idx) => {
          const el = document.querySelector(sel);
          if (!el) return;
          if (idx % 2 === 0) {
            el.textContent = `${longWord} ${longWord}`;
          } else {
            el.textContent = `${longUrl} ${longUrl}`;
          }
        });

        const html = document.documentElement;
        const body = document.body;
        const overflow = Math.max(html.scrollWidth - html.clientWidth, body ? body.scrollWidth - body.clientWidth : 0);

        const bad = [];
        document.querySelectorAll('h1,h2,h3,p,span,div').forEach((el) => {
          const node = el;
          const delta = node.scrollWidth - node.clientWidth;
          if (delta > 2 && getComputedStyle(node).display !== 'inline') {
            bad.push({
              tag: node.tagName,
              cls: (node.className || '').toString().slice(0, 120),
              overflow: delta,
            });
          }
        });

        return { overflow, bad: bad.slice(0, 20) };
      }, { longWord, longUrl });

      item.stressOverflow = stressed.overflow;
      item.overflowNodes = stressed.bad;
    } catch (error) {
      item.status = 'probe_error';
      item.error = String(error);
    }

    out.push(item);
    await page.close();
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync('home-stress-report.json', JSON.stringify(out, null, 2));
})();
