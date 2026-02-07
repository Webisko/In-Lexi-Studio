const API_URL = 'http://localhost:1337/api';
const ADMIN_API_URL = 'http://localhost:1337/api/admin';

// --- Global State ---
let token = localStorage.getItem('token');
let currentUser = null;

// --- Selectors ---
const dom = {
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
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
if (token) {
  verifyToken();
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

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  dom.loginError.classList.add('hidden');

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
      if (currentUser.role !== 'ADMIN' && settingsTab) {
        settingsTab.classList.add('hidden'); // Hide Settings for non-admins
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

  // Parallel fetch for stats
  const [pages, testimonials, galleries] = await Promise.all([
    safeFetch(`${ADMIN_API_URL}/pages`),
    safeFetch(`${ADMIN_API_URL}/testimonials`),
    safeFetch(`${ADMIN_API_URL}/galleries`),
  ]);

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
                                <p class="text-white font-medium text-sm truncate">${g.name_pl}</p>
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
                     <a href="http://localhost:3000" target="_blank" class="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                        <span class="text-sm text-gray-600 dark:text-gray-300">Otwórz Umami</span>
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
  const hasHome = pages.find((p) => p.slug === '/' || p.slug === 'home');

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
                        <th class="px-6 py-4">Tytuł</th>
                        <th class="px-6 py-4">Slug</th>
                        <th class="px-6 py-4">Ostatnia Modyfikacja</th>
                        <th class="px-6 py-4 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-white/5 text-sm text-gray-600 dark:text-gray-300">
                    ${pages
                      .map(
                        (p) => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${p.title || '(Bez tytułu)'}</td>
                            <td class="px-6 py-4 text-gray-500 dark:text-gray-500">${p.slug}</td>
                            <td class="px-6 py-4">${new Date(p.updatedAt).toLocaleDateString()}</td>
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
}

window.seedHomePage = async () => {
  try {
    await fetch(`${ADMIN_API_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        slug: '/',
        title_pl: 'Strona Główna',
        title_en: 'Home Page',
        content_pl: '<p>Witaj na stronie głównej.</p>',
        content_en: '<p>Welcome to the home page.</p>',
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
            </div>
             <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Opis</label>
                <textarea id="meta_description" class="w-full h-20 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">${page.meta_description || ''}</textarea>
            </div>
             <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Miniaturka SEO (og:image)</label>
                <div class="flex gap-4 items-center">
                    <input type="text" id="seo_image" value="${page.seo_image || ''}" class="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none">
                    <button type="button" onclick="openMediaPicker().then(url => { document.getElementById('seo_image').value = url; })" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                </div>
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
                <div class="flex gap-4 items-center">
                    <input type="text" id="hero_image" value="${page.hero_image || ''}" class="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-gray-900 dark:text-white outline-none">
                    <button type="button" onclick="openMediaPicker().then(url => { document.getElementById('hero_image').value = url; })" class="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-2 rounded text-sm transition-colors text-gray-900 dark:text-white">Wybierz</button>
                </div>
            </div>

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

  document.getElementById('page-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (tinymce.activeEditor) tinymce.activeEditor.save(); // Ensure tinyMCE saves to textarea

    const data = {
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      hero_image: document.getElementById('hero_image').value,
    };

    // Add SEO Link data if admin
    if (currentUser.role === 'ADMIN') {
      data.meta_title = document.getElementById('meta_title').value;
      data.meta_description = document.getElementById('meta_description').value;
      data.seo_image = document.getElementById('seo_image').value;
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

  let gallery = { category: 'wedding', name_pl: '', name_en: '', items: [] };
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
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Nazwa (PL)</label>
                        <input type="text" id="name_pl" value="${gallery.name_pl || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Nazwa (EN)</label>
                        <input type="text" id="name_en" value="${gallery.name_en || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">
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
      name_pl: document.getElementById('name_pl').value,
      name_en: document.getElementById('name_en').value,
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
        title_en: 'Image',
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
  let t = { author: '', rating: 5, content: '', approved: false, gallery_id: null };
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

                 <div class="pt-6">
                    <button type="submit" class="w-full bg-gold text-black py-3 rounded font-bold hover:bg-gold-hover transition-colors shadow-lg shadow-gold/10">Zapisz Ustawienia</button>
                 </div>
             </form>
        </div>
    `;

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      site_name: document.getElementById('s_site_name').value,
      email: document.getElementById('s_email').value,
      phone: document.getElementById('s_phone').value,
      instagram: document.getElementById('s_instagram').value,
      facebook: document.getElementById('s_facebook').value,
    };
    await fetch(`${ADMIN_API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    alert('Ustawienia zapisane!');
  });
}

// --- Helpers ---
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
