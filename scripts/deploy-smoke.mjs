const siteBaseUrl = (process.env.DEPLOY_SMOKE_BASE_URL || 'https://inlexistudio.com').replace(
  /\/$/,
  '',
);
const apiBaseUrl = process.env.DEPLOY_SMOKE_API_BASE_URL || `${siteBaseUrl}/app/api`;
const adminBaseUrl = (
  process.env.DEPLOY_SMOKE_ADMIN_BASE_URL || 'https://admin.inlexistudio.com'
).replace(/\/$/, '');
const timeoutMs = Number(process.env.DEPLOY_SMOKE_TIMEOUT_MS || 30000);
const adminEmail = process.env.DEPLOY_SMOKE_ADMIN_EMAIL || '';
const adminPassword = process.env.DEPLOY_SMOKE_ADMIN_PASSWORD || '';
const skippedChecks = [];

const publicChecks = [
  `${siteBaseUrl}/`,
  `${siteBaseUrl}/wedding-photography/`,
  `${siteBaseUrl}/portrait-photography/`,
  `${siteBaseUrl}/product-photography/`,
  `${siteBaseUrl}/about/`,
  `${siteBaseUrl}/approach/`,
  `${siteBaseUrl}/portfolio/`,
  `${siteBaseUrl}/contact/`,
  `${siteBaseUrl}/pricing/`,
  `${adminBaseUrl}/`,
  `${siteBaseUrl}/cursor/normal.svg`,
  `${siteBaseUrl}/cursor/hover.svg`,
  `${apiBaseUrl}/pages`,
  `${apiBaseUrl}/settings`,
];

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      redirect: 'follow',
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function assertOk(url, label = url) {
  const response = await fetchWithTimeout(url, {
    headers: { Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
  });

  if (!response.ok) {
    throw new Error(`${label} failed with ${response.status}`);
  }

  console.log(`${response.status} ${label}`);
}

async function assertContactForm() {
  const response = await fetchWithTimeout(`${apiBaseUrl}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      formType: 'contact',
      name: 'Deploy Smoke',
      email: 'info@inlexistudio.com',
      message: 'deploy smoke check',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Contact form failed with ${response.status}: ${body}`);
  }

  console.log(`${response.status} POST ${apiBaseUrl}/contact`);
}

async function assertAdminApi() {
  if (!adminEmail || !adminPassword) {
    skippedChecks.push('admin login and protected API smoke');
    return;
  }

  const loginResponse = await fetchWithTimeout(`${apiBaseUrl}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  if (!loginResponse.ok) {
    const body = await loginResponse.text();
    throw new Error(`Admin login failed with ${loginResponse.status}: ${body}`);
  }

  const loginPayload = await loginResponse.json();
  if (!loginPayload?.token) {
    throw new Error('Admin login did not return a token.');
  }

  const authHeaders = {
    Accept: 'application/json',
    Authorization: `Bearer ${loginPayload.token}`,
  };

  const verifyResponse = await fetchWithTimeout(`${apiBaseUrl}/admin/verify`, {
    headers: authHeaders,
  });
  if (!verifyResponse.ok) {
    throw new Error(`Admin verify failed with ${verifyResponse.status}`);
  }

  console.log(`${verifyResponse.status} ${apiBaseUrl}/admin/verify`);

  const usageResponse = await fetchWithTimeout(`${apiBaseUrl}/admin/media/usage`, {
    headers: authHeaders,
  });
  if (!usageResponse.ok) {
    throw new Error(`Media usage failed with ${usageResponse.status}`);
  }

  console.log(`${usageResponse.status} ${apiBaseUrl}/admin/media/usage`);
}

async function main() {
  for (const url of publicChecks) {
    await assertOk(url);
  }

  await assertContactForm();
  await assertAdminApi();

  console.log(
    JSON.stringify(
      {
        ok: true,
        siteBaseUrl,
        apiBaseUrl,
        adminBaseUrl,
        skippedChecks,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
