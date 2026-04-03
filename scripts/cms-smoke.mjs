import { chromium } from 'playwright';

const baseUrl = process.env.CMS_SMOKE_BASE_URL || 'http://localhost:1337/admin/';
const headless = process.env.CMS_SMOKE_HEADLESS !== 'false';

const adminCredentials = {
  email: process.env.CMS_SMOKE_ADMIN_EMAIL || 'admin@webisko.pl',
  password: process.env.CMS_SMOKE_ADMIN_PASSWORD || 'LexiAdmin!2026',
};

const managerCredentials = {
  email: process.env.CMS_SMOKE_MANAGER_EMAIL || 'info@inlexistudio.com',
  password: process.env.CMS_SMOKE_MANAGER_PASSWORD || 'LexiManager!2026',
};

async function login(page, credentials) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('#login-form').waitFor({ timeout: 15000 });
  await page.locator('#email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.getByRole('button', { name: 'Moje konto' }).waitFor({ timeout: 20000 });
}

async function openAccount(page) {
  await page.locator("button[data-tab='account']").click({ force: true });
  await page.getByRole('heading', { name: 'Moje konto' }).waitFor({ timeout: 15000 });
  await page.locator('#account-profile-form').waitFor({ timeout: 15000 });
  await page.locator('#account-password-form').waitFor({ timeout: 15000 });
}

async function verifyAdminView(page) {
  await page.locator("button[data-tab='settings']").click({ force: true });
  await page.getByRole('heading', { name: 'Ustawienia Globalne' }).waitFor({ timeout: 15000 });
  await page.getByText('Zarządzanie użytkownikami').waitFor({ timeout: 15000 });
}

async function verifyManagerView(page) {
  await page.getByRole('button', { name: 'Analityka' }).waitFor({ timeout: 15000 });
  await page.locator("button[data-tab='settings']").click({ force: true });
  await page.getByRole('heading', { name: 'Ustawienia Globalne' }).waitFor({ timeout: 15000 });

  const forbiddenSections = ['Zarządzanie użytkownikami', 'Zaawansowane', 'Analityka (Umami)'];
  for (const label of forbiddenSections) {
    const count = await page.getByText(label, { exact: true }).count();
    if (count > 0) {
      throw new Error(`Manager should not see section: ${label}`);
    }
  }
}

async function logout(page) {
  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await page.getByRole('button', { name: 'Zaloguj się' }).waitFor({ timeout: 15000 });
}

async function main() {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  try {
    await login(page, adminCredentials);
    await openAccount(page);
    await verifyAdminView(page);
    await logout(page);

    await login(page, managerCredentials);
    await openAccount(page);
    await verifyManagerView(page);

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          checks: [
            'admin login',
            'admin account',
            'admin settings',
            'manager login',
            'manager account',
            'manager restricted settings',
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
