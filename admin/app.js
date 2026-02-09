function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveApiBase() {
  const meta = document.querySelector('meta[name="api-base"]');
  const metaValue = meta && meta.getAttribute('content');
  if (metaValue) return normalizeBaseUrl(metaValue);

  return normalizeBaseUrl(`${window.location.origin}/app/api`);
}

const API_URL = resolveApiBase();
const ADMIN_API_URL = `${API_URL}/admin`;

// --- Global State ---
let token = localStorage.getItem('token');
let currentUser = null;
let resetToken = null;

const getResetTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('reset');
};

// --- Selectors ---
const dom = {
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  loginMessage: document.getElementById('login-message'),
  loginPanel: document.getElementById('login-panel'),
  forgotLink: document.getElementById('forgot-link'),
  forgotPanel: document.getElementById('forgot-panel'),
  forgotForm: document.getElementById('forgot-form'),
  forgotEmail: document.getElementById('forgot-email'),
  forgotMessage: document.getElementById('forgot-message'),
  backToLoginFromForgot: document.getElementById('back-to-login-from-forgot'),
  resetPanel: document.getElementById('reset-panel'),
  resetForm: document.getElementById('reset-form'),
  resetPassword: document.getElementById('reset-password'),
  resetPasswordConfirm: document.getElementById('reset-password-confirm'),
  resetMessage: document.getElementById('reset-message'),
  backToLoginFromReset: document.getElementById('back-to-login-from-reset'),
  dashboard: document.getElementById('dashboard'),
  logoutBtns: document.querySelectorAll('#logout-btn'),
  navBtns: document.querySelectorAll('.nav-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  modal: document.getElementById('modal'),
  modalContent: document.getElementById('modal-content'),
  modalTitle: document.getElementById('modal-title'),
  closeModalBtn: document.getElementById('close-modal'),
  // Media Picker
  mediaModal: document.getElementById('media-modal'),
  closeMediaBtn: document.getElementById('close-media-modal'),
  mediaGrid: document.getElementById('media-library-grid'),
  mediaUploadInput: document.getElementById('global-file-upload'),
  mediaStatus: document.getElementById('media-status'),
  themeToggle: document.getElementById('theme-toggle'),
};

// --- Initialization ---
resetToken = getResetTokenFromUrl();
if (token) {
  verifyToken();
} else if (resetToken) {
  showReset(resetToken);
} else {
  showLogin();
}

// Theme Check
const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else {
  document.documentElement.classList.add('dark');
}

// --- Event Listeners ---
dom.loginForm.addEventListener('submit', handleLogin);
if (dom.forgotLink) dom.forgotLink.addEventListener('click', showForgot);
if (dom.forgotForm) dom.forgotForm.addEventListener('submit', handleForgotPassword);
if (dom.backToLoginFromForgot) dom.backToLoginFromForgot.addEventListener('click', showLogin);
if (dom.resetForm) dom.resetForm.addEventListener('submit', handleResetPassword);
if (dom.backToLoginFromReset) dom.backToLoginFromReset.addEventListener('click', showLogin);
dom.closeModalBtn.addEventListener('click', closeModal);
dom.closeMediaBtn.addEventListener('click', () => dom.mediaModal.classList.add('hidden'));

dom.themeToggle.addEventListener('click', () => {
  // If currently dark, switch to light
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
});

dom.logoutBtns.forEach((btn) =>
  btn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    showLogin();
  }),
);

dom.navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
    // Update Active State
    dom.navBtns.forEach((b) => {
      b.classList.remove(
        'bg-white/5',
        'text-white',
        'border-l-2',
        'border-gold',
        'bg-gray-100',
        'text-gray-900',
        'dark:bg-white/5',
        'dark:text-white',
      );
      b.classList.add('text-gray-400');
      b.querySelector('svg')?.classList.remove('text-gold');
    });
    btn.classList.add(
      'bg-gray-100',
      'text-gray-900',
      'border-l-2',
      'border-gold',
      'dark:bg-white/5',
      'dark:text-white',
    );
    btn.classList.remove('text-gray-400');
    btn.querySelector('svg')?.classList.add('text-gold');
  });
});

// --- Media Picker Logic ---
let currentMediaCallback = null; // Resolves the promise

async function openMediaPicker() {
  return new Promise((resolve) => {
    currentMediaCallback = resolve;
    dom.mediaModal.classList.remove('hidden');
    loadMediaLibrary();
  });
}

dom.mediaUploadInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files.length) return;

  dom.mediaStatus.textContent = `Przesyłanie ${files.length} plików...`;

  for (let file of files) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${ADMIN_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        // success
      }
    } catch (err) {
      console.error(err);
    }
  }
  dom.mediaStatus.textContent = 'Gotowe!';
  loadMediaLibrary(); // Refresh grid
});

async function loadMediaLibrary() {
  dom.mediaGrid.innerHTML =
    '<div class="col-span-4 text-center text-gray-400 loader mx-auto w-8 h-8 rounded-full border-2 border-t-gold"></div>';
  try {
    const res = await fetch(`${ADMIN_API_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const files = await res.json();

    dom.mediaGrid.innerHTML = files
      .map(
        (f) => `
            <div class="cursor-pointer group relative aspect-square bg-gray-900 rounded border border-white/5 overflow-hidden hover:border-gold transition-colors" onclick="selectMedia('${f.url}')">
                <img src="${f.url}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span class="text-xs text-white">Wybierz</span>
                </div>
            </div>
        `,
      )
      .join('');
  } catch (e) {
    dom.mediaGrid.innerHTML = '<p class="text-red-500">Błąd ładowania biblioteki.</p>';
  }
}

window.selectMedia = (url) => {
  if (currentMediaCallback) currentMediaCallback(url);
  dom.mediaModal.classList.add('hidden');
  currentMediaCallback = null;
};

// --- Auth Logic ---
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function setStatusMessage(element, message, tone) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove('hidden');
  element.classList.toggle('text-emerald-400', tone === 'success');
  element.classList.toggle('bg-emerald-500/10', tone === 'success');
  element.classList.toggle('text-red-500', tone === 'error');
  element.classList.toggle('bg-red-500/10', tone === 'error');
}

function validatePasswordStrength(password) {
  if (!password || password.length < 10) {
    return 'Haslo musi miec co najmniej 10 znakow.';
  }
  if (!/[A-Z]/.test(password)) return 'Haslo musi zawierac wielka litere.';
  if (!/[a-z]/.test(password)) return 'Haslo musi zawierac mala litere.';
  if (!/[0-9]/.test(password)) return 'Haslo musi zawierac cyfre.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Haslo musi zawierac znak specjalny.';
  return null;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  dom.loginError.classList.add('hidden');
  dom.loginMessage?.classList.add('hidden');

  try {
    const res = await fetch(`${ADMIN_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      verifyToken();
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (err) {
    dom.loginError.textContent = err.message;
    dom.loginError.classList.remove('hidden');
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = dom.forgotEmail?.value.trim();
  if (!email) return;
  dom.forgotMessage?.classList.add('hidden');

  try {
    const res = await fetch(`${ADMIN_API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Nie udalo sie wyslac linku resetu.');
    }

    setStatusMessage(
      dom.forgotMessage,
      'Jesli email istnieje w systemie, wyslalismy link do resetu hasla.',
      'success',
    );
  } catch (err) {
    setStatusMessage(dom.forgotMessage, err.message, 'error');
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const password = dom.resetPassword?.value || '';
  const confirm = dom.resetPasswordConfirm?.value || '';
  dom.resetMessage?.classList.add('hidden');

  if (!resetToken) {
    setStatusMessage(dom.resetMessage, 'Brak tokenu resetu. Otworz link z maila.', 'error');
    return;
  }

  const validationError = validatePasswordStrength(password);
  if (validationError) {
    setStatusMessage(dom.resetMessage, validationError, 'error');
    return;
  }

  if (password !== confirm) {
    setStatusMessage(dom.resetMessage, 'Hasla musza byc takie same.', 'error');
    return;
  }

  try {
    const res = await fetch(`${ADMIN_API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || 'Nie udalo sie ustawic hasla.');

    showLogin();
    setStatusMessage(dom.loginMessage, 'Haslo zostalo ustawione. Zaloguj sie.', 'success');
  } catch (err) {
    setStatusMessage(dom.resetMessage, err.message, 'error');
  }
}

async function verifyToken() {
  try {
    const res = await fetch(`${ADMIN_API_URL}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      // Parse Role
      const payload = parseJwt(token);
      currentUser = { ...payload }; // { id, email, role }

      // Settings Tab Visibility based on Role
      const settingsTab = document.querySelector('[data-tab="settings"]');
      const analyticsTab = document.querySelector('[data-tab="analytics"]');
      if (currentUser.role !== 'ADMIN' && settingsTab) {
        settingsTab.classList.add('hidden'); // Hide Settings for non-admins
      }
      if (currentUser.role !== 'ADMIN' && analyticsTab) {
        analyticsTab.classList.add('hidden');
      }

      showDashboard();
    } else {
      throw new Error('Invalid token');
    }
  } catch (e) {
    showLogin();
  }
}

function showLogin() {
  dom.loginScreen.classList.remove('hidden');
  dom.dashboard.classList.add('hidden');
  dom.loginPanel?.classList.remove('hidden');
  dom.forgotPanel?.classList.add('hidden');
  dom.resetPanel?.classList.add('hidden');
  dom.loginError?.classList.add('hidden');
  dom.loginMessage?.classList.add('hidden');
  dom.forgotMessage?.classList.add('hidden');
  dom.resetMessage?.classList.add('hidden');

  resetToken = null;
  const params = new URLSearchParams(window.location.search);
  if (params.has('reset')) {
    params.delete('reset');
    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }
}

function showForgot() {
  dom.loginScreen.classList.remove('hidden');
  dom.dashboard.classList.add('hidden');
  dom.loginPanel?.classList.add('hidden');
  dom.forgotPanel?.classList.remove('hidden');
  dom.resetPanel?.classList.add('hidden');
  dom.loginError?.classList.add('hidden');
  dom.loginMessage?.classList.add('hidden');
  dom.forgotMessage?.classList.add('hidden');
  dom.resetMessage?.classList.add('hidden');
}

function showReset(tokenValue) {
  resetToken = tokenValue;
  dom.loginScreen.classList.remove('hidden');
  dom.dashboard.classList.add('hidden');
  dom.loginPanel?.classList.add('hidden');
  dom.forgotPanel?.classList.add('hidden');
  dom.resetPanel?.classList.remove('hidden');
  dom.loginError?.classList.add('hidden');
  dom.loginMessage?.classList.add('hidden');
  dom.forgotMessage?.classList.add('hidden');
  dom.resetMessage?.classList.add('hidden');
}

function showDashboard() {
  dom.loginScreen.classList.add('hidden');
  dom.dashboard.classList.remove('hidden');
  // Default Tab: Dashboard
  const dashBtn = document.querySelector('[data-tab="dashboard"]');
  if (dashBtn) dashBtn.click();
  else dom.navBtns[0].click();
}

// --- Navigation ---
function switchTab(tabName) {
  dom.tabContents.forEach((c) => c.classList.add('hidden'));
  const target = document.getElementById(`tab-${tabName}`);
  if (target) target.classList.remove('hidden');

  if (tabName === 'dashboard') loadDashboard();
  if (tabName === 'pages') loadPages();
  if (tabName === 'galleries') loadGalleries();
  if (tabName === 'testimonials') loadTestimonials();
  if (tabName === 'settings') loadSettings();
  if (tabName === 'analytics') loadAnalytics();
}

// --- Modules ---

// 0. Dashboard (New)
async function loadDashboard() {
  const container = document.getElementById('tab-dashboard');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  // Helper for safe fetching
  const safeFetch = async (url) => {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch ${url}`, e);
      return [];
    }
  };

  const safeFetchNoAuth = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch ${url}`, e);
      return null;
    }
  };

  // Parallel fetch for stats
  const [pages, testimonials, galleries] = await Promise.all([
    safeFetch(`${ADMIN_API_URL}/pages`),
    safeFetch(`${ADMIN_API_URL}/testimonials`),
    safeFetch(`${ADMIN_API_URL}/galleries`),
  ]);

  const settings = await safeFetchNoAuth(`${API_URL}/settings`);
  const umamiDashboardUrl = resolveUmamiDashboardUrl(settings);

  // Remove manual await json calls since safeFetch does it
  /*
  const pages = await statsRes.json();
  const testimonials = await testimonialsRes.json();
  const galleries = await galleriesRes.json();
  */

  const pendingEdits = galleries.length; // Mock metric
  const ratingAvg =
    testimonials.length > 0
      ? (testimonials.reduce((a, b) => a + b.rating, 0) / testimonials.length).toFixed(1)
      : '0.0';
  const recentGalleries = galleries.slice(0, 3);

  container.innerHTML = `
        <div class="mb-8">
            <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white mb-2">Dzień dobry, Lexi</h2>
            <p class="text-gray-500">Oto co dzieje się dzisiaj w studio.</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Sesje Zdjęciowe</span>
                    <svg class="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div class="flex items-baseline">
                    <span class="text-4xl font-display text-gray-900 dark:text-white mr-2">${galleries.length}</span>
                    <span class="text-xs text-green-500 font-bold">Aktywnych</span>
                </div>
            </div>

            <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Średnia Ocena</span>
                    <svg class="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <div class="flex items-baseline">
                    <span class="text-4xl font-display text-gray-900 dark:text-white mr-2">${ratingAvg}</span>
                    <span class="text-xs text-gray-500">z ${testimonials.length} opinii</span>
                </div>
            </div>

            <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Strony</span>
                    <svg class="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div class="flex items-baseline">
                    <span class="text-4xl font-display text-gray-900 dark:text-white mr-2">${pages.length}</span>
                    <span class="text-xs text-gray-500">Opublikowanych</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Latest Moments / Galleries -->
            <div class="lg:col-span-2 space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="font-display text-xl text-gray-900 dark:text-white">Ostatnie Sesje</h3>
                    <button onclick="document.querySelector('[data-tab=\'galleries\']').click()" class="text-sm text-gold hover:text-white transition-colors">Zobacz Wszystkie</button>
                </div>
                <div class="grid grid-cols-3 gap-4">
                     ${recentGalleries
                       .map(
                         (g) => `
                        <div class="aspect-[3/4] bg-gray-100 dark:bg-black rounded-lg overflow-hidden relative group cursor-pointer" onclick="editGallery(${g.id})">
                            ${g.items && g.items.length > 0 ? `<img src="${g.items[0].image_path}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">` : ''}
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                <p class="text-white font-medium text-sm truncate">${g.name || 'Bez nazwy'}</p>
                                <p class="text-xs text-gray-400 capitalize">${CATEGORY_MAP[g.category] || g.category}</p>
                            </div>
                        </div>
                     `,
                       )
                       .join('')}
                     
                     <!-- Add New Placeholder -->
                     ${
                       recentGalleries.length < 3
                         ? `
                        <button onclick="editGallery(null)" class="aspect-[3/4] border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gold hover:text-gold transition-colors">
                            <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                            <span class="text-sm font-medium">Dodaj Sesję</span>
                        </button>
                     `
                         : ''
                     }
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="space-y-6">
                <h3 class="font-display text-xl text-gray-900 dark:text-white">Szybkie Akcje</h3>
                
                <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 text-center">
                    <div class="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gold">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h4 class="font-bold text-gray-900 dark:text-white mb-2">Nowa Galeria</h4>
                    <p class="text-sm text-gray-500 mb-4 px-2">Stwórz nową kolekcję zdjęć dla klienta lub do portfolio.</p>
                    <button onclick="editGallery(null)" class="w-full bg-gold text-black py-2 rounded font-bold hover:bg-gold-hover transition-colors">Dodaj Galerię</button>
                </div>

                <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                    <h4 class="font-bold text-gray-900 dark:text-white mb-4">Analityka</h4>
                     <a href="${umamiDashboardUrl || '#'}" target="_blank" class="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group ${
                       umamiDashboardUrl ? '' : 'opacity-50 pointer-events-none'
                     }">
                        <span class="text-sm text-gray-600 dark:text-gray-300">${
                          umamiDashboardUrl ? 'Otwórz Umami' : 'Skonfiguruj Umami'
                        }</span>
                        <svg class="w-4 h-4 text-gray-400 group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>
            </div>
        </div>
    `;
}

// 1. Pages
async function loadPages() {
  const container = document.getElementById('tab-pages');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  let pages = [];
  try {
    const res = await fetch(`${ADMIN_API_URL}/pages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    pages = await res.json();
  } catch (e) {
    console.error('Error loading pages', e);
  }

  // Auto-seed Home Page logic in UI if missing
  const hasHome = pages.find((p) => p.is_home || p.slug === '/' || p.slug === 'home');

  if (pages.length === 0 || !hasHome) {
    // Just visually show a button to seed, or we could auto-seed. Let's show a button.
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-center">
            <h2 class="text-2xl font-display text-gray-900 dark:text-white mb-4">Brak stron</h2>
            <p class="text-gray-500 mb-6">Wygląda na to, że baza danych jest pusta lub brakuje strony głównej.</p>
            <button onclick="seedHomePage()" class="bg-gold text-black px-6 py-3 rounded font-bold hover:bg-gold-hover transition-colors shadow-lg">
                Utwórz stronę główną
            </button>
        </div>
      `;
    // If there are other pages but no home, we might want to list them still?
    // User said "I don't see any pages". So likely empty.
    if (pages.length > 0) {
      // Render table + Seed Button
      renderPagesTable(pages, true, container);
    }
    return;
  }

  renderPagesTable(pages, false, container);
}

function renderPagesTable(pages, showSeedBtn, container) {
  container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Strony</h2>
             ${showSeedBtn ? `<button onclick="seedHomePage()" class="text-sm text-gold hover:text-white underline">Dodaj Home</button>` : ''}
        </div>
        <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm">
            <table class="w-full text-left">
                <thead class="bg-gray-50 dark:bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th class="px-3 py-4"></th>
                        <th class="px-6 py-4">Tytuł</th>
                        <th class="px-6 py-4">Slug</th>
                        <th class="px-6 py-4">Ostatnia Modyfikacja</th>
                        <th class="px-6 py-4 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody id="pages-table-body" class="divide-y divide-gray-200 dark:divide-white/5 text-sm text-gray-600 dark:text-gray-300">
                    ${pages
                      .map(
                        (p) => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" data-id="${p.id}">
                            <td class="px-3 py-4 text-gray-400 cursor-move drag-handle" title="Przeciągnij, aby zmienić kolejność">&#9776;</td>
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              ${p.title || '(Bez tytułu)'}
                              ${p.is_home ? '<span class="ml-2 text-xs uppercase tracking-wider text-gold">Home</span>' : ''}
                            </td>
                            <td class="px-6 py-4 text-gray-500 dark:text-gray-500">${p.slug}</td>
                            <td class="px-6 py-4">${new Date(p.updated_at || p.updatedAt || Date.now()).toLocaleDateString()}</td>
                            <td class="px-6 py-4 text-right">
                                <button onclick="editPage(${p.id})" class="text-gold hover:text-black dark:hover:text-white transition-colors font-medium">Edytuj</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
    `;

  const tbody = document.getElementById('pages-table-body');
  if (tbody) {
    Sortable.create(tbody, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: async () => {
        const ids = Array.from(tbody.children).map((row) => row.dataset.id);
        await fetch(`${ADMIN_API_URL}/pages/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: ids }),
        });
      },
    });
  }
}

window.seedHomePage = async () => {
  try {
    await fetch(`${ADMIN_API_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        slug: '/',
        title: 'In Lexi Studio',
        content: '<p>Welcome to the home page.</p>',
        is_home: true,
        seo_use_hero: true,
      }),
    });
    loadPages();
  } catch (e) {
    alert('Błąd tworzenia strony: ' + e.message);
  }
};

window.editPage = async (id) => {
  let page = {
    title: '',
    content: '',
    hero_image: '',
    meta_title: '',
    meta_description: '',
    seo_image: '',
    is_home: false,
    seo_use_hero: true,
    slug: '',
  };
  const res = await fetch(`${ADMIN_API_URL}/pages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const pages = await res.json();
  page = pages.find((p) => p.id === id) || page;

  // SEO Section (Admin Only)
  const seoSection =
    currentUser.role === 'ADMIN'
      ? `
    <div class="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Ustawienia SEO</h3>
        <div class="space-y-4">
             <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Tytuł</label>
                <input type="text" id="meta_title" value="${page.meta_title || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">
          <p class="text-xs text-gray-500">Długość: <span id="meta_title_count">0</span> / 50-60</p>
            </div>
             <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Opis</label>
                <textarea id="meta_description" class="w-full h-20 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">${page.meta_description || ''}</textarea>
          <p class="text-xs text-gray-500">Długość: <span id="meta_description_count">0</span> / 140-160</p>
            </div>
             <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Miniaturka SEO (og:image)</label>
          <div class="flex items-center gap-4">
            <img id="seo_image_preview" src="${page.seo_image || ''}" class="w-20 h-20 rounded object-cover border border-gray-200 dark:border-white/10 ${page.seo_image ? '' : 'hidden'}" />
            <div class="flex-1 space-y-2">
              <input type="text" id="seo_image" value="${page.seo_image || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none">
              <div class="flex gap-2">
                            <button type="button" id="seo_image_pick" onclick="openMediaPicker().then(url => setImageField('seo_image','seo_image_preview',url))" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                            <button type="button" id="seo_image_clear" onclick="clearImageField('seo_image','seo_image_preview')" class="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Usuń</button>
              </div>
            </div>
          </div>
          <label class="mt-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" id="seo_use_hero" ${page.seo_use_hero ? 'checked' : ''} class="w-4 h-4 accent-gold" />
            Użyj zdjęcia głównego (Hero) jako og:image
          </label>
            </div>
        </div>
    </div>
  `
      : '';

  const html = `
        <form id="page-form" class="space-y-6">
             <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Tytuł Strony</label>
                <input type="text" id="title" value="${page.title || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium text-xl">
            </div>
            
            <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Zdjęcie główne (Hero)</label>
              <div class="flex items-center gap-4">
                <img id="hero_image_preview" src="${page.hero_image || ''}" class="w-20 h-20 rounded object-cover border border-gray-200 dark:border-white/10 ${page.hero_image ? '' : 'hidden'}" />
                <div class="flex-1 space-y-2">
                  <input type="text" id="hero_image" value="${page.hero_image || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none">
                  <div class="flex gap-2">
                    <button type="button" onclick="openMediaPicker().then(url => setImageField('hero_image','hero_image_preview',url))" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                    <button type="button" onclick="clearImageField('hero_image','hero_image_preview')" class="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Usuń</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Slug</label>
              <input type="text" id="slug" value="${page.slug || ''}" class="w-full bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-500 dark:text-gray-400 outline-none" disabled>
            </div>

            <label class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" id="is_home" ${page.is_home ? 'checked' : ''} class="w-4 h-4 accent-gold" />
              To jest strona główna (slug zostanie ustawiony na "/")
            </label>

            <div class="space-y-2 h-[400px] flex flex-col">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Treść</label>
                <textarea id="content" class="wysiwyg flex-1">${page.content || ''}</textarea>
            </div>

            ${seoSection}

            <div class="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
                <button type="submit" class="bg-gold text-black px-6 py-2 rounded font-bold hover:bg-gold-hover transition-colors">Zapisz zmiany</button>
            </div>
        </form>
    `;

  openModal('Edycja strony', html);
  initTinyMCE();
  applySeoUseHeroState();
  initMetaCounters();

  const isHome = document.getElementById('is_home');
  if (isHome) {
    isHome.addEventListener('change', () => {
      const slugInput = document.getElementById('slug');
      if (slugInput) slugInput.value = isHome.checked ? '/' : page.slug || '';
    });
  }

  const seoUseHero = document.getElementById('seo_use_hero');
  if (seoUseHero) {
    seoUseHero.addEventListener('change', applySeoUseHeroState);
  }

  const heroInput = document.getElementById('hero_image');
  if (heroInput) {
    heroInput.addEventListener('input', () => {
      const seoUse = document.getElementById('seo_use_hero');
      if (seoUse && seoUse.checked) applySeoUseHeroState();
    });
  }

  document.getElementById('page-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (tinymce.activeEditor) tinymce.activeEditor.save(); // Ensure tinyMCE saves to textarea

    const data = {
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      hero_image: document.getElementById('hero_image').value,
      is_home: document.getElementById('is_home')?.checked || false,
    };

    // Add SEO Link data if admin
    if (currentUser.role === 'ADMIN') {
      data.meta_title = document.getElementById('meta_title').value;
      data.meta_description = document.getElementById('meta_description').value;
      data.seo_image = document.getElementById('seo_image').value;
      data.seo_use_hero = document.getElementById('seo_use_hero')?.checked || false;
    }

    await fetch(`${ADMIN_API_URL}/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    closeModal();
    loadPages();
  });
};

// 2. Galleries (Sesje)
const CATEGORY_MAP = {
  wedding: 'Ślubna',
  portrait: 'Portretowa',
  product: 'Produktowa',
};

async function loadGalleries() {
  const container = document.getElementById('tab-galleries');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  const res = await fetch(`${ADMIN_API_URL}/galleries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const galleries = await res.json();
  window.allGalleries = galleries; // Store for filtering

  renderGalleries(galleries);
}

function renderGalleries(galleries) {
  const container = document.getElementById('tab-galleries');
  container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Sesje zdjęciowe</h2>
            <div class="flex gap-2">
                 <button onclick="filterGalleries('all')" class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gold hover:text-black transition-colors">Wszystkie</button>
                 <button onclick="filterGalleries('wedding')" class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gold hover:text-black transition-colors">Ślubne</button>
                 <button onclick="filterGalleries('portrait')" class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gold hover:text-black transition-colors">Portretowe</button>
                 <button onclick="filterGalleries('product')" class="px-3 py-1 text-sm rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gold hover:text-black transition-colors">Produktowe</button>
            </div>
            <button onclick="editGallery(null)" class="bg-gold text-black px-4 py-2 rounded font-bold hover:bg-gold-hover transition-colors shadow-lg shadow-gold/20 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Nowa sesja
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${galleries
              .map(
                (g) => `
                <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden group hover:border-gold/50 transition-colors shadow-sm">
                    <div class="h-48 bg-gray-100 dark:bg-black/50 relative">
                        ${g.items && g.items.length > 0 ? `<img src="${g.items[0].image_path}" class="w-full h-full object-cover">` : '<div class="flex items-center justify-center h-full text-gray-500">Brak zdjęć</div>'}
                        <div class="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-gold uppercase tracking-wider font-semibold">
                            ${CATEGORY_MAP[g.category] || g.category}
                        </div>
                    </div>
                    <div class="p-5">
                        <h3 class="font-display font-medium text-lg text-gray-900 dark:text-white mb-1 group-hover:text-gold transition-colors">${g.name || 'Bez nazwy'}</h3>
                        <p class="text-xs text-gray-500 uppercase tracking-widest mb-4">${g.items ? g.items.length : 0} zdjęć</p>
                        <button onclick="editGallery(${g.id})" class="w-full py-2 border border-gray-300 dark:border-white/10 rounded text-gray-600 dark:text-gray-300 hover:bg-gold hover:text-black hover:border-gold transition-colors font-medium">Edytuj</button>
                    </div>
                </div>
            `,
              )
              .join('')}
        </div>
    `;
}

window.filterGalleries = (category) => {
  if (category === 'all') {
    renderGalleries(window.allGalleries);
  } else {
    const filtered = window.allGalleries.filter((g) => g.category === category);
    renderGalleries(filtered);
  }
};

window.editGallery = async (id) => {
  // ... (rest of editGallery remains same, skipping for brevity, will rely on original file if not replaced)

  let gallery = { category: 'wedding', name: '', items: [] };
  if (id) {
    const res = await fetch(`${ADMIN_API_URL}/galleries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    gallery = all.find((g) => g.id === id) || gallery;
  }

  const html = `
        <div class="grid grid-cols-12 gap-8 h-[70vh]">
            <!-- Settings Sidebar -->
            <div class="col-span-4 space-y-6 border-r border-gray-200 dark:border-white/10 pr-6 overflow-y-auto">
                 <form id="gallery-form" class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Kategoria</label>
                        <select id="category" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">
                            <option value="wedding" ${gallery.category === 'wedding' ? 'selected' : ''}>Ślubna</option>
                            <option value="portrait" ${gallery.category === 'portrait' ? 'selected' : ''}>Portretowa</option>
                            <option value="product" ${gallery.category === 'product' ? 'selected' : ''}>Produktowa</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Nazwa</label>
                      <input type="text" id="name" value="${gallery.name || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">
                    </div>
                    
                    <button type="submit" class="w-full bg-gold text-black py-2 rounded font-bold hover:bg-gold-hover transition-colors">Zapisz Ustawienia</button>
                    
                    ${!id ? '<p class="text-xs text-center text-gray-500 mt-4">Zapisz sesję, aby móc dodawać zdjęcia.</p>' : ''}
                 </form>

                 ${
                   id
                     ? `
                    <div class="pt-6 border-t border-gray-200 dark:border-white/10">
                        <h4 class="text-gray-900 dark:text-white font-medium mb-4">Dodaj Zdjęcia</h4>
                        <button onclick="handleGalleryAddImages(${id})" class="w-full py-4 border-2 border-dashed border-gray-300 dark:border-white/10 rounded hover:border-gold/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-400 flex flex-col items-center justify-center gap-2">
                            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                            <span>Wybierz z biblioteki</span>
                        </button>
                    </div>
                 `
                     : ''
                 }
            </div>

            <!-- Images Grid -->
            <div class="col-span-8 overflow-y-auto pl-2">
                <div class="flex justify-between items-end mb-4">
                    <h3 class="text-xl font-display text-gray-900 dark:text-white">Zdjęcia (${gallery.items ? gallery.items.length : 0})</h3>
                    <span class="text-xs text-gray-500 uppercase tracking-wider">Przeciągnij by zmienić kolejność</span>
                </div>
                
                <div id="gallery-grid" class="grid grid-cols-4 gap-4 pb-10">
                    ${(gallery.items || [])
                      .map(
                        (item) => `
                        <div class="relative group aspect-square bg-gray-100 dark:bg-black rounded border border-gray-200 dark:border-white/10 cursor-move overflow-hidden" data-id="${item.id}">
                            <img src="${item.image_path}" class="w-full h-full object-cover">
                            <!-- Overlay -->
                            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onclick="deleteGalleryItem(${item.id}, ${id})" class="text-red-500 hover:text-red-400 p-2">
                                     <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        </div>
    `;

  openModal(id ? 'Edycja Sesji' : 'Nowa Sesja', html);

  // Save Form Logic
  document.getElementById('gallery-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      category: document.getElementById('category').value,
      name: document.getElementById('name').value,
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${ADMIN_API_URL}/galleries/${id}` : `${ADMIN_API_URL}/galleries`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const saved = await res.json();
      if (!id) {
        closeModal();
        editGallery(saved.id); // Reopen for uploads
      } else {
        loadGalleries(); // Just refresh list background
        alert('Zapisano ustawienia');
      }
    }
  });

  // Init Sortable if existing
  if (id) {
    const grid = document.getElementById('gallery-grid');
    if (grid) {
      Sortable.create(grid, {
        animation: 150,
        onEnd: async () => {
          const ids = Array.from(grid.children).map((el) => el.dataset.id);
          await fetch(`${ADMIN_API_URL}/gallery-items/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ items: ids }),
          });
        },
      });
    }
  }
};

window.handleGalleryAddImages = async (galleryId) => {
  openMediaPicker().then(async (url) => {
    // Create Item
    await fetch(`${ADMIN_API_URL}/gallery-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        gallery_id: galleryId,
        image_path: url,
        title: 'Image',
      }),
    });
    // Reload Modal
    closeModal();
    editGallery(galleryId);
  });
};

window.deleteGalleryItem = async (itemId, galleryId) => {
  if (!confirm('Usunąć zdjęcie?')) return;
  await fetch(`${ADMIN_API_URL}/gallery-items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  closeModal();
  editGallery(galleryId);
};

// 3. Testimonials
async function loadTestimonials() {
  const container = document.getElementById('tab-testimonials');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  const res = await fetch(`${ADMIN_API_URL}/testimonials`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const testimonials = await res.json();

  container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Opinie klientów</h2>
            <button onclick="editTestimonial(null)" class="bg-gold text-black px-4 py-2 rounded font-bold hover:bg-gold-hover transition-colors">Dodaj opinię</button>
        </div>
        <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm">
             <table class="w-full text-left">
                <thead class="bg-gray-50 dark:bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                    <th class="px-6 py-4">Avatar</th>
                        <th class="px-6 py-4">Klient</th>
                        <!-- <th class="px-6 py-4">Ocena</th> -->
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-white/5 text-sm text-gray-600 dark:text-gray-300">
                    ${testimonials
                      .map(
                        (t) => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td class="px-6 py-4">
                            ${t.avatar_image ? `<img src="${t.avatar_image}" class="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10" />` : '<span class="text-xs text-gray-400">Brak</span>'}
                          </td>
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${t.author}</td>
                             <!-- <td class="px-6 py-4 text-gold tracking-widest">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</td> -->
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded text-xs font-bold uppercase ${t.approved ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500'}">
                                    ${t.approved ? 'Widoczna' : 'Ukryta'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right space-x-2">
                                <button onclick="editTestimonial(${t.id})" class="text-gold hover:text-black dark:hover:text-white transition-colors font-medium">Edytuj</button>
                                <button onclick="deleteTestimonial(${t.id})" class="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">Usuń</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.editTestimonial = async (id) => {
  let t = {
    author: '',
    rating: 5,
    content: '',
    approved: false,
    gallery_id: null,
    avatar_image: '',
  };
  // Fetch galleries for dropdown
  const gRes = await fetch(`${ADMIN_API_URL}/galleries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const galleries = await gRes.json();

  if (id) {
    const res = await fetch(`${ADMIN_API_URL}/testimonials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    t = all.find((x) => x.id === id) || t;
  }

  const html = `
        <form id="t-form" class="space-y-6">
            <div class="grid grid-cols-1 gap-6">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Autor</label>
                    <input type="text" id="t_author" value="${t.author}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium" required>
                </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Avatar (wymagany)</label>
              <div class="flex items-center gap-4">
                <img id="t_avatar_preview" src="${t.avatar_image || ''}" class="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-white/10 ${t.avatar_image ? '' : 'hidden'}" />
                <div class="flex-1 space-y-2">
                  <input type="text" id="t_avatar" value="${t.avatar_image || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none" required>
                  <div class="flex gap-2">
                    <button type="button" onclick="openMediaPicker().then(url => setImageField('t_avatar','t_avatar_preview',url))" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                    <button type="button" onclick="clearImageField('t_avatar','t_avatar_preview')" class="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Usuń</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Treść</label>
                <textarea id="t_content" class="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold">${t.content || ''}</textarea>
            </div>
            
            <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Powiązana sesja (opcjonalnie)</label>
                <select id="t_gallery" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    <option value="">-- Brak --</option>
                    ${galleries
                      .map(
                        (g) => `
                        <option value="${g.id}" ${t.gallery_id === g.id ? 'selected' : ''}>${g.name || 'Bez nazwy'} (${g.category})</option>
                     `,
                      )
                      .join('')}
                </select>
            </div>

            <div class="flex items-center space-x-3 bg-gray-50 dark:bg-white/5 p-4 rounded border border-gray-200 dark:border-white/5">
                <input type="checkbox" id="t_approved" ${t.approved ? 'checked' : ''} class="w-5 h-5 accent-gold cursor-pointer">
                <label for="t_approved" class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none">Zatwierdzona (Publikuj na stronie)</label>
            </div>

            <button type="submit" class="w-full bg-gold text-black py-2 rounded font-bold hover:bg-gold-hover transition-colors">Zapisz</button>
        </form>
    `;

  openModal(id ? 'Edycja Opinii' : 'Nowa Opinia', html);

  document.getElementById('t-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      author: document.getElementById('t_author').value,
      rating: 5,
      content: document.getElementById('t_content').value,
      approved: document.getElementById('t_approved').checked,
      avatar_image: document.getElementById('t_avatar').value,
      gallery_id: document.getElementById('t_gallery').value
        ? Number(document.getElementById('t_gallery').value)
        : null,
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${ADMIN_API_URL}/testimonials/${id}` : `${ADMIN_API_URL}/testimonials`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    closeModal();
    loadTestimonials();
  });
};

window.deleteTestimonial = async (id) => {
  if (!confirm('Czy na pewno?')) return;
  await fetch(`${ADMIN_API_URL}/testimonials/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  loadTestimonials();
};

// 4. Settings
async function loadSettings() {
  const container = document.getElementById('tab-settings');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  const res = await fetch(`${API_URL}/settings`);
  const s = await res.json();

  container.innerHTML = `
        <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white mb-6">Ustawienia Globalne</h2>
        <!-- REMOVED max-w-2xl -->
        <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
             <form id="settings-form" class="space-y-6">
                 <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Nazwa Strony</label>
                         <input type="text" id="s_site_name" value="${s.site_name || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                     <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Telefon</label>
                         <input type="text" id="s_phone" value="${s.phone || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                 </div>
                  <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Email Kontaktowy</label>
                     <input type="email" id="s_email" value="${s.email || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                </div>
                 <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                     <h4 class="text-gold font-display font-medium">Media Społecznościowe</h4>
                      <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Instagram URL</label>
                         <input type="text" id="s_instagram" value="${s.instagram || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                     <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Facebook URL</label>
                         <input type="text" id="s_facebook" value="${s.facebook || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                 </div>

                 <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                   <h4 class="text-gold font-display font-medium">SEO (Domyślne)</h4>
                   <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Tytuł</label>
                    <input type="text" id="s_meta_title" value="${s.meta_title || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    <p class="text-xs text-gray-500">Długość: <span id="s_meta_title_count">0</span> / 50-60</p>
                  </div>
                  <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Opis</label>
                    <textarea id="s_meta_description" class="w-full h-20 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">${s.meta_description || ''}</textarea>
                    <p class="text-xs text-gray-500">Długość: <span id="s_meta_description_count">0</span> / 140-160</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">OG Image</label>
                    <div class="flex items-center gap-4">
                      <img id="s_og_image_preview" src="${s.og_image || ''}" class="w-20 h-20 rounded object-cover border border-gray-200 dark:border-white/10 ${s.og_image ? '' : 'hidden'}" />
                      <div class="flex-1 space-y-2">
                        <input type="text" id="s_og_image" value="${s.og_image || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none">
                        <div class="flex gap-2">
                          <button type="button" onclick="openMediaPicker().then(url => setImageField('s_og_image','s_og_image_preview',url))" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                          <button type="button" onclick="clearImageField('s_og_image','s_og_image_preview')" class="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Usuń</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Favicon</label>
                    <div class="flex items-center gap-4">
                      <img id="s_favicon_preview" src="${s.favicon || ''}" class="w-12 h-12 rounded object-cover border border-gray-200 dark:border-white/10 ${s.favicon ? '' : 'hidden'}" />
                      <div class="flex-1 space-y-2">
                        <input type="text" id="s_favicon" value="${s.favicon || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none">
                        <div class="flex gap-2">
                          <button type="button" onclick="openMediaPicker().then(url => setImageField('s_favicon','s_favicon_preview',url))" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                          <button type="button" onclick="clearImageField('s_favicon','s_favicon_preview')" class="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Usuń</button>
                        </div>
                      </div>
                    </div>
                  </div>
                 </div>

                  <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                    <h4 class="text-gold font-display font-medium">CTA i stopka</h4>
                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Tekst CTA</label>
                        <input type="text" id="s_cta_text" value="${s.cta_text || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                      </div>
                      <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">URL CTA</label>
                        <input type="text" id="s_cta_url" value="${s.cta_url || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                      </div>
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Tekst stopki</label>
                      <input type="text" id="s_footer_text" value="${s.footer_text || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">URL polityki prywatnosci</label>
                      <input type="text" id="s_privacy_url" value="${s.privacy_url || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                  </div>

                  <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                    <h4 class="text-gold font-display font-medium">Zaawansowane</h4>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Canonical base URL</label>
                      <input type="text" id="s_canonical_base_url" value="${s.canonical_base_url || ''}" placeholder="https://inlexistudio.com" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Dodatkowy kod w HEAD</label>
                      <textarea id="s_head_html" class="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">${s.head_html || ''}</textarea>
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Dodatkowy kod przed zamknieciem BODY</label>
                      <textarea id="s_body_html" class="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">${s.body_html || ''}</textarea>
                    </div>
                  </div>

                  <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                    <h4 class="text-gold font-display font-medium">Analityka (Umami)</h4>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Umami Script URL</label>
                      <input type="text" id="s_umami_script_url" value="${s.umami_script_url || ''}" placeholder="https://cloud.umami.is/script.js" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Umami Website ID</label>
                      <input type="text" id="s_umami_website_id" value="${s.umami_website_id || ''}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Dozwolone domeny (opcjonalnie)</label>
                      <input type="text" id="s_umami_domains" value="${s.umami_domains || ''}" placeholder="inlexistudio.com" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                    <div>
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Umami Dashboard URL (opcjonalnie)</label>
                      <input type="text" id="s_umami_dashboard_url" value="${s.umami_dashboard_url || ''}" placeholder="https://cloud.umami.is" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold mt-1 font-medium">
                    </div>
                  </div>

                 <div class="pt-6">
                    <button type="submit" class="w-full bg-gold text-black py-3 rounded font-bold hover:bg-gold-hover transition-colors shadow-lg shadow-gold/10">Zapisz Ustawienia</button>
                 </div>
             </form>
        </div>
    `;

  initMetaCounters();

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      site_name: document.getElementById('s_site_name').value,
      email: document.getElementById('s_email').value,
      phone: document.getElementById('s_phone').value,
      instagram: document.getElementById('s_instagram').value,
      facebook: document.getElementById('s_facebook').value,
      meta_title: document.getElementById('s_meta_title').value,
      meta_description: document.getElementById('s_meta_description').value,
      og_image: document.getElementById('s_og_image').value,
      favicon: document.getElementById('s_favicon').value,
      canonical_base_url: document.getElementById('s_canonical_base_url').value,
      head_html: document.getElementById('s_head_html').value,
      body_html: document.getElementById('s_body_html').value,
      cta_text: document.getElementById('s_cta_text').value,
      cta_url: document.getElementById('s_cta_url').value,
      footer_text: document.getElementById('s_footer_text').value,
      privacy_url: document.getElementById('s_privacy_url').value,
      umami_script_url: document.getElementById('s_umami_script_url').value,
      umami_website_id: document.getElementById('s_umami_website_id').value,
      umami_domains: document.getElementById('s_umami_domains').value,
      umami_dashboard_url: document.getElementById('s_umami_dashboard_url').value,
    };
    await fetch(`${ADMIN_API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    alert('Ustawienia zapisane!');
  });
}

// 5. Analytics (Umami)
async function loadAnalytics() {
  const container = document.getElementById('tab-analytics');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  const settingsRes = await fetch(`${API_URL}/settings`);
  const s = await settingsRes.json();
  const umamiDashboardUrl = resolveUmamiDashboardUrl(s);
  const websiteId = s.umami_website_id;

  if (!websiteId) {
    container.innerHTML = `
      <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
        <h2 class="text-2xl font-display text-gray-900 dark:text-white mb-3">Analityka (Umami)</h2>
        <p class="text-gray-500 dark:text-gray-400">Brak Website ID. Uzupelnij dane w zakladce Ustawienia.</p>
      </div>
    `;
    return;
  }

  const formatNumber = (value) => new Intl.NumberFormat('pl-PL').format(value || 0);
  const ranges = [
    { label: '7 dni', days: 7 },
    { label: '30 dni', days: 30 },
    { label: '90 dni', days: 90 },
  ];

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Analityka (Umami)</h2>
          <p class="text-sm text-gray-500">Podsumowanie ruchu na stronie</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex gap-2" id="analytics-range">
            ${ranges
              .map(
                (range, index) => `
                  <button type="button" data-days="${range.days}" class="px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border border-gray-200 dark:border-white/10 ${
                    index === 1
                      ? 'bg-gold text-black border-gold'
                      : 'text-gray-500 dark:text-gray-300'
                  }">
                    ${range.label}
                  </button>
                `,
              )
              .join('')}
          </div>
          <div class="flex items-center gap-2">
            <input id="analytics-from" type="date" class="rounded border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/20 px-2 py-1 text-xs text-gray-700 dark:text-gray-200" />
            <span class="text-xs text-gray-400">—</span>
            <input id="analytics-to" type="date" class="rounded border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/20 px-2 py-1 text-xs text-gray-700 dark:text-gray-200" />
            <button id="analytics-apply" type="button" class="rounded-full border border-gold px-3 py-1.5 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-colors">Filtruj</button>
          </div>
          <a href="${umamiDashboardUrl || '#'}" target="_blank" class="text-sm text-gold hover:text-white underline ${
            umamiDashboardUrl ? '' : 'opacity-50 pointer-events-none'
          }">Szczegolowa analityka</a>
        </div>
      </div>
      <div id="analytics-content" class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm"></div>
    </div>
  `;

  const content = document.getElementById('analytics-content');
  const rangeButtons = Array.from(document.querySelectorAll('#analytics-range button'));
  const fromInput = document.getElementById('analytics-from');
  const toInput = document.getElementById('analytics-to');
  const applyBtn = document.getElementById('analytics-apply');

  const toDateInput = (value) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setRangeInputs = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    if (fromInput) fromInput.value = toDateInput(start);
    if (toInput) toInput.value = toDateInput(end);
  };

  const buildDelta = (value, prev) => {
    if (!prev || !value) return '';
    const diff = ((value - prev) / prev) * 100;
    const sign = diff >= 0 ? '+' : '';
    const tone = diff >= 0 ? 'text-emerald-500' : 'text-rose-500';
    return `<span class="ml-2 text-xs ${tone}">${sign}${diff.toFixed(0)}%</span>`;
  };

  const buildLine = (series, stroke) => {
    if (!series.length) return '';
    const width = 320;
    const height = 120;
    const maxValue = Math.max(...series.map((point) => point.y || 0), 1);
    const step = series.length > 1 ? width / (series.length - 1) : width;
    const points = series
      .map((point, index) => {
        const x = Math.round(index * step);
        const y = Math.round(height - ((point.y || 0) / maxValue) * height);
        return `${x},${y}`;
      })
      .join(' ');
    const circles = series
      .map((point, index) => {
        const x = Math.round(index * step);
        const y = Math.round(height - ((point.y || 0) / maxValue) * height);
        const label = new Date(point.x).toLocaleDateString('pl-PL');
        return `
          <circle cx="${x}" cy="${y}" r="2" fill="${stroke}">
            <title>${label}: ${formatNumber(point.y)}</title>
          </circle>
        `;
      })
      .join('');
    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-32">
        <polyline fill="none" stroke="${stroke}" stroke-width="2" points="${points}" />
        ${circles}
      </svg>
    `;
  };

  const buildList = (items, emptyLabel) => {
    if (!items.length) {
      return `<p class="text-sm text-gray-400">${emptyLabel}</p>`;
    }
    return `
      <div class="space-y-2">
        ${items
          .map(
            (item) => `
              <div class="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                <span class="truncate">${item.x || '-'}</span>
                <span class="ml-4 text-gray-500 dark:text-gray-400">${formatNumber(item.y)}</span>
              </div>
            `,
          )
          .join('')}
      </div>
    `;
  };

  const buildSparkline = (series) => {
    if (!Array.isArray(series) || series.length === 0) return '';
    const width = 80;
    const height = 24;
    const maxValue = Math.max(...series.map((point) => point.y || 0), 1);
    const step = series.length > 1 ? width / (series.length - 1) : width;
    const points = series
      .map((point, index) => {
        const x = Math.round(index * step);
        const y = Math.round(height - ((point.y || 0) / maxValue) * height);
        return `${x},${y}`;
      })
      .join(' ');
    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-20 h-6">
        <polyline fill="none" stroke="#D4AF37" stroke-width="2" points="${points}" />
      </svg>
    `;
  };

  const buildBarList = (items, emptyLabel) => {
    if (!items.length) {
      return `<p class="text-sm text-gray-400">${emptyLabel}</p>`;
    }
    const maxValue = Math.max(...items.map((item) => item.y || 0), 1);
    return `
      <div class="space-y-3">
        ${items
          .map((item) => {
            const width = Math.round(((item.y || 0) / maxValue) * 100);
            return `
              <div>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span class="truncate">${item.x || '-'}</span>
                  <span>${formatNumber(item.y)}</span>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <div class="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-white/10">
                    <div class="h-1.5 rounded-full bg-gold" style="width:${width}%"></div>
                  </div>
                  ${buildSparkline(item.series || [])}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  };

  const mapCoords = {
    Poland: { x: 215, y: 70 },
    Germany: { x: 205, y: 72 },
    France: { x: 190, y: 78 },
    Spain: { x: 175, y: 90 },
    Italy: { x: 205, y: 88 },
    'United Kingdom': { x: 178, y: 60 },
    Ireland: { x: 168, y: 62 },
    Netherlands: { x: 198, y: 68 },
    Belgium: { x: 194, y: 72 },
    Sweden: { x: 220, y: 50 },
    Norway: { x: 210, y: 48 },
    Finland: { x: 232, y: 46 },
    Switzerland: { x: 200, y: 80 },
    Austria: { x: 215, y: 80 },
    Denmark: { x: 205, y: 60 },
    Portugal: { x: 165, y: 92 },
    'United States': { x: 70, y: 80 },
    Canada: { x: 60, y: 60 },
    Mexico: { x: 75, y: 98 },
    Brazil: { x: 115, y: 120 },
    Argentina: { x: 115, y: 140 },
    Australia: { x: 300, y: 120 },
    'New Zealand': { x: 325, y: 130 },
    Japan: { x: 295, y: 75 },
    China: { x: 270, y: 82 },
    India: { x: 250, y: 96 },
    Turkey: { x: 235, y: 88 },
  };

  const buildMapDots = (items) => {
    return items
      .map((item) => {
        const coords = mapCoords[item.x];
        if (!coords) return '';
        return `
          <circle cx="${coords.x}" cy="${coords.y}" r="3" fill="#D4AF37">
            <title>${item.x}: ${formatNumber(item.y)}</title>
          </circle>
        `;
      })
      .join('');
  };

  const renderAnalytics = (data, days) => {
    const stats = data.stats || {};
    const comparison = stats.comparison || {};
    const active = data.active || {};
    const topPages = data.topPages || [];
    const referrers = data.referrers || [];
    const countries = data.countries || [];
    const devices = data.devices || [];
    const browsers = data.browsers || [];
    const pageviewsSeries = (data.pageviews && data.pageviews.pageviews) || [];
    const sessionsSeries = (data.pageviews && data.pageviews.sessions) || [];

    if (!content) return;

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div class="p-5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
          <p class="text-xs uppercase tracking-widest text-gray-400">Aktywni teraz</p>
          <p class="mt-3 text-3xl font-display text-gray-900 dark:text-white">${formatNumber(
            active.visitors,
          )}</p>
        </div>
        <div class="p-5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
          <p class="text-xs uppercase tracking-widest text-gray-400">Odsłony</p>
          <p class="mt-3 text-3xl font-display text-gray-900 dark:text-white">${formatNumber(
            stats.pageviews,
          )}${buildDelta(stats.pageviews, comparison.pageviews)}</p>
        </div>
        <div class="p-5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
          <p class="text-xs uppercase tracking-widest text-gray-400">Unikalni</p>
          <p class="mt-3 text-3xl font-display text-gray-900 dark:text-white">${formatNumber(
            stats.visitors,
          )}${buildDelta(stats.visitors, comparison.visitors)}</p>
        </div>
        <div class="p-5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
          <p class="text-xs uppercase tracking-widest text-gray-400">Sesje</p>
          <p class="mt-3 text-3xl font-display text-gray-900 dark:text-white">${formatNumber(
            stats.visits,
          )}${buildDelta(stats.visits, comparison.visits)}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-8">
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm uppercase tracking-widest text-gray-400">Ruch (${days} dni)</h3>
              <p class="mt-2 text-lg font-medium text-gray-900 dark:text-white">Odsłony vs Sesje</p>
            </div>
            <div class="text-xs text-gray-400">Skala dzienna</div>
          </div>
          <div class="mt-6 grid grid-cols-1 gap-6">
            <div class="rounded-lg border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/30 p-4">
              <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-widest text-gray-400">Odsłony</p>
                <span class="text-xs text-gray-400">${formatNumber(stats.pageviews)}</span>
              </div>
              <div class="mt-3">${buildLine(pageviewsSeries, '#D4AF37')}</div>
            </div>
            <div class="rounded-lg border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/30 p-4">
              <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-widest text-gray-400">Sesje</p>
                <span class="text-xs text-gray-400">${formatNumber(stats.visits)}</span>
              </div>
              <div class="mt-3">${buildLine(sessionsSeries, '#7C7A6B')}</div>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400">Zaangazowanie</h3>
          <div class="mt-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div class="flex items-center justify-between">
              <span>Odbicia</span>
              <span class="text-gray-500">${formatNumber(stats.bounces)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Sredni czas</span>
              <span class="text-gray-500">${formatNumber(stats.totaltime)}s</span>
            </div>
          </div>
          <div class="mt-6 rounded-lg border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/30 p-4">
            <p class="text-xs uppercase tracking-widest text-gray-400">Mapa ruchu</p>
            <svg viewBox="0 0 360 160" class="mt-4 w-full h-32">
              <rect x="0" y="0" width="360" height="160" fill="none" stroke="#26231C" stroke-width="1" rx="12" />
              <path d="M35 55 L85 40 L110 60 L150 45 L185 70 L205 60 L235 75 L260 65 L305 85" fill="none" stroke="#3B372E" stroke-width="2" />
              <path d="M70 95 L110 110 L160 100 L200 120 L250 110 L290 120" fill="none" stroke="#3B372E" stroke-width="2" />
              <g fill="#2C2A23">
                <circle cx="70" cy="70" r="6" />
                <circle cx="115" cy="55" r="4" />
                <circle cx="150" cy="75" r="5" />
                <circle cx="200" cy="70" r="6" />
                <circle cx="255" cy="80" r="4" />
                <circle cx="300" cy="95" r="6" />
              </g>
              ${buildMapDots(countries.slice(0, 6))}
            </svg>
            <div class="mt-4 text-xs text-gray-500">Top kraje: ${
              countries
                .slice(0, 3)
                .map((item) => item.x)
                .join(', ') || 'Brak danych'
            }</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400 mb-4">Top strony (${days} dni)</h3>
          ${buildBarList(topPages, 'Brak danych o stronach.')}
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400 mb-4">Referrery (${days} dni)</h3>
          ${buildList(referrers, 'Brak danych o zrodlach.')}
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400 mb-4">Kraje (${days} dni)</h3>
          ${buildList(countries, 'Brak danych o krajach.')}
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400 mb-4">Srodowisko</h3>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-xs uppercase tracking-widest text-gray-400 mb-3">Urzadzenia</p>
              ${buildList(devices, 'Brak danych')}
            </div>
            <div>
              <p class="text-xs uppercase tracking-widest text-gray-400 mb-3">Przegladarki</p>
              ${buildList(browsers, 'Brak danych')}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const fetchAnalytics = async (startAt, endAt, days) => {
    if (!content) return;
    content.innerHTML =
      '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

    try {
      const res = await fetch(
        `${ADMIN_API_URL}/umami/summary?websiteId=${encodeURIComponent(
          websiteId,
        )}&startAt=${startAt}&endAt=${endAt}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udalo sie pobrac danych');
      renderAnalytics(data, days);
    } catch (err) {
      content.innerHTML = `<p class="text-red-500">${err.message}</p>`;
    }
  };

  const applyRange = (days) => {
    const endAt = Date.now();
    const startAt = endAt - days * 24 * 60 * 60 * 1000;
    setRangeInputs(days);
    fetchAnalytics(startAt, endAt, days);
  };

  rangeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      rangeButtons.forEach((b) => b.classList.remove('bg-gold', 'text-black', 'border-gold'));
      btn.classList.add('bg-gold', 'text-black', 'border-gold');
      const days = Number(btn.dataset.days || 30);
      applyRange(days);
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (!fromInput || !toInput || !fromInput.value || !toInput.value) return;
      const startAt = new Date(`${fromInput.value}T00:00:00`).getTime();
      const endAt = new Date(`${toInput.value}T23:59:59`).getTime();
      const diffDays = Math.max(1, Math.round((endAt - startAt) / (24 * 60 * 60 * 1000)));
      rangeButtons.forEach((b) => b.classList.remove('bg-gold', 'text-black', 'border-gold'));
      fetchAnalytics(startAt, endAt, diffDays);
    });
  }

  applyRange(30);
}

// --- Helpers ---
window.setImageField = (inputId, previewId, url) => {
  const input = document.getElementById(inputId);
  if (input) input.value = url || '';
  const preview = document.getElementById(previewId);
  if (preview) {
    if (url) {
      preview.src = url;
      preview.classList.remove('hidden');
    } else {
      preview.src = '';
      preview.classList.add('hidden');
    }
  }
};

window.clearImageField = (inputId, previewId) => {
  window.setImageField(inputId, previewId, '');
};

function initMetaCounters() {
  const counters = [
    { input: 'meta_title', counter: 'meta_title_count' },
    { input: 'meta_description', counter: 'meta_description_count' },
    { input: 's_meta_title', counter: 's_meta_title_count' },
    { input: 's_meta_description', counter: 's_meta_description_count' },
  ];

  counters.forEach(({ input, counter }) => {
    const inputEl = document.getElementById(input);
    const counterEl = document.getElementById(counter);
    if (!inputEl || !counterEl) return;
    const update = () => {
      counterEl.textContent = inputEl.value.length.toString();
    };
    update();
    inputEl.addEventListener('input', update);
  });
}

function applySeoUseHeroState() {
  const useHero = document.getElementById('seo_use_hero');
  const heroInput = document.getElementById('hero_image');
  const seoInput = document.getElementById('seo_image');
  const seoPick = document.getElementById('seo_image_pick');
  const seoClear = document.getElementById('seo_image_clear');

  if (!useHero || !seoInput) return;

  const heroValue = heroInput ? heroInput.value : '';
  if (useHero.checked) {
    if (!seoInput.dataset.customValue) {
      seoInput.dataset.customValue = seoInput.value;
    }
    window.setImageField('seo_image', 'seo_image_preview', heroValue || '');
    seoInput.disabled = true;
    if (seoPick) seoPick.disabled = true;
    if (seoClear) seoClear.disabled = true;
  } else {
    const custom = seoInput.dataset.customValue || '';
    window.setImageField('seo_image', 'seo_image_preview', custom);
    seoInput.disabled = false;
    if (seoPick) seoPick.disabled = false;
    if (seoClear) seoClear.disabled = false;
  }
}

function resolveUmamiDashboardUrl(settings) {
  if (!settings) return '';
  if (settings.umami_dashboard_url) return settings.umami_dashboard_url;
  if (!settings.umami_script_url) return '';
  return settings.umami_script_url.replace(/\/script\.js$/i, '');
}

function openModal(title, content) {
  dom.modalTitle.textContent = title;
  dom.modalContent.innerHTML = content;
  dom.modal.classList.remove('hidden');
}

function closeModal() {
  dom.modal.classList.add('hidden');
  if (window.tinymce) tinymce.remove();
}

function initTinyMCE() {
  // Dark/Light mode support for TinyMCE would be complex, sticking to dark or standard for now
  // Ideally we check document class but it needs re-init on toggle.
  // For now, keep as "oxide-dark" if user prefers dark mode, or make it neutral.
  const isDark = document.documentElement.classList.contains('dark');
  tinymce.init({
    selector: '.wysiwyg',
    height: 300,
    skin: isDark ? 'oxide-dark' : 'oxide',
    content_css: isDark ? 'dark' : 'default',
    plugins:
      'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
    toolbar:
      'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
  });
}
