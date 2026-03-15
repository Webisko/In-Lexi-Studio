import { chromium } from 'playwright';

const urls = [
  'https://inlexistudio.com/',
  'https://inlexistudio.com/wedding-photography/',
  'https://inlexistudio.com/portrait-photography/',
  'https://inlexistudio.com/product-photography/',
  'https://inlexistudio.com/about/',
  'https://inlexistudio.com/approach/',
  'https://inlexistudio.com/portfolio/',
  'https://inlexistudio.com/contact/',
];

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-834', width: 834, height: 1194 },
];

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  let issues = 0;

  for (const viewport of viewports) {
    for (const url of urls) {
      const page = await context.newPage({ viewport });
      const consoleErrors = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
        const viewportWidth = window.innerWidth;
        return {
          overflow: Math.max(0, scrollWidth - viewportWidth),
        };
      });

      const status = response?.status() ?? 0;
      console.log(
        `${viewport.name} ${url} status=${status} overflow=${metrics.overflow}px consoleErrors=${consoleErrors.length}`,
      );

      if (status >= 400 || metrics.overflow > 1) {
        issues += 1;
      }

      await page.close();
    }
  }

  await browser.close();

  if (issues > 0) {
    process.exitCode = 2;
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
