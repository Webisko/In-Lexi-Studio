import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const urls = [
  'https://inlexistudio.com/',
  'https://inlexistudio.com/wedding-photography/',
  'https://inlexistudio.com/portrait-photography/',
  'https://inlexistudio.com/product-photography/',
];

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-834', width: 834, height: 1194 },
];

const outDir = path.resolve('reports', 'responsive');

const normalizeName = (value) =>
  value
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const run = async () => {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const report = [];

  for (const viewport of viewports) {
    for (const url of urls) {
      const page = await context.newPage({ viewport });
      console.log(`[check] ${viewport.name} ${url}`);

      const entry = {
        url,
        viewport,
        status: 'ok',
        horizontalOverflow: false,
        overflowBy: 0,
        problematicElements: [],
        consoleErrors: [],
        pageErrors: [],
        screenshot: null,
      };

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          entry.consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        entry.pageErrors.push(String(err));
      });

      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        if (!response || response.status() >= 400) {
          entry.status = `http-${response?.status() ?? 'no-response'}`;
        }

        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(500);

        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const viewportWidth = window.innerWidth;
          const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
          const overflowBy = Math.max(0, scrollWidth - viewportWidth);

          const isVisible = (el) => {
            const style = getComputedStyle(el);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              Number(style.opacity) === 0
            ) {
              return false;
            }
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          const candidates = [];
          const elements = Array.from(document.querySelectorAll('body *'));
          for (const el of elements) {
            if (!(el instanceof HTMLElement)) continue;
            if (!isVisible(el)) continue;
            const rect = el.getBoundingClientRect();
            const overflowRight = rect.right - viewportWidth;
            const overflowLeft = -rect.left;
            if (overflowRight > 2 || overflowLeft > 2) {
              const className = (el.className || '').toString().trim().slice(0, 160);
              candidates.push({
                tag: el.tagName.toLowerCase(),
                className,
                overflowRight: Math.round(overflowRight),
                overflowLeft: Math.round(overflowLeft),
                width: Math.round(rect.width),
              });
            }
          }

          candidates.sort(
            (a, b) => b.overflowRight + b.overflowLeft - (a.overflowRight + a.overflowLeft),
          );

          return {
            viewportWidth,
            scrollWidth,
            overflowBy,
            problematicElements: candidates.slice(0, 8),
          };
        });

        entry.horizontalOverflow = metrics.overflowBy > 1;
        entry.overflowBy = metrics.overflowBy;
        entry.problematicElements = metrics.problematicElements;

        const fileBase = `${normalizeName(url)}-${viewport.name}`;
        const screenshotPath = path.join(outDir, `${fileBase}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        entry.screenshot = screenshotPath;
      } catch (error) {
        entry.status = 'runtime-error';
        entry.pageErrors.push(String(error));
      } finally {
        await page.close();
      }

      report.push(entry);
    }
  }

  await browser.close();

  const jsonPath = path.join(outDir, 'report.json');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

  const failing = report.filter(
    (item) =>
      item.horizontalOverflow ||
      item.consoleErrors.length > 0 ||
      item.pageErrors.length > 0 ||
      item.status !== 'ok',
  );

  console.log(`Responsive audit complete: ${report.length} checks`);
  console.log(`Report: ${jsonPath}`);
  console.log(`Issues found: ${failing.length}`);

  if (failing.length) {
    for (const item of failing) {
      console.log(
        `- ${item.viewport.name} ${item.url} | status=${item.status} | overflow=${item.overflowBy}px | consoleErrors=${item.consoleErrors.length} | pageErrors=${item.pageErrors.length}`,
      );
    }
    process.exitCode = 2;
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
