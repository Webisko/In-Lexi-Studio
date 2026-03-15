import { chromium } from 'playwright';

const targets = [
  { url: 'https://inlexistudio.com/', viewport: { width: 390, height: 844 } },
  {
    url: 'https://inlexistudio.com/wedding-photography/',
    viewport: { width: 390, height: 844 },
  },
  {
    url: 'https://inlexistudio.com/about/',
    viewport: { width: 390, height: 844 },
  },
];

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  for (const target of targets) {
    const page = await context.newPage({ viewport: target.viewport });
    const failed = [];

    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        failed.push(`${status} ${response.url()}`);
      }
    });

    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1200);

    console.log(`\n${target.url}`);
    if (failed.length === 0) {
      console.log('NO_4XX_5XX');
    } else {
      for (const item of failed) console.log(item);
    }

    await page.close();
  }

  await browser.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
