const CMS_APP_VERSION = '2026-03-15-1';
console.info(`CMS app version: ${CMS_APP_VERSION}`);

function normalizeBaseUrl(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveApiBase() {
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocalPreview) {
    return normalizeBaseUrl(`${window.location.origin}/app/api`);
  }

  const meta = document.querySelector('meta[name="api-base"]');
  const metaValue = meta && meta.getAttribute('content');
  if (metaValue) return normalizeBaseUrl(metaValue);

  return normalizeBaseUrl(`${window.location.origin}/app/api`);
}

const API_URL = resolveApiBase();
const ADMIN_API_URL = `${API_URL}/admin`;
const resolveUploadsBase = () => {
  try {
    const api = new URL(API_URL);
    return `${api.origin}/uploads`;
  } catch (error) {
    return `${API_URL.replace(/\/api$/i, '')}/uploads`;
  }
};
const UPLOADS_BASE_URL = resolveUploadsBase();
const SITE_BASE_URL = API_URL.replace(/\/api$/i, '');
const FRONTEND_BASE_URL = SITE_BASE_URL.replace(/\/app$/i, '');

const resolveUploadsUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) {
    return path.replace(/\/app\/uploads\//i, '/uploads/');
  }
  if (/^\/?app\/uploads\//i.test(path)) {
    const trimmed = path.replace(/^\/?app\/uploads\//i, '');
    return `${UPLOADS_BASE_URL}/${trimmed}`;
  }
  if (/^\/?uploads\//i.test(path)) {
    const trimmed = path.replace(/^\/?uploads\//i, '');
    return `${UPLOADS_BASE_URL}/${trimmed}`;
  }
  if (path.startsWith('/')) return `${UPLOADS_BASE_URL}${path}`;
  return `${UPLOADS_BASE_URL}/${path}`;
};

const isLocalUploadsPath = (path) => /^\/?(?:app\/)?uploads\//i.test(String(path || ''));

const buildAdminImageFallbackMarkup = ({
  placeholderClass = 'flex h-full w-full items-center justify-center bg-gray-100 text-center text-gray-500 dark:bg-black/40 dark:text-gray-400',
  label = 'Brak obrazu',
  hint = '',
}) => `
  <div class="${placeholderClass}">
    <div class="space-y-1 px-4">
      <p class="text-sm font-medium text-gray-600 dark:text-gray-200">${escapeHtml(label)}</p>
      ${hint ? `<p class="text-xs text-gray-400 dark:text-gray-500">${escapeHtml(hint)}</p>` : ''}
    </div>
  </div>
`;

const getAdminImageHint = (path, hint = '') => {
  if (hint) return hint;
  if (isLocalUploadsPath(path)) return 'Brak pliku w public/uploads w lokalnym repo.';
  return 'Nie udało się załadować obrazu.';
};

const getAdminImageMarkup = (
  path,
  {
    alt = '',
    className = 'h-full w-full object-cover',
    placeholderClass,
    label = 'Brak obrazu',
    hint = '',
  } = {},
) => {
  const fallbackClass =
    placeholderClass ||
    'flex h-full w-full items-center justify-center bg-gray-100 text-center text-gray-500 dark:bg-black/40 dark:text-gray-400';
  if (!path) {
    return buildAdminImageFallbackMarkup({ placeholderClass: fallbackClass, label, hint });
  }

  return `<img src="${resolveUploadsUrl(path)}" class="${className}" alt="${escapeHtml(alt)}" data-fallback-class="${escapeHtml(fallbackClass)}" data-fallback-label="${escapeHtml(label)}" data-fallback-hint="${escapeHtml(getAdminImageHint(path, hint))}" onerror="handleAdminImageError(this)" />`;
};

function handleAdminImageError(img) {
  if (!img || img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.outerHTML = buildAdminImageFallbackMarkup({
    placeholderClass: img.dataset.fallbackClass,
    label: img.dataset.fallbackLabel,
    hint: img.dataset.fallbackHint,
  });
}

window.handleAdminImageError = handleAdminImageError;

const addVariantSuffix = (url, width) => url.replace(/\.webp(\?.*)?$/i, `-w${width}.webp$1`);
const getImageSrcSet = (path, widths = [160, 480, 960]) => {
  if (!path) return '';
  const url = resolveUploadsUrl(path);
  if (!/\.webp(\?.*)?$/i.test(url)) return '';
  return widths.map((width) => `${addVariantSuffix(url, width)} ${width}w`).join(', ');
};

// --- Global State ---
let token = localStorage.getItem('token');
let currentUser = null;
let resetToken = null;
let mediaViewMode = 'grid';
let mediaFilterQuery = '';
let mediaTagFilter = '';
let mediaUploadTag = 'other';
let pagesViewMode = 'grid';
let pagesFilterQuery = '';
let pagesFilterCategory = 'all';
let galleriesViewMode = 'grid';
let galleriesFilterQuery = '';
let galleriesFilterCategory = 'all';
let testimonialsViewMode = 'list';
let testimonialsFilterQuery = '';
let testimonialsFilterCategory = 'all';

const SAVE_ICON_HTML =
  '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
const SAVE_LABEL_HTML = `${SAVE_ICON_HTML}<span>Zapisz</span>`;
const PLUS_ICON_HTML =
  '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>';
const mediaMetaCache = new Map();

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const CONTENT_SEARCH_INPUT_CLASS =
  'w-64 max-w-full rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-gold focus:outline-none';
const CONTENT_ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded bg-gold px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-hover shadow-lg shadow-gold/20';

const getToggleButtonClass = (active) => getTagPillClass(active);

const getTagPillClass = (active) =>
  `px-3 py-1.5 rounded-full text-xs border border-gray-200 dark:border-white/10 transition-colors ${
    active
      ? 'bg-gold text-black border-gold'
      : 'text-gray-500 dark:text-gray-300 hover:border-gold hover:text-gold'
  }`;

const GRID_BADGE_CLASS =
  'absolute top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-gold';
const GRID_BADGE_LEFT_CLASS = `${GRID_BADGE_CLASS} left-3`;
const GRID_BADGE_RIGHT_CLASS = `${GRID_BADGE_CLASS} right-3`;
const GRID_STATUS_BADGE_CLASS =
  'absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-gold';

const DEFAULT_WEDDING_SESSION_TYPES = [
  {
    title: 'Getting Ready Session',
    image: '/uploads/ils-185.webp',
    description:
      'A documentary-style shoot capturing the anticipation and preparation before the ceremony.',
    items: [
      'Bride and bridesmaids getting hair and makeup done',
      'Groom and groomsmen putting on suits',
      'Candid moments of nervous excitement',
      'Detail shots of wedding attire, jewellery, and accessories',
    ],
  },
  {
    title: 'Engagement Photoshoot',
    image: '/uploads/ils-195.webp',
    description:
      'A relaxed pre-wedding session — our chance to work together so you feel completely at ease in front of my camera before the big day.',
    items: [
      'Casual and romantic outdoor locations',
      'Urban settings in Glasgow or scenic Scottish landscapes',
      'Perfect images for save-the-date cards',
    ],
  },
  {
    title: 'Traditional Ceremony Coverage',
    image: '/uploads/ils-212.webp',
    description:
      'Discreet, full coverage of your ceremony — from the first arrival to the final kiss.',
    items: [
      'Processional and recessional',
      'Exchange of vows and rings',
      'Reactions of family and guests',
      'Formal family group portraits',
    ],
  },
  {
    title: "Couple's Romantic Portraits",
    image: '/uploads/ils-197.webp',
    description:
      'A dedicated window of time during your day for relaxed, intimate portraits of just the two of you.',
    items: [
      'Golden hour photography',
      'Dramatic landscape backgrounds',
      'Intimate, romantic poses',
    ],
  },
  {
    title: 'Reception Reportage',
    image: '/uploads/ils-206.webp',
    description:
      'Pure documentary coverage of your reception — speeches, first dance, and everything in between.',
    items: ['First dance', 'Speeches and toasts', 'Guest interactions', 'Dance floor energy'],
  },
  {
    title: 'Destination Wedding Coverage',
    image: '/uploads/ils-166.webp',
    description:
      "Wherever your love story takes you, I'll be there with you to capture every moment.",
    items: [
      'Full-day or multi-day coverage',
      'Travel-friendly packages',
      'Comprehensive documentation of destination events',
    ],
  },
  {
    title: 'Sunrise / Sunset Session',
    image: '/uploads/ils-100.webp',
    description:
      'A dedicated golden-hour shoot at your venue or a nearby location for truly ethereal light.',
    items: ['Golden hour timing', 'Romantic lighting conditions', 'Location selection and setup'],
  },
  {
    title: 'After-Wedding / Trash the Dress',
    image: '/uploads/ils-177.webp',
    description:
      'An adventurous post-wedding shoot in your attire — relaxed, creative, and free from the timeline pressure of the day itself.',
    items: ['Creative outfit session', 'Adventurous locations', 'Fun and candid moments'],
  },
  {
    title: 'Micro-Wedding & Elopement Coverage',
    image: '/uploads/ils-154.webp',
    description:
      'Intimate celebrations for just the two of you — or a small circle of loved ones in a landscape that moves you.',
    items: ['Intimate ceremony', 'Scenic couple portraits', 'Celebration with close loved ones'],
  },
];

const LEGACY_WEDDING_SESSION_TYPE_ITEMS = {
  'Getting Ready Session': [
    'Preparations and getting ready',
    'Details and rings exchange',
    'Final moments before ceremony',
  ],
  'Engagement Photoshoot': [
    'Relaxed couple portraits',
    'Candid moments and interactions',
    'Location exploration',
  ],
  'Traditional Ceremony Coverage': [
    'Bride and groom preparations',
    'Full ceremony documentation',
    'Entourage and key moments',
  ],
  "Couple's Romantic Portraits": [
    'Intimate couples session',
    'Romantic outdoor portraits',
    'Creative couple poses',
  ],
  'Reception Reportage': [
    'Speeches and toasts',
    'First dance and celebrations',
    'Guest interactions and dancing',
  ],
  'Destination Wedding Coverage': [
    'Travel to destination',
    'Full event coverage',
    'Scenic location portraits',
  ],
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Brak danych';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
};

const getMediaPreviewMeta = async (url) => {
  const key = String(url || '');
  if (!key) return { dimensions: 'Brak danych', size: 'Brak danych' };
  if (mediaMetaCache.has(key)) return mediaMetaCache.get(key);

  const info = { dimensions: 'Brak danych', size: 'Brak danych' };
  const fullUrl = resolveUploadsUrl(key);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = fullUrl;
    });
    info.dimensions = `${img.naturalWidth} x ${img.naturalHeight}px`;
  } catch (error) {
    // Keep fallback values if image metadata cannot be read.
  }

  try {
    const head = await fetch(fullUrl, { method: 'HEAD' });
    const length = Number(head.headers.get('content-length') || '0');
    if (head.ok && length > 0) {
      info.size = formatBytes(length);
    }
  } catch (error) {
    // Keep fallback values if content length cannot be read.
  }

  if (info.size === 'Brak danych') {
    try {
      const response = await fetch(fullUrl, { cache: 'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          info.size = formatBytes(blob.size);
        }
      }
    } catch (error) {
      // Keep fallback values if file size cannot be read.
    }
  }

  mediaMetaCache.set(key, info);
  return info;
};

const ensureUploadToast = () => {
  let toast = document.getElementById('upload-toast');
  if (toast) return toast;
  toast = document.createElement('div');
  toast.id = 'upload-toast';
  toast.className =
    'fixed bottom-4 right-4 z-[80] hidden w-80 rounded-xl border border-white/10 bg-black/80 p-4 text-white shadow-xl backdrop-blur';
  toast.innerHTML = `
    <p id="upload-toast-title" class="text-sm font-semibold">Przesylanie</p>
    <p id="upload-toast-message" class="mt-1 text-xs text-gray-300">Start...</p>
    <div class="mt-3 h-1.5 w-full rounded-full bg-white/10">
      <div id="upload-toast-bar" class="h-1.5 rounded-full bg-gold transition-all" style="width:0%"></div>
    </div>
  `;
  document.body.appendChild(toast);
  return toast;
};

const updateUploadToast = ({ title, message, percent, visible }) => {
  const toast = ensureUploadToast();
  const titleEl = document.getElementById('upload-toast-title');
  const messageEl = document.getElementById('upload-toast-message');
  const barEl = document.getElementById('upload-toast-bar');
  if (titleEl && title) titleEl.textContent = title;
  if (messageEl && message) messageEl.textContent = message;
  if (barEl && typeof percent === 'number') barEl.style.width = `${percent}%`;
  if (typeof visible === 'boolean') {
    toast.classList.toggle('hidden', !visible);
  }
};

const uploadFileWithProgress = (file, onProgress, options = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${ADMIN_API_URL}/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress(event.loaded / event.total);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText || '{}'));
        } catch (err) {
          resolve({});
        }
      } else {
        reject(new Error('Upload failed'));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    const formData = new FormData();
    formData.append('image', file);
    if (options.baseName) formData.append('baseName', options.baseName);
    if (options.overwrite) formData.append('overwrite', 'true');
    if (options.tag) formData.append('tag', options.tag);
    xhr.send(formData);
  });
};

const checkUploadConflict = async (name) => {
  const res = await fetch(`${ADMIN_API_URL}/upload/check?name=${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Conflict check failed');
  return res.json();
};

const ensureUploadConflictModal = () => {
  let modal = document.getElementById('upload-conflict-modal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'upload-conflict-modal';
  modal.className = 'fixed inset-0 z-[90] hidden items-center justify-center bg-black/70 p-4';
  modal.innerHTML = `
    <div class="w-full max-w-4xl rounded-xl border border-white/10 bg-dark-secondary p-6 text-off-white shadow-2xl">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold">Plik o tej nazwie już istnieje</h3>
          <p class="text-sm text-gray-400">Porównaj zdjęcia i wybierz, co zrobić.</p>
        </div>
        <button type="button" id="upload-conflict-close" class="text-gray-400 hover:text-white">✕</button>
      </div>
      <div class="mt-6 grid gap-6 md:grid-cols-2">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-widest text-gray-400">Aktualne zdjęcie</p>
          <div class="overflow-hidden rounded-lg border border-white/10 bg-black">
            <img id="upload-conflict-existing" class="h-64 w-full object-cover" />
          </div>
        </div>
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-widest text-gray-400">Nowe zdjęcie</p>
          <div class="overflow-hidden rounded-lg border border-white/10 bg-black">
            <img id="upload-conflict-new" class="h-64 w-full object-cover" />
          </div>
        </div>
      </div>
      <div class="mt-6 space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Nowa nazwa (jeśli zmieniasz)</label>
        <input id="upload-conflict-rename" type="text" class="w-full rounded border border-white/10 bg-black/40 p-2 text-off-white focus:border-gold focus:outline-none" placeholder="Wpisz nową nazwę" />
        <p id="upload-conflict-error" class="hidden text-xs text-red-400"></p>
      </div>
      <div id="upload-conflict-apply-wrap" class="mt-4 hidden items-center justify-end">
        <label class="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-300">
          <input id="upload-conflict-apply-all" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-black/40 text-gold focus:ring-gold" />
          Zastosuj tę decyzję do wszystkich konfliktów
        </label>
      </div>
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" id="upload-conflict-skip" class="rounded border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/30">Anuluj ten plik</button>
        <button type="button" id="upload-conflict-cancel-all" class="hidden rounded border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:border-red-300 hover:text-red-200">Anuluj cały upload</button>
        <button type="button" id="upload-conflict-rename-btn" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 hover:bg-gray-300">Zmień nazwę</button>
        <button type="button" id="upload-conflict-replace" class="rounded bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-hover">Zastąp</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
};

const showUploadConflictModal = ({
  existingUrl,
  newFile,
  baseName,
  allowCancelAll = false,
  allowApplyToAll = false,
}) => {
  return new Promise((resolve) => {
    const modal = ensureUploadConflictModal();
    const existingImg = document.getElementById('upload-conflict-existing');
    const newImg = document.getElementById('upload-conflict-new');
    const renameInput = document.getElementById('upload-conflict-rename');
    const errorEl = document.getElementById('upload-conflict-error');
    const closeBtn = document.getElementById('upload-conflict-close');
    const skipBtn = document.getElementById('upload-conflict-skip');
    const cancelAllBtn = document.getElementById('upload-conflict-cancel-all');
    const renameBtn = document.getElementById('upload-conflict-rename-btn');
    const replaceBtn = document.getElementById('upload-conflict-replace');
    const applyWrap = document.getElementById('upload-conflict-apply-wrap');
    const applyAllCheckbox = document.getElementById('upload-conflict-apply-all');

    const previewUrl = URL.createObjectURL(newFile);
    if (existingImg) existingImg.src = resolveUploadsUrl(existingUrl);
    if (newImg) newImg.src = previewUrl;
    if (renameInput) renameInput.value = '';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    if (applyWrap) {
      applyWrap.classList.toggle('hidden', !allowApplyToAll);
      applyWrap.classList.toggle('flex', allowApplyToAll);
    }
    if (applyAllCheckbox) {
      applyAllCheckbox.checked = false;
      applyAllCheckbox.disabled = !allowApplyToAll;
    }
    if (cancelAllBtn) {
      cancelAllBtn.classList.toggle('hidden', !allowCancelAll);
    }

    const cleanup = (result) => {
      URL.revokeObjectURL(previewUrl);
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      resolve(result);
    };

    const showError = (message) => {
      if (!errorEl) return;
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    };

    const withApplyAll = (result) => ({
      ...result,
      applyToAll: Boolean(allowApplyToAll && applyAllCheckbox?.checked),
    });

    const handleClose = () => cleanup({ action: 'skip', applyToAll: false });
    const handleSkip = () => cleanup(withApplyAll({ action: 'skip' }));
    const handleCancelAll = () => cleanup({ action: 'cancel-all', applyToAll: false });
    const handleReplace = () => cleanup(withApplyAll({ action: 'replace', baseName }));

    const handleRename = async () => {
      const value = renameInput?.value?.trim();
      if (!value) {
        showError('Podaj nową nazwę pliku.');
        return;
      }
      try {
        const check = await checkUploadConflict(value);
        if (check.exists) {
          showError('Taka nazwa już istnieje. Podaj inną nazwę.');
          return;
        }
        cleanup({ action: 'rename', baseName: value, applyToAll: false });
      } catch (err) {
        showError('Nie udało się sprawdzić nazwy. Spróbuj ponownie.');
      }
    };

    closeBtn.onclick = handleClose;
    skipBtn.onclick = handleSkip;
    if (cancelAllBtn) cancelAllBtn.onclick = handleCancelAll;
    replaceBtn.onclick = handleReplace;
    renameBtn.onclick = handleRename;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  });
};

const uploadFileWithResolution = async (file, onProgress, options = {}) => {
  const conflict = await checkUploadConflict(file.name);
  if (conflict.exists) {
    const conflictPolicy = options.conflictPolicy;
    if (conflictPolicy?.enabled && conflictPolicy.action) {
      if (conflictPolicy.action === 'skip') {
        return null;
      }
      if (conflictPolicy.action === 'replace') {
        return uploadFileWithProgress(file, onProgress, {
          baseName: conflict.baseName,
          overwrite: true,
          tag: options.tag,
        });
      }
    }

    const decision = await showUploadConflictModal({
      existingUrl: conflict.url,
      newFile: file,
      baseName: conflict.baseName,
      allowCancelAll: Boolean(options.allowCancelAll),
      allowApplyToAll: Boolean(options.allowApplyToAll),
    });
    if (decision.applyToAll && conflictPolicy) {
      if (decision.action === 'skip' || decision.action === 'replace') {
        conflictPolicy.enabled = true;
        conflictPolicy.action = decision.action;
      }
    }
    if (decision.action === 'cancel-all') return { cancelAll: true };
    if (decision.action === 'skip') return null;
    if (decision.action === 'replace') {
      return uploadFileWithProgress(file, onProgress, {
        baseName: conflict.baseName,
        overwrite: true,
        tag: options.tag,
      });
    }
    if (decision.action === 'rename') {
      return uploadFileWithProgress(file, onProgress, {
        baseName: decision.baseName,
        tag: options.tag,
      });
    }
  }

  return uploadFileWithProgress(file, onProgress, {
    baseName: conflict.baseName,
    tag: options.tag,
  });
};

const uploadFilesWithProgress = async (fileList, onComplete, tag = 'other') => {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  updateUploadToast({ title: 'Przesylanie', message: 'Start...', percent: 0, visible: true });
  const conflictPolicy = { enabled: false, action: null };

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const baseMessage = `Plik ${i + 1}/${files.length}: ${file.name}`;
    dom.mediaStatus.textContent = baseMessage;
    try {
      const result = await uploadFileWithResolution(
        file,
        (ratio) => {
          const percent = Math.round(((i + ratio) / files.length) * 100);
          updateUploadToast({ message: baseMessage, percent });
        },
        {
          tag,
          allowCancelAll: true,
          allowApplyToAll: true,
          conflictPolicy,
        },
      );

      if (result?.cancelAll) {
        updateUploadToast({
          title: 'Anulowano',
          message: 'Upload został anulowany przez użytkownika.',
          percent: Math.round((i / files.length) * 100),
        });
        dom.mediaStatus.textContent = 'Upload anulowany.';
        setTimeout(() => updateUploadToast({ visible: false }), 2500);
        return;
      }
    } catch (err) {
      updateUploadToast({
        title: 'Blad',
        message: `Nie udalo sie przeslac: ${file.name}`,
        percent: 0,
      });
      dom.mediaStatus.textContent = 'Blad przesylania.';
      setTimeout(() => updateUploadToast({ visible: false }), 3000);
      return;
    }
  }

  updateUploadToast({ title: 'Gotowe', message: 'Pliki przeslane.', percent: 100 });
  dom.mediaStatus.textContent = 'Gotowe!';
  setTimeout(() => updateUploadToast({ visible: false }), 2000);
  if (typeof onComplete === 'function') onComplete();
};

const getResetTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('reset');
};

const syncAdminFavicon = async () => {
  const faviconEl = document.getElementById('admin-favicon');
  if (!(faviconEl instanceof HTMLLinkElement)) return;

  try {
    const res = await fetch(`${API_URL}/settings`);
    if (!res.ok) return;
    const settings = await res.json();
    const faviconUrl = settings?.favicon ? resolveUploadsUrl(settings.favicon) : '/favicon.svg';
    faviconEl.href = faviconUrl;
  } catch (error) {
    // Keep default favicon if settings cannot be loaded.
  }
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
  modalHeaderAccessory: document.getElementById('modal-header-accessory'),
  modalPrimaryAction: document.getElementById('modal-primary-action'),
  closeModalBtn: document.getElementById('close-modal'),
  // Media Picker
  mediaModal: document.getElementById('media-modal'),
  closeMediaBtn: document.getElementById('close-media-modal'),
  mediaTitle: document.getElementById('media-modal-title'),
  mediaSearch: document.getElementById('media-search'),
  mediaGrid: document.getElementById('media-library-grid'),
  mediaUploadInput: document.getElementById('global-file-upload'),
  mediaStatus: document.getElementById('media-status'),
  mediaConfirmBtn: document.getElementById('media-confirm'),
  mediaSelectionCount: document.getElementById('media-selection-count'),
  adminFavicon: document.getElementById('admin-favicon'),
  themeToggle: document.getElementById('theme-toggle'),
  megaMenu: document.getElementById('mega-menu'),
  megaMenuToggle: document.getElementById('mega-menu-toggle'),
  megaMenuClose: document.getElementById('mega-menu-close'),
  megaMenuBackdrop: document.getElementById('mega-menu-backdrop'),
  megaMenuList: document.getElementById('mega-menu-list'),
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

syncAdminFavicon();

// --- Event Listeners ---
dom.loginForm.addEventListener('submit', handleLogin);
if (dom.forgotLink) dom.forgotLink.addEventListener('click', showForgot);
if (dom.forgotForm) dom.forgotForm.addEventListener('submit', handleForgotPassword);
if (dom.backToLoginFromForgot) dom.backToLoginFromForgot.addEventListener('click', showLogin);
if (dom.resetForm) dom.resetForm.addEventListener('submit', handleResetPassword);
if (dom.backToLoginFromReset) dom.backToLoginFromReset.addEventListener('click', showLogin);
dom.closeModalBtn.addEventListener('click', closeModal);
dom.closeMediaBtn.addEventListener('click', () => {
  closeMediaPicker(null);
});

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

const buildPageUrl = (slug) => {
  const normalized = String(slug || '').replace(/^\/+/, '');
  if (!normalized || normalized === 'home') return `${SITE_BASE_URL}/`;
  return `${SITE_BASE_URL}/${normalized}`;
};

const renderMegaMenuPages = (pages) => {
  if (!dom.megaMenuList) return;
  if (!Array.isArray(pages) || pages.length === 0) {
    dom.megaMenuList.innerHTML =
      '<div class="col-span-full rounded-xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">Brak stron do wyswietlenia.</div>';
    return;
  }

  const ordered = [...pages].sort((a, b) => {
    const orderDiff = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (orderDiff !== 0) return orderDiff;
    const aDate = new Date(a.updated_at || a.updatedAt || 0).getTime();
    const bDate = new Date(b.updated_at || b.updatedAt || 0).getTime();
    return bDate - aDate;
  });

  dom.megaMenuList.innerHTML = ordered
    .map((page) => {
      const title = page.title || page.slug || 'Bez tytulu';
      const slug = page.slug || '';
      const normalized = String(slug || '').replace(/^\/+/, '');
      const label = !normalized || normalized === 'home' ? 'Strona glowna' : `/${normalized}`;
      const url = buildPageUrl(slug);
      return `
        <a
          href="${url}"
          target="_blank"
          class="group rounded-xl border border-white/15 bg-white/5 p-5 text-white/80 transition hover:border-white/40 hover:bg-white/10"
        >
          <p class="text-xs uppercase tracking-[0.3em] text-white/50">${label}</p>
          <h3 class="mt-3 font-display text-2xl text-white group-hover:text-white">${title}</h3>
          <p class="mt-2 text-xs uppercase tracking-[0.25em] text-white/60">Otworz strone</p>
        </a>
      `;
    })
    .join('');
};

const loadMegaMenuPages = async () => {
  if (!dom.megaMenuList) return;
  dom.megaMenuList.innerHTML =
    '<div class="col-span-full flex items-center justify-center py-12 text-sm text-white/70">Ladowanie stron...</div>';
  try {
    const res = await fetch(`${ADMIN_API_URL}/pages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load pages');
    const pages = await res.json();
    renderMegaMenuPages(pages || []);
  } catch (err) {
    dom.megaMenuList.innerHTML =
      '<div class="col-span-full rounded-xl border border-white/20 bg-white/10 p-6 text-sm text-white/80">Nie udalo sie pobrac stron.</div>';
  }
};

const openMegaMenu = async () => {
  if (!dom.megaMenu) return;
  dom.megaMenu.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  await loadMegaMenuPages();
};

const closeMegaMenu = () => {
  if (!dom.megaMenu) return;
  dom.megaMenu.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
};

if (dom.megaMenuToggle) {
  dom.megaMenuToggle.addEventListener('click', openMegaMenu);
}
if (dom.megaMenuClose) {
  dom.megaMenuClose.addEventListener('click', closeMegaMenu);
}
if (dom.megaMenuBackdrop) {
  dom.megaMenuBackdrop.addEventListener('click', closeMegaMenu);
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMegaMenu();
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
const mediaPickerState = {
  multiple: false,
  selected: new Set(),
  query: '',
  tag: 'all',
  resolve: null,
};

const MEDIA_TAG_LABELS = {
  all: 'Wszystkie',
  wedding: 'Ślubne',
  portrait: 'Portretowe',
  product: 'Produktowe',
  other: 'Inne',
};

const getMediaTagLabel = (tag) => MEDIA_TAG_LABELS[String(tag || '').toLowerCase()] || 'Inne';

const updateMediaPickerUi = () => {
  const isMulti = mediaPickerState.multiple;
  if (dom.mediaTitle) {
    dom.mediaTitle.textContent = isMulti ? 'Wybierz zdjęcia' : 'Wybierz zdjęcie';
  }
  if (dom.mediaSearch) {
    dom.mediaSearch.value = mediaPickerState.query || '';
  }
  if (dom.mediaConfirmBtn) {
    dom.mediaConfirmBtn.classList.toggle('hidden', !isMulti);
  }
  if (dom.mediaSelectionCount) {
    dom.mediaSelectionCount.classList.toggle('hidden', !isMulti);
    dom.mediaSelectionCount.textContent = `${mediaPickerState.selected.size} wybranych`;
  }

  document.querySelectorAll('[data-media-picker-tag]').forEach((button) => {
    const value = button.getAttribute('data-media-picker-tag') || 'all';
    const isActive = value === mediaPickerState.tag;
    button.classList.toggle('bg-gold', isActive);
    button.classList.toggle('text-black', isActive);
    button.classList.toggle('border-gold', isActive);
    button.classList.toggle('text-white/80', !isActive);
  });
};

const closeMediaPicker = (result) => {
  dom.mediaModal.classList.add('hidden');
  dom.mediaModal.classList.remove('flex');
  if (mediaPickerState.resolve) {
    mediaPickerState.resolve(result);
  }
  mediaPickerState.resolve = null;
  mediaPickerState.selected.clear();
  mediaPickerState.multiple = false;
  mediaPickerState.tag = 'all';
  updateMediaPickerUi();
};

async function openMediaPicker(options = {}) {
  const { multiple = false, selected = [] } = options;
  return new Promise((resolve) => {
    mediaPickerState.multiple = Boolean(multiple);
    mediaPickerState.selected = new Set(selected || []);
    mediaPickerState.query = '';
    mediaPickerState.tag = 'all';
    mediaPickerState.resolve = resolve;
    updateMediaPickerUi();
    dom.mediaModal.classList.remove('hidden');
    dom.mediaModal.classList.add('flex');
    const mediaScrollable = dom.mediaGrid?.closest('.overflow-y-auto');
    if (mediaScrollable instanceof HTMLElement) {
      mediaScrollable.scrollTop = 0;
    }
    loadMediaLibrary();
  });
}

if (dom.mediaSearch) {
  dom.mediaSearch.addEventListener('input', (event) => {
    mediaPickerState.query = event.target.value || '';
    loadMediaLibrary();
  });
}

if (dom.mediaConfirmBtn) {
  dom.mediaConfirmBtn.addEventListener('click', () => {
    const selected = Array.from(mediaPickerState.selected);
    closeMediaPicker(selected);
  });
}

if (dom.mediaUploadInput) {
  dom.mediaUploadInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const selectedTag = mediaPickerState.tag || 'other';
    const uploadTag = selectedTag === 'all' ? 'other' : selectedTag;

    await uploadFilesWithProgress(
      files,
      () => {
        loadMediaLibrary();
      },
      uploadTag,
    );
  });
}

document.querySelectorAll('[data-media-picker-tag]').forEach((button) => {
  button.addEventListener('click', () => {
    mediaPickerState.tag = button.getAttribute('data-media-picker-tag') || 'all';
    updateMediaPickerUi();
    loadMediaLibrary();
  });
});

async function loadMediaLibrary() {
  dom.mediaGrid.innerHTML =
    '<div class="col-span-4 text-center text-gray-400 loader mx-auto w-8 h-8 rounded-full border-2 border-t-gold"></div>';
  try {
    const res = await fetch(`${ADMIN_API_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const files = await res.json();
    const query = (mediaPickerState.query || '').trim().toLowerCase();
    const activeTag = mediaPickerState.tag || 'all';
    const filteredFiles = (files || []).filter((file) => {
      if (activeTag !== 'all' && String(file.tag || '').toLowerCase() !== activeTag) {
        return false;
      }
      if (!query) return true;
      const haystack =
        `${file.name || ''} ${file.tag || ''} ${getMediaTagLabel(file.tag)}`.toLowerCase();
      return haystack.includes(query);
    });

    dom.mediaGrid.innerHTML = filteredFiles
      .map((f) => {
        const isSelected = mediaPickerState.selected.has(f.url);
        return `
            <div class="cursor-pointer group relative aspect-square bg-gray-900 rounded border border-white/5 overflow-hidden hover:border-gold transition-colors ${
              isSelected ? 'ring-2 ring-gold border-gold' : ''
            }" data-media-url="${f.url}" onclick="selectMedia('${f.url}')">
              <img src="${resolveUploadsUrl(f.url)}" class="w-full h-full object-cover" onerror="console.error('Media preview failed', this.src)">
              <span class="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">${getMediaTagLabel(f.tag)}</span>
              <div class="absolute inset-0 bg-black/50 ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } flex items-center justify-center transition-opacity">
                <span class="text-xs text-white">${isSelected ? 'Wybrane' : 'Wybierz'}</span>
              </div>
            </div>
        `;
      })
      .join('');
  } catch (e) {
    dom.mediaGrid.innerHTML = '<p class="text-red-500">Błąd ładowania biblioteki.</p>';
  }
}

window.selectMedia = (url) => {
  if (!mediaPickerState.multiple) {
    closeMediaPicker(url);
    return;
  }

  if (mediaPickerState.selected.has(url)) {
    mediaPickerState.selected.delete(url);
  } else {
    mediaPickerState.selected.add(url);
  }

  // Update card DOM in-place — no re-fetch, no flash
  const card = dom.mediaGrid.querySelector(`[data-media-url="${CSS.escape(url)}"]`);
  if (card) {
    const isSelected = mediaPickerState.selected.has(url);
    card.classList.toggle('ring-2', isSelected);
    card.classList.toggle('ring-gold', isSelected);
    card.classList.toggle('border-gold', isSelected);
    const overlay = card.querySelector('.absolute.inset-0');
    if (overlay) {
      overlay.classList.toggle('opacity-100', isSelected);
      overlay.classList.toggle('opacity-0', !isSelected);
      overlay.classList.toggle('group-hover:opacity-100', !isSelected);
      const label = overlay.querySelector('span');
      if (label) label.textContent = isSelected ? 'Wybrane' : 'Wybierz';
    }
  }

  updateMediaPickerUi();
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
  dom.dashboard.classList.remove('flex');
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
  dom.dashboard.classList.remove('flex');
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
  dom.dashboard.classList.remove('flex');
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
  dom.dashboard.classList.add('flex');
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
  if (tabName === 'media') loadMediaLibraryTab();
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

  const approvedTestimonials = testimonials.filter((t) => t.approved);
  const maxGalleryCards = window.innerWidth < 768 ? 4 : 6;
  const recentGalleries = galleries.slice(0, maxGalleryCards);

  const greetingName = currentUser?.role === 'ADMIN' ? 'Filip' : 'Alex';

  container.innerHTML = `
      <div class="mb-8">
        <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white mb-2">Dzień dobry, ${greetingName}</h2>
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
                    <span class="text-xs text-gray-500">Opublikowanych</span>
                </div>
            </div>

            <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Opinie</span>
                    <svg class="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <div class="flex items-baseline">
                    <span class="text-4xl font-display text-gray-900 dark:text-white mr-2">${approvedTestimonials.length}</span>
                    <span class="text-xs text-gray-500">Opublikowanych</span>
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
                    <button onclick="document.querySelector('[data-tab=\'galleries\']').click()" class="text-sm text-gold hover:text-white transition-colors">Zobacz wszystkie</button>
                </div>
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
                     ${recentGalleries
                       .map(
                         (g) => `
                        <div class="aspect-[3/4] bg-gray-100 dark:bg-black rounded-lg overflow-hidden relative group cursor-pointer" onclick="editGallery(${g.id})">
                            ${(() => {
                              const cover = g.cover_image || g.items?.[0]?.image_path || '';
                              return getAdminImageMarkup(cover, {
                                alt: g.name || 'Galeria',
                                className:
                                  'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
                                placeholderClass:
                                  'flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-gray-500 dark:bg-black/40 dark:text-gray-400',
                                label: 'Brak okładki galerii',
                              });
                            })()}
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
                       recentGalleries.length < maxGalleryCards
                         ? `
                        <button onclick="editGallery(null)" class="aspect-[3/4] border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gold hover:text-gold transition-colors">
                            <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                            <span class="text-sm font-medium">Dodaj sesję</span>
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
                    <h4 class="font-bold text-gray-900 dark:text-white mb-2">Nowa galeria</h4>
                    <p class="text-sm text-gray-500 mb-4 px-2">Stwórz nową kolekcję zdjęć dla klienta lub do portfolio.</p>
                    <button onclick="editGallery(null)" class="w-full bg-gold text-black py-2 rounded font-bold hover:bg-gold-hover transition-colors">Dodaj galerię</button>
                  </div>

                  <div class="bg-white dark:bg-dark-secondary p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 text-center">
                    <div class="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gold">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </div>
                    <h4 class="font-bold text-gray-900 dark:text-white mb-2">Nowa opinia</h4>
                    <p class="text-sm text-gray-500 mb-4 px-2">Dodaj nową opinię klienta i opublikuj ją na stronie.</p>
                    <button onclick="editTestimonial(null)" class="w-full bg-gold text-black py-2 rounded font-bold hover:bg-gold-hover transition-colors">Dodaj opinię</button>
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
      renderPagesView(pages, true, container);
    }
    return;
  }

  renderPagesView(pages, false, container);
}

function renderPagesView(pages, showSeedBtn, container) {
  const query = pagesFilterQuery.trim().toLowerCase();
  const hasLandingPageTag = (page) => {
    const normalizedSlug = String(page.slug || '')
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase();
    return ['wedding-photography', 'portrait-photography', 'product-photography'].includes(
      normalizedSlug,
    );
  };
  const filteredByCategory =
    pagesFilterCategory === 'landing-pages'
      ? pages.filter((page) => hasLandingPageTag(page))
      : pages;
  const filteredPages = query
    ? filteredByCategory.filter((p) =>
        `${p.title || ''} ${p.slug || ''}`.toLowerCase().includes(query),
      )
    : filteredByCategory;

  const renderList = () => `
    <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm">
      <table class="w-full text-left">
        <thead class="bg-gray-50 dark:bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-3 py-4"></th>
            <th class="px-6 py-4">Tytuł</th>
            <th class="px-6 py-4">Slug</th>
            <th class="px-6 py-4">Ostatnia modyfikacja</th>
            <th class="px-6 py-4 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody id="pages-table-body" class="divide-y divide-gray-200 dark:divide-white/5 text-sm text-gray-600 dark:text-gray-300">
          ${filteredPages
            .map(
              (p) => `
              <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" data-id="${p.id}">
                <td class="px-3 py-4 text-gray-400 cursor-move drag-handle" title="Przeciągnij, aby zmienić kolejność">&#9776;</td>
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  <button type="button" onclick="editPage(${p.id})" class="text-left transition-colors hover:text-gold">
                    ${p.title || '(Bez tytułu)'}
                  </button>
                  ${p.is_home ? '<span class="ml-2 text-xs uppercase tracking-wider text-gold">Home</span>' : ''}
                </td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-500">${p.slug}</td>
                <td class="px-6 py-4">${new Date(p.updated_at || p.updatedAt || Date.now()).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-right space-x-3">
                  <button type="button" onclick="editPage(${p.id})" class="text-gold hover:text-black dark:hover:text-white transition-colors font-medium">Edytuj</button>
                  <button type="button" onclick="window.open('${FRONTEND_BASE_URL}${p.is_home || p.slug === '/' ? '/' : '/' + (p.slug || '').replace(/^\/+/, '') + '/'}', '_blank')" class="text-gray-500 hover:text-gold dark:text-gray-400 dark:hover:text-gold transition-colors font-medium">Podgląd</button>
                </td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  const renderGrid = () => `
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      ${filteredPages
        .map(
          (p) => `
          <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden group hover:border-gold/50 transition-colors shadow-sm">
            <div class="h-48 bg-gray-100 dark:bg-black/50 relative">
              ${
                p.hero_image
                  ? getAdminImageMarkup(p.hero_image, {
                      alt: p.title || p.slug || 'Strona',
                      className: 'w-full h-full object-cover',
                      placeholderClass:
                        'flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-gray-500 dark:bg-black/40 dark:text-gray-400',
                      label: 'Brak hero image',
                    })
                  : '<div class="flex h-full items-center justify-center text-gray-500">Brak obrazu</div>'
              }
              ${hasLandingPageTag(p) ? `<div class="${GRID_BADGE_LEFT_CLASS}">Landing pages</div>` : ''}
              ${p.is_home ? `<div class="${hasLandingPageTag(p) ? 'absolute top-14 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-gold' : GRID_BADGE_LEFT_CLASS}">Home</div>` : ''}
            </div>
            <div class="p-5">
              <h3 class="font-display font-medium text-lg text-gray-900 dark:text-white mb-1 group-hover:text-gold transition-colors">
                ${p.title || '(Bez tytułu)'}
              </h3>
              <p class="text-xs text-gray-500 mb-1">${p.slug}</p>
              <p class="text-xs text-gray-500 uppercase tracking-widest mb-4">Aktualizacja ${new Date(p.updated_at || p.updatedAt || Date.now()).toLocaleDateString()}</p>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="editPage(${p.id})" class="py-2 border border-gray-300 dark:border-white/10 rounded text-gray-600 dark:text-gray-300 hover:bg-gold hover:text-black hover:border-gold transition-colors font-medium">Edytuj</button>
                <button type="button" onclick="window.open('${FRONTEND_BASE_URL}${p.is_home || p.slug === '/' ? '/' : '/' + (p.slug || '').replace(/^\/+/, '') + '/'}', '_blank')" class="py-2 border border-gray-300 dark:border-white/10 rounded text-gray-600 dark:text-gray-300 hover:bg-gold hover:text-black hover:border-gold transition-colors font-medium">Podgląd</button>
              </div>
            </div>
          </div>
        `,
        )
        .join('')}
    </div>
  `;

  container.innerHTML = `
    <div class="mb-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Strony</h2>
          <input id="pages-filter" type="text" placeholder="Szukaj strony" class="${CONTENT_SEARCH_INPUT_CLASS}" />
          ${showSeedBtn ? `<button type="button" onclick="seedHomePage()" class="text-sm text-gold hover:text-white underline">Dodaj Home</button>` : ''}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" data-pages-category="all" class="${getTagPillClass(pagesFilterCategory === 'all')}">Wszystkie</button>
        <button type="button" data-pages-category="landing-pages" class="${getTagPillClass(pagesFilterCategory === 'landing-pages')}">Landing pages</button>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" id="pages-view-list" class="${getToggleButtonClass(pagesViewMode === 'list')}">Lista</button>
          <button type="button" id="pages-view-grid" class="${getToggleButtonClass(pagesViewMode === 'grid')}">Siatka</button>
        </div>
      </div>
    </div>
    ${pagesViewMode === 'grid' ? renderGrid() : renderList()}
  `;

  const filterInput = document.getElementById('pages-filter');
  if (filterInput) {
    filterInput.value = pagesFilterQuery;
    filterInput.addEventListener('input', (event) => {
      pagesFilterQuery = event.target.value;
      renderPagesView(pages, showSeedBtn, container);
      const nextInput = document.getElementById('pages-filter');
      if (nextInput) {
        nextInput.focus();
        const pos = pagesFilterQuery.length;
        nextInput.setSelectionRange(pos, pos);
      }
    });
  }

  const listBtn = document.getElementById('pages-view-list');
  const gridBtn = document.getElementById('pages-view-grid');
  if (listBtn)
    listBtn.addEventListener('click', () => {
      pagesViewMode = 'list';
      renderPagesView(pages, showSeedBtn, container);
    });
  if (gridBtn)
    gridBtn.addEventListener('click', () => {
      pagesViewMode = 'grid';
      renderPagesView(pages, showSeedBtn, container);
    });

  container.querySelectorAll('[data-pages-category]').forEach((button) => {
    button.addEventListener('click', () => {
      pagesFilterCategory = button.getAttribute('data-pages-category') || 'all';
      renderPagesView(pages, showSeedBtn, container);
    });
  });

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
    home_gallery_wedding_id: null,
    home_gallery_portrait_id: null,
    home_gallery_product_id: null,
    home_gallery_wedding_images: [],
    home_gallery_portrait_images: [],
    home_gallery_product_images: [],
    home_moments_image: '',
    home_latest_moments_bg: '',
    home_latest_gallery_ids: [],
    home_testimonial_ids: [],
    wedding_testimonial_ids: [],
    faq_items: [],
    wedding_slider_images: [],
    wedding_session_types: [],
    portfolio_gallery_ids: [],
    about_origin_images: [],
    about_story_images: [],
    about_story_captions: [],
    about_work_images: [],
    meta_title: '',
    meta_description: '',
    seo_image: '',
    is_home: false,
    seo_use_hero: true,
    slug: '',
  };
  const parseIds = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  };

  const parseImageList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  };

  const parseFaqItems = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => ({
          question: String(item?.question || '').trim(),
          answer: String(item?.answer || '').trim(),
        }))
        .filter((item) => item.question && item.answer);
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
            .map((item) => ({
              question: String(item?.question || '').trim(),
              answer: String(item?.answer || '').trim(),
            }))
            .filter((item) => item.question && item.answer)
        : [];
    } catch (err) {
      return [];
    }
  };

  const parseWeddingSessionTypes = (value) => {
    if (!value) return [];
    const normalizeItems = (items) =>
      items
        .map((item) => ({
          title: String(item?.title || '').trim(),
          description: String(item?.description || '').trim(),
          image: String(item?.image || '').trim(),
          items: Array.isArray(item?.items)
            ? item.items.map((listItem) => String(listItem || '').trim()).filter(Boolean)
            : [],
        }))
        .filter((item) => item.title || item.description || item.image);

    if (Array.isArray(value)) return normalizeItems(value);
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? normalizeItems(parsed) : [];
    } catch (err) {
      return [];
    }
  };

  const weddingSessionItemsEqual = (first, second) => {
    if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length)
      return false;
    return first.every((item, index) => item === second[index]);
  };

  const mergeWeddingSessionTypeDefaults = (items) => {
    if (!Array.isArray(items) || !items.length) {
      return DEFAULT_WEDDING_SESSION_TYPES.map((item) => ({
        ...item,
        items: [...(item.items || [])],
      }));
    }

    return items.map((item, index) => {
      const matchedDefault =
        DEFAULT_WEDDING_SESSION_TYPES.find(
          (defaultItem) =>
            defaultItem.title.trim().toLowerCase() ===
            String(item.title || '')
              .trim()
              .toLowerCase(),
        ) || DEFAULT_WEDDING_SESSION_TYPES[index];

      return {
        title: item.title || matchedDefault?.title || '',
        description: item.description || matchedDefault?.description || '',
        image: item.image || matchedDefault?.image || '',
        items:
          Array.isArray(item.items) && item.items.length
            ? weddingSessionItemsEqual(
                item.items,
                LEGACY_WEDDING_SESSION_TYPE_ITEMS[item.title || matchedDefault?.title || ''] || [],
              )
              ? [...(matchedDefault?.items || [])]
              : [...item.items]
            : [...(matchedDefault?.items || [])],
      };
    });
  };

  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const [pages, galleries, testimonials, globalSettings, mediaFiles] = await Promise.all([
    fetch(`${ADMIN_API_URL}/pages`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json()),
    fetch(`${ADMIN_API_URL}/galleries`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json()),
    fetch(`${ADMIN_API_URL}/testimonials`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json()),
    fetch(`${API_URL}/settings`).then((res) => res.json()),
    fetch(`${ADMIN_API_URL}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.json()),
  ]);
  const publishedGalleries = (galleries || []).filter((gallery) => gallery.published !== false);
  const publishedTestimonials = (testimonials || []).filter((testimonial) => testimonial.approved);

  page = pages.find((p) => p.id === id) || page;
  const normalizedSlug = String(page.slug || '').replace(/^\/+/, '');
  const isHomePage = Boolean(page.is_home || normalizedSlug === '' || normalizedSlug === 'home');
  const isWeddingPage = normalizedSlug === 'wedding-photography';
  const isPortraitPage = normalizedSlug === 'portrait-photography';
  const isProductPage = normalizedSlug === 'product-photography';
  const isAboutPage = normalizedSlug === 'about';
  const isLandingFaqPage = isHomePage || isWeddingPage || isPortraitPage || isProductPage;
  const isPortfolioPage = normalizedSlug === 'portfolio';
  page.is_home = isHomePage;
  page.home_latest_gallery_ids = parseIds(page.home_latest_gallery_ids);
  page.home_testimonial_ids = parseIds(page.home_testimonial_ids);
  page.wedding_testimonial_ids = parseIds(page.wedding_testimonial_ids);
  page.home_gallery_wedding_images = parseImageList(page.home_gallery_wedding_images);
  page.home_gallery_portrait_images = parseImageList(page.home_gallery_portrait_images);
  page.home_gallery_product_images = parseImageList(page.home_gallery_product_images);
  page.wedding_slider_images = parseImageList(page.wedding_slider_images);
  page.wedding_session_types = isWeddingPage
    ? mergeWeddingSessionTypeDefaults(parseWeddingSessionTypes(page.wedding_session_types))
    : parseWeddingSessionTypes(page.wedding_session_types);
  page.portfolio_gallery_ids = parseIds(page.portfolio_gallery_ids);
  page.about_origin_images = parseImageList(page.about_origin_images);
  page.about_story_images = parseImageList(page.about_story_images);
  page.about_story_captions = parseImageList(page.about_story_captions);
  page.about_work_images = parseImageList(page.about_work_images);
  page.faq_items = parseFaqItems(page.faq_items);

  if (isAboutPage) {
    if (!page.about_origin_images.length) {
      page.about_origin_images = [
        '/uploads/ils-100.webp',
        '/uploads/ils-40.webp',
        '/uploads/ils-154.webp',
      ];
    }
    if (!page.about_story_images.length) {
      page.about_story_images = [
        '/uploads/alex-4.webp',
        '/uploads/ils-154.webp',
        '/uploads/me-2.webp',
      ];
    }
    if (!page.about_story_captions.length) {
      page.about_story_captions = ['Gliwice, Poland', 'One of many stories', 'Glasgow, Scotland'];
    }
    if (!page.about_work_images.length) {
      page.about_work_images = [
        '/uploads/ils-185.webp',
        '/uploads/ils-206.webp',
        '/uploads/ils-212.webp',
      ];
    }
  }

  // SEO Section (Admin Only)
  const seoSection =
    currentUser.role === 'ADMIN'
      ? `
    <div class="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Ustawienia SEO</h3>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Tytuł</label>
              <textarea id="meta_title" rows="2" class="w-full resize-none bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">${page.meta_title || ''}</textarea>
              <p id="meta_title_hint" class="rounded border border-gray-200/70 dark:border-white/10 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">Długość: <span id="meta_title_count">0</span> / 50-60</p>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Meta Opis</label>
              <textarea id="meta_description" class="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium">${page.meta_description || ''}</textarea>
              <p id="meta_description_hint" class="rounded border border-gray-200/70 dark:border-white/10 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">Długość: <span id="meta_description_count">0</span> / 140-160</p>
            </div>
          </div>
          <div class="space-y-3">
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Miniaturka SEO (og:image)</label>
            <div>
              <div id="seo_image_empty" class="${page.seo_image ? 'hidden' : ''} w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-white/10 p-6 text-gray-400 transition-colors hover:border-gold hover:text-gold">
                <div class="flex flex-col items-center justify-center gap-3 text-center">
                  <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  <p class="text-sm">Wybierz z biblioteki lub dodaj z komputera</p>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" id="seo_image_pick" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('seo_image', url))">Wybierz z biblioteki</button>
                    <button type="button" id="seo_image_upload_btn" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="document.getElementById('seo_image_upload').click()">Dodaj z komputera</button>
                  </div>
                </div>
              </div>
              <div id="seo_image_filled" class="${page.seo_image ? '' : 'hidden'}">
                <img id="seo_image_preview" src="${resolveUploadsUrl(page.seo_image || '')}" class="w-full h-48 rounded-lg border border-gray-200 dark:border-white/10 object-cover" />
                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" id="seo_image_pick_filled" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('seo_image', url))">Zmień</button>
                  <button type="button" id="seo_image_clear" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="updateImagePicker('seo_image', '')">Usuń</button>
                </div>
              </div>
              <input type="text" id="seo_image" value="${page.seo_image || ''}" class="hidden">
              <input type="file" id="seo_image_upload" class="hidden" accept="image/*">
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

  const renderGalleryOptions = (selectedId) =>
    (galleries || [])
      .map((g) => {
        const label = `${g.name || 'Bez nazwy'} (${CATEGORY_MAP[g.category] || g.category})`;
        return `<option value="${g.id}" ${Number(selectedId) === g.id ? 'selected' : ''}>${label}</option>`;
      })
      .join('');

  const renderTestimonialOptions = (selectedId) =>
    (testimonials || [])
      .map(
        (t) =>
          `<option value="${t.id}" ${Number(selectedId) === t.id ? 'selected' : ''}>${
            t.author || 'Bez autora'
          }</option>`,
      )
      .join('');

  const renderImagePicker = ({ inputId, label, value, sizeClass = 'h-56' }) => {
    const hasValue = Boolean(value);
    return `
      <div class="space-y-3">
        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">${label}</label>
        <div>
          <div id="${inputId}_empty" class="${hasValue ? 'hidden' : ''} w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-white/10 p-6 text-gray-400 transition-colors hover:border-gold hover:text-gold">
            <div class="flex flex-col items-center justify-center gap-3 text-center">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p class="text-sm">Wybierz z biblioteki lub dodaj z komputera</p>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('${inputId}', url))">Wybierz z biblioteki</button>
                <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="document.getElementById('${inputId}_upload').click()">Dodaj z komputera</button>
              </div>
            </div>
          </div>

          <div id="${inputId}_filled" class="${hasValue ? '' : 'hidden'}">
            <img id="${inputId}_preview" src="${resolveUploadsUrl(value || '')}" class="w-full ${sizeClass} rounded-lg border border-gray-200 dark:border-white/10 object-cover" />
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('${inputId}', url))">Zmień</button>
              <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="updateImagePicker('${inputId}', '')">Usuń</button>
            </div>
          </div>

          <input type="text" id="${inputId}" value="${value || ''}" class="hidden" />
          <input type="file" id="${inputId}_upload" class="hidden" accept="image/*" />
        </div>
      </div>
    `;
  };

  const renderImageListSection = (listId, label, options = {}) => {
    const { showLabel = true } = options;
    return `
    <div class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          ${
            showLabel
              ? `<p class="text-xs font-bold uppercase tracking-wider text-gray-500">${label}</p>`
              : ''
          }
          <p class="text-xs text-gray-400">Dodawaj zdjęcia i przeciągaj, aby zmienić kolejność</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded bg-gray-200 px-3 py-1.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" data-add-library="${listId}">Z biblioteki</button>
          <label class="cursor-pointer rounded bg-gray-100 px-3 py-1.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            Z komputera
            <input type="file" class="hidden" accept="image/*" data-add-upload="${listId}" />
          </label>
        </div>
      </div>
      <div id="${listId}" class="grid grid-cols-2 gap-3 md:grid-cols-3"></div>
    </div>
  `;
  };

  const renderCaptionListSection = (baseId, label, values = []) => {
    const normalized = [0, 1, 2].map((index) => String(values?.[index] || '').trim());
    return `
      <div class="space-y-3">
        <p class="text-xs font-bold uppercase tracking-wider text-gray-500">${label}</p>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          ${normalized
            .map(
              (value, index) => `
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Podpis #${index + 1}</label>
                  <input
                    type="text"
                    id="${baseId}_${index}"
                    value="${escapeHtml(value)}"
                    class="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white"
                  />
                </div>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  };

  const renderFaqItems = (items, openIndexes = new Set()) =>
    (items || [])
      .map(
        (item, index) => `
        <div class="rounded-lg border border-gray-200 p-4 dark:border-white/10 faq-item-row" data-faq-index="${index}">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-1 space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pytanie #${index + 1}</label>
              <input type="text" class="faq-question w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white" value="${escapeHtml(item.question || '')}" />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="rounded border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-600 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300" data-move-faq="up" data-faq-index="${index}" ${
                index === 0 ? 'disabled' : ''
              }>Góra</button>
              <button type="button" class="rounded border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-600 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300" data-move-faq="down" data-faq-index="${index}" ${
                index === (items || []).length - 1 ? 'disabled' : ''
              }>Dół</button>
              <button type="button" class="rounded border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-600 transition-colors hover:border-gold hover:text-gold dark:border-white/10 dark:text-gray-300" data-toggle-faq="${index}" aria-expanded="${
                openIndexes.has(index) ? 'true' : 'false'
              }">${openIndexes.has(index) ? 'Zwiń' : 'Rozwiń'}</button>
              <button type="button" class="text-xs uppercase tracking-widest text-red-500" data-remove-faq="${index}">Usuń</button>
            </div>
          </div>
          <div class="faq-answer-panel mt-3 space-y-2 ${openIndexes.has(index) ? '' : 'hidden'}" data-faq-panel="${index}">
            <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Odpowiedź</label>
            <textarea id="faq_answer_${index}" class="faq-wysiwyg h-48">${item.answer || ''}</textarea>
          </div>
        </div>
      `,
      )
      .join('');

  const collectFaqItemsFromDom = () => {
    if (window.tinymce) tinymce.triggerSave();
    const rows = Array.from(document.querySelectorAll('.faq-item-row'));
    return rows.map((row) => {
      const questionInput = row.querySelector('.faq-question');
      const answerTextarea = row.querySelector('.faq-wysiwyg');
      return {
        question: questionInput?.value || '',
        answer: answerTextarea?.value || '',
      };
    });
  };

  const normalizeFaqOpenIndexes = (openIndexes, total) => {
    const normalized = new Set();
    openIndexes.forEach((index) => {
      if (Number.isInteger(index) && index >= 0 && index < total) normalized.add(index);
    });
    return normalized;
  };

  const moveFaqOpenIndex = (openIndexes, from, to) => {
    const moved = new Set();
    openIndexes.forEach((index) => {
      if (index === from) {
        moved.add(to);
      } else if (from < to && index > from && index <= to) {
        moved.add(index - 1);
      } else if (from > to && index >= to && index < from) {
        moved.add(index + 1);
      } else {
        moved.add(index);
      }
    });
    return moved;
  };

  const removeFaqOpenIndex = (openIndexes, removedIndex) => {
    const next = new Set();
    openIndexes.forEach((index) => {
      if (index === removedIndex) return;
      next.add(index > removedIndex ? index - 1 : index);
    });
    return next;
  };

  const html = `
        <form id="page-form" class="space-y-6">
            <div class="space-y-6 p-4">
              <h3 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">Ustawienia ogólne</h3>
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div class="space-y-4">
                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Tytuł strony</label>
                    <input type="text" id="title" value="${page.title || ''}" class="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 outline-none text-gray-900 dark:text-white focus:border-gold font-medium text-xl">
                  </div>

                  <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Slug</label>
                    <div class="w-full rounded border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30 p-2 text-sm text-gray-600 dark:text-gray-400">
                      ${page.slug || '/'}
                    </div>
                    <p class="text-xs text-gray-400">Slug jest ustawiany automatycznie.</p>
                  </div>
                </div>

                <div class="space-y-6">
                  ${renderImagePicker({
                    inputId: 'hero_image',
                    label: 'Zdjęcie główne (Hero)',
                    value: page.hero_image || '',
                    sizeClass: 'h-56',
                  })}

                </div>
              </div>
            </div>

            <div id="details-section" class="mt-8 space-y-6 border-t border-gray-200 pt-6 dark:border-white/10 p-4">
              <h3 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">Szczegóły</h3>

              <div id="home-details-section" class="space-y-4">
                <div class="space-y-4" data-details-item data-details-title="Galerie na stronie głównej">
                  <div class="space-y-6">
                    ${renderImageListSection('home_gallery_wedding_images', 'Galeria Wedding')}
                    ${renderImageListSection('home_gallery_portrait_images', 'Galeria Portrait')}
                    ${renderImageListSection('home_gallery_product_images', 'Galeria Product')}
                  </div>
                </div>

                <div class="space-y-4" data-details-item data-details-title="Pozostałe zdjęcia">
                  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    ${renderImagePicker({
                      inputId: 'home_moments_image',
                      label: 'Zdjęcie Moments Preserved',
                      value: page.home_moments_image || '',
                      sizeClass: 'h-56',
                    })}
                    ${renderImagePicker({
                      inputId: 'home_latest_moments_bg',
                      label: 'Tło Latest Moments',
                      value: page.home_latest_moments_bg || '',
                      sizeClass: 'h-56',
                    })}
                  </div>
                </div>

                <div class="space-y-4" data-details-item data-details-title="Latest Moments">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-xs text-gray-400">Wybierz dokładnie 6 sesji zdjęciowych</p>
                    </div>
                    <span id="latest-galleries-count" class="text-xs uppercase tracking-widest text-gray-400">0 / 6</span>
                  </div>
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wszystkie sesje</p>
                      <div id="latest-galleries-all" class="space-y-2"></div>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wybrane (przeciągnij, aby zmienić kolejność)</p>
                      <div id="latest-galleries-selected" class="space-y-2"></div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4" data-details-item data-details-title="Opinie na stronie głównej">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-xs text-gray-400">Wybierz minimum 3 opinie</p>
                    </div>
                    <span id="home-testimonials-count" class="text-xs uppercase tracking-widest text-gray-400">0</span>
                  </div>
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wszystkie opinie</p>
                      <div id="home-testimonials-all" class="space-y-2"></div>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wybrane (przeciągnij, aby zmienić kolejność)</p>
                      <div id="home-testimonials-selected" class="space-y-2"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="wedding-details-section" class="space-y-4">
                <div class="space-y-4" data-details-item data-details-title="Wedding slider">
                  ${renderImageListSection('wedding_slider_images', 'Zdjęcia do slidera')}
                </div>
                <div class="space-y-4" data-details-item data-details-title="Wedding Session Types">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Wedding Session Types</p>
                      <p class="text-xs text-gray-400">Dodawaj, usuwaj i ustawiaj kolejność bloków z tytułem, opisem i zdjęciem.</p>
                    </div>
                    <button type="button" id="add-wedding-session-type" class="rounded bg-gray-200 px-3 py-1.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">Dodaj Session Type</button>
                  </div>
                  <div id="wedding-session-types-list" class="space-y-4"></div>
                </div>
                <div class="space-y-4" data-details-item data-details-title="Opinie na Wedding">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Opinie na Wedding landing page</p>
                      <p class="text-xs text-gray-400">Wybierz opinie i ustaw ich kolejność</p>
                    </div>
                    <span id="wedding-testimonials-count" class="text-xs uppercase tracking-widest text-gray-400">0</span>
                  </div>
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wszystkie opinie</p>
                      <div id="wedding-testimonials-all" class="space-y-2"></div>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wybrane (przeciągnij, aby zmienić kolejność)</p>
                      <div id="wedding-testimonials-selected" class="space-y-2"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="portfolio-details-section" class="space-y-4">
                <div class="space-y-4" data-details-item data-details-title="Portfolio">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="text-xs text-gray-400">Wybierz zdjęcia z biblioteki mediów i ustaw ich kolejność</p>
                    </div>
                    <span id="portfolio-media-count" class="text-xs uppercase tracking-widest text-gray-400">0</span>
                  </div>
                  <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex flex-wrap gap-2">
                      <button data-portfolio-tag="all" class="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-white/10 uppercase tracking-widest">Wszystkie</button>
                      <button data-portfolio-tag="wedding" class="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-white/10 uppercase tracking-widest">Ślubne</button>
                      <button data-portfolio-tag="portrait" class="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-white/10 uppercase tracking-widest">Portretowe</button>
                      <button data-portfolio-tag="product" class="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-white/10 uppercase tracking-widest">Produktowe</button>
                      <button data-portfolio-tag="other" class="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-white/10 uppercase tracking-widest">Inne</button>
                    </div>
                    <input id="portfolio-media-filter" type="text" placeholder="Szukaj zdjęcia" class="w-56 max-w-full rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 px-4 py-1.5 text-xs uppercase tracking-widest text-gray-600 dark:text-gray-200 placeholder-gray-400 focus:border-gold focus:outline-none" />
                  </div>
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wszystkie zdjęcia</p>
                      <div id="portfolio-media-all" class="space-y-2"></div>
                    </div>
                    <div class="space-y-2">
                      <p class="text-[10px] uppercase tracking-widest text-gray-400">Wybrane (przeciągnij, aby zmienić kolejność)</p>
                      <div id="portfolio-media-selected" class="space-y-2"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="about-details-section" class="space-y-4">
                <div class="space-y-4" data-details-item data-details-title="Pierwsze trzy zdjęcia">
                  ${renderImageListSection('about_origin_images', 'Pierwsze trzy zdjęcia', { showLabel: false })}
                </div>

                <div class="space-y-4" data-details-item data-details-title="Trzy zdjęcia z podpisami">
                  ${renderImageListSection('about_story_images', 'Trzy zdjęcia z podpisami', { showLabel: false })}
                  ${renderCaptionListSection('about_story_caption', 'Podpisy pod zdjęciami', page.about_story_captions || [])}
                </div>

                <div class="space-y-4" data-details-item data-details-title="Drugie trzy zdjęcia">
                  ${renderImageListSection('about_work_images', 'Drugie trzy zdjęcia', { showLabel: false })}
                </div>
              </div>

              <div id="faq-details-section" class="space-y-4" data-details-item data-details-title="FAQ">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs text-gray-400">Dodawaj, usuwaj i edytuj pytania z odpowiedziami</p>
                  </div>
                  <button type="button" id="add-faq-item" class="rounded bg-gray-200 px-3 py-1.5 text-xs uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">Dodaj pytanie</button>
                </div>
                <div id="faq-items" class="space-y-3">
                  ${renderFaqItems(page.faq_items)}
                </div>
              </div>

              <div id="content-section" class="space-y-2 h-[400px] flex flex-col">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Treść</label>
                <textarea id="content" class="wysiwyg flex-1">${page.content || ''}</textarea>
              </div>
            </div>

            ${seoSection}

        </form>
    `;

  openModal('Edycja strony', html);
  setModalPrimaryAction(() => {
    const form = document.getElementById('page-form');
    if (form) form.requestSubmit();
  });
  initTinyMCE();

  const initFaqWysiwygEditors = () => {
    if (!window.tinymce) return;
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.faq-answer-panel:not(.hidden) .faq-wysiwyg').forEach((textarea) => {
      if (!textarea.id || tinymce.get(textarea.id)) return;
      tinymce.init({
        target: textarea,
        height: 220,
        skin: isDark ? 'oxide-dark' : 'oxide',
        content_css: isDark ? 'dark' : 'default',
        promotion: false,
        branding: false,
        menubar: false,
        plugins: 'link lists',
        toolbar:
          'undo redo | blocks | bold italic underline | bullist numlist | link | removeformat',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
      });
    });
  };
  initFaqWysiwygEditors();

  const renderFaqRows = (faqItems, openIndexes = new Set()) => {
    const faqContainer = document.getElementById('faq-items');
    if (!faqContainer) return;

    document.querySelectorAll('.faq-wysiwyg').forEach((textarea) => {
      if (textarea.id) {
        const instance = tinymce.get(textarea.id);
        if (instance) instance.remove();
      }
    });

    const normalizedOpenIndexes = normalizeFaqOpenIndexes(openIndexes, faqItems.length);
    faqContainer.innerHTML = renderFaqItems(faqItems, normalizedOpenIndexes);
    initFaqWysiwygEditors();
  };

  let faqItems = [...(page.faq_items || [])];
  let faqOpenIndexes = new Set();
  const addFaqButton = document.getElementById('add-faq-item');
  if (addFaqButton) {
    addFaqButton.addEventListener('click', () => {
      faqItems = collectFaqItemsFromDom();
      faqItems.push({ question: '', answer: '' });
      faqOpenIndexes = new Set([faqItems.length - 1]);
      renderFaqRows(faqItems, faqOpenIndexes);
    });
  }

  const faqContainer = document.getElementById('faq-items');
  if (faqContainer) {
    faqContainer.addEventListener('click', (event) => {
      const toggleButton = event.target.closest('[data-toggle-faq]');
      if (toggleButton) {
        const index = Number(toggleButton.getAttribute('data-toggle-faq'));
        const panel = faqContainer.querySelector(`[data-faq-panel="${index}"]`);
        if (Number.isNaN(index) || !panel) return;
        const isHidden = panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !isHidden);
        toggleButton.setAttribute('aria-expanded', String(isHidden));
        toggleButton.textContent = isHidden ? 'Zwiń' : 'Rozwiń';
        if (isHidden) initFaqWysiwygEditors();
        if (isHidden) {
          faqOpenIndexes.add(index);
        } else {
          faqOpenIndexes.delete(index);
        }
        return;
      }

      const moveButton = event.target.closest('[data-move-faq]');
      if (moveButton) {
        faqItems = collectFaqItemsFromDom();
        const direction = moveButton.getAttribute('data-move-faq');
        const index = Number(moveButton.getAttribute('data-faq-index'));
        if (Number.isNaN(index)) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= faqItems.length) return;
        const [movedItem] = faqItems.splice(index, 1);
        faqItems.splice(targetIndex, 0, movedItem);
        faqOpenIndexes = moveFaqOpenIndex(faqOpenIndexes, index, targetIndex);
        renderFaqRows(faqItems, faqOpenIndexes);
        return;
      }

      const removeButton = event.target.closest('[data-remove-faq]');
      if (!removeButton) return;
      const index = Number(removeButton.getAttribute('data-remove-faq'));
      if (Number.isNaN(index)) return;
      faqItems = collectFaqItemsFromDom();
      faqItems.splice(index, 1);
      faqOpenIndexes = removeFaqOpenIndex(faqOpenIndexes, index);
      renderFaqRows(faqItems, faqOpenIndexes);
    });
  }
  applySeoUseHeroState();
  initMetaCounters();

  window.updateImagePicker = (inputId, url) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(`${inputId}_preview`);
    const emptyState = document.getElementById(`${inputId}_empty`);
    const filledState = document.getElementById(`${inputId}_filled`);
    const hasValue = Boolean(url);

    if (input) input.value = url || '';
    if (preview && url) preview.src = resolveUploadsUrl(url);
    if (preview && !url) preview.removeAttribute('src');
    if (emptyState) emptyState.classList.toggle('hidden', hasValue);
    if (filledState) filledState.classList.toggle('hidden', !hasValue);
  };

  const bindImageUpload = (inputId) => {
    const uploadInput = document.getElementById(`${inputId}_upload`);
    if (!uploadInput) return;
    uploadInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        updateUploadToast({
          title: 'Przesyłanie',
          message: `Wysyłanie: ${file.name}`,
          percent: 0,
          visible: true,
        });
        const result = await uploadFileWithResolution(file, (ratio) => {
          updateUploadToast({
            message: `Wysyłanie: ${file.name}`,
            percent: Math.round(ratio * 100),
          });
        });
        updateUploadToast({ title: 'Gotowe', message: 'Plik przesłany.', percent: 100 });
        setTimeout(() => updateUploadToast({ visible: false }), 1500);
        if (result?.url) window.updateImagePicker(inputId, result.url);
      } catch (err) {
        updateUploadToast({ title: 'Błąd', message: 'Nie udało się przesłać pliku.', percent: 0 });
        setTimeout(() => updateUploadToast({ visible: false }), 2500);
      }
      event.target.value = '';
    });
  };

  ['hero_image', 'seo_image', 'home_moments_image', 'home_latest_moments_bg'].forEach((inputId) => {
    bindImageUpload(inputId);
  });

  const imageLists = {
    home_gallery_wedding_images: [...(page.home_gallery_wedding_images || [])],
    home_gallery_portrait_images: [...(page.home_gallery_portrait_images || [])],
    home_gallery_product_images: [...(page.home_gallery_product_images || [])],
    wedding_slider_images: [...(page.wedding_slider_images || [])],
    about_origin_images: [...(page.about_origin_images || [])],
    about_story_images: [...(page.about_story_images || [])],
    about_work_images: [...(page.about_work_images || [])],
  };
  let weddingSessionTypes = (page.wedding_session_types || []).map((item) => ({ ...item }));

  const collectWeddingSessionTypesFromDom = () => {
    const rows = Array.from(document.querySelectorAll('.wedding-session-type-row'));
    return rows
      .map((row) => ({
        title: row.querySelector('.wedding-session-type-title')?.value?.trim() || '',
        description: row.querySelector('.wedding-session-type-description')?.value?.trim() || '',
        image: row.querySelector('.wedding-session-type-image')?.value?.trim() || '',
        items: (row.querySelector('.wedding-session-type-items')?.value?.trim() || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((item) => item.title || item.description || item.image);
  };

  const renderWeddingSessionTypes = () => {
    const container = document.getElementById('wedding-session-types-list');
    if (!container) return;

    if (!weddingSessionTypes.length) {
      container.innerHTML = `
        <div class="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400 dark:border-white/10">
          Brak Session Types. Dodaj pierwszy blok, aby pojawił się na stronie Wedding Photography.
        </div>
      `;
      return;
    }

    container.innerHTML = weddingSessionTypes
      .map((item, index) => {
        const hasImage = Boolean(item.image);
        return `
          <div class="wedding-session-type-row rounded-lg border border-gray-200 p-4 dark:border-white/10" data-session-type-index="${index}">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Session Type #${index + 1}</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="rounded border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-600 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300" data-move-session-type="up" data-session-type-index="${index}" ${index === 0 ? 'disabled' : ''}>Góra</button>
                <button type="button" class="rounded border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-600 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300" data-move-session-type="down" data-session-type-index="${index}" ${index === weddingSessionTypes.length - 1 ? 'disabled' : ''}>Dół</button>
                <button type="button" class="text-xs uppercase tracking-widest text-red-500" data-remove-session-type="${index}">Usuń</button>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div class="space-y-3">
                <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Zdjęcie</label>
                <div>
                  <div class="${hasImage ? 'hidden' : ''} rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-gray-400 transition-colors hover:border-gold hover:text-gold dark:border-white/10">
                    <div class="flex flex-col items-center justify-center gap-3 text-center">
                      <p class="text-sm">Wybierz z biblioteki lub dodaj z komputera</p>
                      <div class="flex flex-wrap gap-2">
                        <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" data-pick-session-image="${index}">Wybierz z biblioteki</button>
                        <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" data-upload-session-image="${index}">Dodaj z komputera</button>
                      </div>
                    </div>
                  </div>
                  <div class="${hasImage ? '' : 'hidden'}">
                    ${getAdminImageMarkup(item.image || '', {
                      alt: item.title || `Session Type ${index + 1}`,
                      className:
                        'h-56 w-full rounded-lg border border-gray-200 object-cover dark:border-white/10',
                      placeholderClass:
                        'flex h-56 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-4 text-center text-gray-500 dark:border-white/10 dark:bg-black/40 dark:text-gray-400',
                      label: 'Brak zdjęcia session type',
                    })}
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" data-pick-session-image="${index}">Zmień</button>
                      <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" data-clear-session-image="${index}">Usuń</button>
                    </div>
                  </div>
                  <input type="text" class="hidden wedding-session-type-image" value="${escapeHtml(item.image || '')}" />
                  <input type="file" class="hidden" accept="image/*" data-session-type-upload-input="${index}" />
                </div>
              </div>

              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tytuł</label>
                  <input type="text" class="wedding-session-type-title w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white" value="${escapeHtml(item.title || '')}" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Opis</label>
                  <textarea class="wedding-session-type-description min-h-[96px] w-full rounded border border-gray-300 bg-gray-50 p-3 text-sm leading-relaxed text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white">${escapeHtml(item.description || '')}</textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Punkty listy (każda linia osobno)</label>
                  <textarea class="wedding-session-type-items min-h-[120px] w-full rounded border border-gray-300 bg-gray-50 p-3 text-sm leading-relaxed text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white" placeholder="Punkt 1&#10;Punkt 2&#10;Punkt 3">${escapeHtml((item.items || []).join('\n'))}</textarea>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const renderImageList = (listId) => {
    const container = document.getElementById(listId);
    if (!container) return;
    const items = imageLists[listId] || [];

    if (!items.length) {
      container.innerHTML = `
        <div class="col-span-2 md:col-span-3 rounded-lg border border-dashed border-gray-300 dark:border-white/10 p-6 text-center text-xs text-gray-400">
          Brak zdjęć. Dodaj je z biblioteki lub z komputera.
        </div>
      `;
      return;
    }

    container.innerHTML = items
      .map(
        (url, index) => `
        <div class="group relative aspect-square overflow-hidden rounded border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40" data-url="${url}">
          ${getAdminImageMarkup(url, {
            alt: `Obraz ${index + 1}`,
            className: 'h-full w-full object-cover',
            placeholderClass:
              'flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-gray-500 dark:bg-black/40 dark:text-gray-400',
            label: 'Brak obrazu',
          })}
          <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" class="rounded bg-red-500/80 px-3 py-1 text-xs uppercase tracking-widest text-white" data-remove-index="${index}" data-list-id="${listId}">Usuń</button>
          </div>
        </div>
      `,
      )
      .join('');

    if (!container.dataset.sortable) {
      Sortable.create(container, {
        animation: 150,
        onEnd: () => {
          const ordered = Array.from(container.children)
            .map((child) => child.dataset.url)
            .filter(Boolean);
          imageLists[listId] = ordered;
          renderImageList(listId);
        },
      });
      container.dataset.sortable = 'true';
    }
  };

  Object.keys(imageLists).forEach((listId) => {
    renderImageList(listId);
    const container = document.getElementById(listId);
    if (!container) return;
    container.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-remove-index]');
      if (!removeButton) return;
      const index = Number(removeButton.getAttribute('data-remove-index'));
      if (Number.isNaN(index)) return;
      imageLists[listId].splice(index, 1);
      renderImageList(listId);
    });
  });

  document.querySelectorAll('[data-add-library]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const listId = event.currentTarget.getAttribute('data-add-library');
      if (!listId) return;
      const urls = await openMediaPicker({ multiple: true });
      if (!Array.isArray(urls) || urls.length === 0) return;
      let hasChanges = false;
      urls.forEach((url) => {
        if (!imageLists[listId].includes(url)) {
          imageLists[listId].push(url);
          hasChanges = true;
        }
      });
      if (hasChanges) renderImageList(listId);
    });
  });

  document.querySelectorAll('[data-add-upload]').forEach((input) => {
    input.addEventListener('change', async (event) => {
      const listId = event.target.getAttribute('data-add-upload');
      const file = event.target.files?.[0];
      if (!listId || !file) return;
      try {
        updateUploadToast({
          title: 'Przesyłanie',
          message: `Wysyłanie: ${file.name}`,
          percent: 0,
          visible: true,
        });
        const result = await uploadFileWithResolution(file, (ratio) => {
          updateUploadToast({
            message: `Wysyłanie: ${file.name}`,
            percent: Math.round(ratio * 100),
          });
        });
        updateUploadToast({ title: 'Gotowe', message: 'Plik przesłany.', percent: 100 });
        setTimeout(() => updateUploadToast({ visible: false }), 1500);
        if (result?.url && !imageLists[listId].includes(result.url)) {
          imageLists[listId].push(result.url);
          renderImageList(listId);
        }
      } catch (err) {
        updateUploadToast({ title: 'Błąd', message: 'Nie udało się przesłać pliku.', percent: 0 });
        setTimeout(() => updateUploadToast({ visible: false }), 2500);
      }
      event.target.value = '';
    });
  });

  const galleryById = new Map(publishedGalleries.map((g) => [g.id, g]));
  const testimonialById = new Map(publishedTestimonials.map((t) => [t.id, t]));
  let latestGalleryIds = (page.home_latest_gallery_ids || []).filter((id) => galleryById.has(id));
  let homeTestimonialIds = (page.home_testimonial_ids || []).filter((id) =>
    testimonialById.has(id),
  );
  let weddingTestimonialIds = (page.wedding_testimonial_ids || []).filter((id) =>
    testimonialById.has(id),
  );
  const mediaByUrl = new Map((mediaFiles || []).map((file) => [file.url, file]));
  let portfolioMediaUrls = (page.portfolio_gallery_ids || [])
    .map((item) => String(item || '').trim())
    .filter((url) => mediaByUrl.has(url));
  let portfolioTag = 'all';
  let portfolioQuery = '';

  const renderLatestGalleries = () => {
    const allContainer = document.getElementById('latest-galleries-all');
    const selectedContainer = document.getElementById('latest-galleries-selected');
    const countEl = document.getElementById('latest-galleries-count');
    if (!allContainer || !selectedContainer) return;
    if (countEl) countEl.textContent = `${latestGalleryIds.length} / 6`;

    allContainer.innerHTML = publishedGalleries
      .map((gallery) => {
        const isSelected = latestGalleryIds.includes(gallery.id);
        const disabled = isSelected || latestGalleryIds.length >= 6;
        const thumb = gallery.cover_image || gallery.items?.[0]?.image_path || '';
        const thumbUrl = thumb ? resolveUploadsUrl(thumb) : '';
        return `
          <button type="button" class="flex w-full items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gold dark:bg-black/30 dark:text-gray-200 ${
            disabled ? 'opacity-40 cursor-not-allowed' : ''
          }" data-add-gallery="${gallery.id}" ${disabled ? 'disabled' : ''}>
            <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-black/40">
              ${thumbUrl ? `<img src="${thumbUrl}" class="h-full w-full object-cover" />` : ''}
            </div>
            <div>
              <p class="font-medium">${gallery.name || 'Bez nazwy'}</p>
              <p class="text-xs text-gray-400">${CATEGORY_MAP[gallery.category] || gallery.category}</p>
            </div>
          </button>
        `;
      })
      .join('');

    selectedContainer.innerHTML = latestGalleryIds
      .map((id) => {
        const gallery = galleryById.get(id);
        if (!gallery) return '';
        const thumb = gallery.cover_image || gallery.items?.[0]?.image_path || '';
        const thumbUrl = thumb ? resolveUploadsUrl(thumb) : '';
        return `
          <div class="flex items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/30 dark:text-gray-200" data-selected-gallery="${id}">
            <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-black/40">
              ${thumbUrl ? `<img src="${thumbUrl}" class="h-full w-full object-cover" />` : ''}
            </div>
            <div class="flex-1">
              <p class="font-medium">${gallery.name || 'Bez nazwy'}</p>
              <p class="text-xs text-gray-400">${CATEGORY_MAP[gallery.category] || gallery.category}</p>
            </div>
            <button type="button" class="text-xs uppercase tracking-widest text-red-500" data-remove-gallery="${id}">Usuń</button>
          </div>
        `;
      })
      .join('');

    if (!selectedContainer.dataset.sortable) {
      Sortable.create(selectedContainer, {
        animation: 150,
        onEnd: () => {
          latestGalleryIds = Array.from(selectedContainer.children)
            .map((child) => Number(child.dataset.selectedGallery))
            .filter((id) => !Number.isNaN(id));
          renderLatestGalleries();
        },
      });
      selectedContainer.dataset.sortable = 'true';
    }
  };

  const renderTestimonialsPicker = () => {
    const allContainer = document.getElementById('home-testimonials-all');
    const selectedContainer = document.getElementById('home-testimonials-selected');
    const countEl = document.getElementById('home-testimonials-count');
    if (!allContainer || !selectedContainer) return;
    if (countEl) countEl.textContent = `${homeTestimonialIds.length}`;

    allContainer.innerHTML = publishedTestimonials
      .map((t) => {
        const isSelected = homeTestimonialIds.includes(t.id);
        return `
          <button type="button" class="flex w-full items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gold dark:bg-black/30 dark:text-gray-200 ${
            isSelected ? 'opacity-40 cursor-not-allowed' : ''
          }" data-add-testimonial="${t.id}" ${isSelected ? 'disabled' : ''}>
            <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-black/40">
              ${
                t.avatar_image
                  ? `<img src="${resolveUploadsUrl(t.avatar_image)}" class="h-full w-full object-cover" />`
                  : ''
              }
            </div>
            <div>
              <p class="font-medium">${t.author || 'Bez autora'}</p>
              <p class="text-xs text-gray-400">${t.content ? t.content.slice(0, 40) + '…' : 'Brak treści'}</p>
            </div>
          </button>
        `;
      })
      .join('');

    selectedContainer.innerHTML = homeTestimonialIds
      .map((id) => {
        const t = testimonialById.get(id);
        if (!t) return '';
        return `
          <div class="flex items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/30 dark:text-gray-200" data-selected-testimonial="${id}">
            <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-black/40">
              ${
                t.avatar_image
                  ? `<img src="${resolveUploadsUrl(t.avatar_image)}" class="h-full w-full object-cover" />`
                  : ''
              }
            </div>
            <div class="flex-1">
              <p class="font-medium">${t.author || 'Bez autora'}</p>
              <p class="text-xs text-gray-400">${t.content ? t.content.slice(0, 40) + '…' : 'Brak treści'}</p>
            </div>
            <button type="button" class="text-xs uppercase tracking-widest text-red-500" data-remove-testimonial="${id}">Usuń</button>
          </div>
        `;
      })
      .join('');

    if (!selectedContainer.dataset.sortable) {
      Sortable.create(selectedContainer, {
        animation: 150,
        onEnd: () => {
          homeTestimonialIds = Array.from(selectedContainer.children)
            .map((child) => Number(child.dataset.selectedTestimonial))
            .filter((id) => !Number.isNaN(id));
          renderTestimonialsPicker();
        },
      });
      selectedContainer.dataset.sortable = 'true';
    }
  };

  const renderWeddingTestimonialsPicker = () => {
    const allContainer = document.getElementById('wedding-testimonials-all');
    const selectedContainer = document.getElementById('wedding-testimonials-selected');
    const countEl = document.getElementById('wedding-testimonials-count');
    if (!allContainer || !selectedContainer) return;
    if (countEl) countEl.textContent = `${weddingTestimonialIds.length}`;

    allContainer.innerHTML = publishedTestimonials
      .map((t) => {
        const isSelected = weddingTestimonialIds.includes(t.id);
        return `
          <button type="button" class="flex w-full items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gold dark:bg-black/30 dark:text-gray-200 ${
            isSelected ? 'opacity-40 cursor-not-allowed' : ''
          }" data-add-wedding-testimonial="${t.id}" ${isSelected ? 'disabled' : ''}>
            <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-black/40">
              ${
                t.avatar_image
                  ? `<img src="${resolveUploadsUrl(t.avatar_image)}" class="h-full w-full object-cover" />`
                  : ''
              }
            </div>
            <div>
              <p class="font-medium">${t.author || 'Bez autora'}</p>
              <p class="text-xs text-gray-400">${t.content ? t.content.slice(0, 40) + '…' : 'Brak treści'}</p>
            </div>
          </button>
        `;
      })
      .join('');

    selectedContainer.innerHTML = weddingTestimonialIds
      .map((id) => {
        const t = testimonialById.get(id);
        if (!t) return '';
        return `
          <div class="flex items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/30 dark:text-gray-200" data-selected-wedding-testimonial="${id}">
            <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-black/40">
              ${
                t.avatar_image
                  ? `<img src="${resolveUploadsUrl(t.avatar_image)}" class="h-full w-full object-cover" />`
                  : ''
              }
            </div>
            <div class="flex-1">
              <p class="font-medium">${t.author || 'Bez autora'}</p>
              <p class="text-xs text-gray-400">${t.content ? t.content.slice(0, 40) + '…' : 'Brak treści'}</p>
            </div>
            <button type="button" class="text-xs uppercase tracking-widest text-red-500" data-remove-wedding-testimonial="${id}">Usuń</button>
          </div>
        `;
      })
      .join('');

    if (!selectedContainer.dataset.sortable) {
      Sortable.create(selectedContainer, {
        animation: 150,
        onEnd: () => {
          weddingTestimonialIds = Array.from(selectedContainer.children)
            .map((child) => Number(child.dataset.selectedWeddingTestimonial))
            .filter((id) => !Number.isNaN(id));
          renderWeddingTestimonialsPicker();
        },
      });
      selectedContainer.dataset.sortable = 'true';
    }
  };

  renderLatestGalleries();
  renderTestimonialsPicker();
  renderWeddingTestimonialsPicker();
  renderWeddingSessionTypes();

  const addWeddingSessionTypeButton = document.getElementById('add-wedding-session-type');
  if (addWeddingSessionTypeButton) {
    addWeddingSessionTypeButton.addEventListener('click', () => {
      weddingSessionTypes = collectWeddingSessionTypesFromDom();
      weddingSessionTypes.push({ title: '', description: '', image: '', items: [] });
      renderWeddingSessionTypes();
    });
  }

  const weddingSessionTypesContainer = document.getElementById('wedding-session-types-list');
  if (weddingSessionTypesContainer) {
    weddingSessionTypesContainer.addEventListener('input', (event) => {
      const row = event.target.closest('.wedding-session-type-row');
      if (!row) return;
      const index = Number(row.getAttribute('data-session-type-index'));
      if (Number.isNaN(index) || !weddingSessionTypes[index]) return;
      if (event.target.classList.contains('wedding-session-type-title')) {
        weddingSessionTypes[index].title = event.target.value;
      }
      if (event.target.classList.contains('wedding-session-type-description')) {
        weddingSessionTypes[index].description = event.target.value;
      }
      if (event.target.classList.contains('wedding-session-type-image')) {
        weddingSessionTypes[index].image = event.target.value;
      }
      if (event.target.classList.contains('wedding-session-type-items')) {
        weddingSessionTypes[index].items = event.target.value
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    });

    weddingSessionTypesContainer.addEventListener('click', async (event) => {
      const removeButton = event.target.closest('[data-remove-session-type]');
      if (removeButton) {
        weddingSessionTypes = collectWeddingSessionTypesFromDom();
        const index = Number(removeButton.getAttribute('data-remove-session-type'));
        if (!Number.isNaN(index)) {
          weddingSessionTypes.splice(index, 1);
          renderWeddingSessionTypes();
        }
        return;
      }

      const moveButton = event.target.closest('[data-move-session-type]');
      if (moveButton) {
        weddingSessionTypes = collectWeddingSessionTypesFromDom();
        const direction = moveButton.getAttribute('data-move-session-type');
        const index = Number(moveButton.getAttribute('data-session-type-index'));
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (!Number.isNaN(index) && nextIndex >= 0 && nextIndex < weddingSessionTypes.length) {
          const [moved] = weddingSessionTypes.splice(index, 1);
          weddingSessionTypes.splice(nextIndex, 0, moved);
          renderWeddingSessionTypes();
        }
        return;
      }

      const pickButton = event.target.closest('[data-pick-session-image]');
      if (pickButton) {
        weddingSessionTypes = collectWeddingSessionTypesFromDom();
        const index = Number(pickButton.getAttribute('data-pick-session-image'));
        if (Number.isNaN(index)) return;
        const url = await openMediaPicker();
        if (url) {
          weddingSessionTypes[index].image = url;
          renderWeddingSessionTypes();
        }
        return;
      }

      const clearButton = event.target.closest('[data-clear-session-image]');
      if (clearButton) {
        weddingSessionTypes = collectWeddingSessionTypesFromDom();
        const index = Number(clearButton.getAttribute('data-clear-session-image'));
        if (Number.isNaN(index)) return;
        weddingSessionTypes[index].image = '';
        renderWeddingSessionTypes();
        return;
      }

      const uploadButton = event.target.closest('[data-upload-session-image]');
      if (uploadButton) {
        const index = Number(uploadButton.getAttribute('data-upload-session-image'));
        if (Number.isNaN(index)) return;
        weddingSessionTypesContainer
          .querySelector(`[data-session-type-upload-input="${index}"]`)
          ?.click();
      }
    });

    weddingSessionTypesContainer.addEventListener('change', async (event) => {
      const uploadInput = event.target.closest('[data-session-type-upload-input]');
      if (!uploadInput) return;
      const index = Number(uploadInput.getAttribute('data-session-type-upload-input'));
      const file = event.target.files?.[0];
      if (Number.isNaN(index) || !file) return;
      try {
        updateUploadToast({
          title: 'Przesyłanie',
          message: `Wysyłanie: ${file.name}`,
          percent: 0,
          visible: true,
        });
        const result = await uploadFileWithResolution(file, (ratio) => {
          updateUploadToast({
            message: `Wysyłanie: ${file.name}`,
            percent: Math.round(ratio * 100),
          });
        });
        updateUploadToast({ title: 'Gotowe', message: 'Plik przesłany.', percent: 100 });
        setTimeout(() => updateUploadToast({ visible: false }), 1500);
        weddingSessionTypes = collectWeddingSessionTypesFromDom();
        if (result?.url) {
          weddingSessionTypes[index].image = result.url;
          renderWeddingSessionTypes();
        }
      } catch (err) {
        updateUploadToast({ title: 'Błąd', message: 'Nie udało się przesłać pliku.', percent: 0 });
        setTimeout(() => updateUploadToast({ visible: false }), 2500);
      }
      event.target.value = '';
    });
  }

  const renderPortfolioPicker = () => {
    const allContainer = document.getElementById('portfolio-media-all');
    const selectedContainer = document.getElementById('portfolio-media-selected');
    const countEl = document.getElementById('portfolio-media-count');
    const filterInput = document.getElementById('portfolio-media-filter');
    if (!allContainer || !selectedContainer) return;
    if (countEl) countEl.textContent = `${portfolioMediaUrls.length}`;
    if (filterInput) filterInput.value = portfolioQuery;

    const filtered = (mediaFiles || []).filter((file) => {
      if (portfolioTag !== 'all' && file.tag !== portfolioTag) return false;
      if (!portfolioQuery) return true;
      const haystack = `${file.name || ''} ${file.url || ''}`.toLowerCase();
      return haystack.includes(portfolioQuery.toLowerCase());
    });

    allContainer.innerHTML = filtered
      .map((file) => {
        const isSelected = portfolioMediaUrls.includes(file.url);
        return `
          <button type="button" class="flex w-full items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-gold dark:bg-black/30 dark:text-gray-200 ${
            isSelected ? 'opacity-40 cursor-not-allowed' : ''
          }" data-add-portfolio-media="${file.url}" ${isSelected ? 'disabled' : ''}>
            <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-black/40">
              <img src="${resolveUploadsUrl(file.url)}" class="h-full w-full object-cover" />
            </div>
            <div>
              <p class="font-medium">${file.name || 'Bez nazwy'}</p>
              <p class="text-xs text-gray-400">Tag: ${file.tag || 'other'}</p>
            </div>
          </button>
        `;
      })
      .join('');

    selectedContainer.innerHTML = portfolioMediaUrls
      .map((url) => {
        const file = mediaByUrl.get(url);
        if (!file) return '';
        return `
          <div class="flex items-center gap-3 rounded border border-gray-200 dark:border-white/10 bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/30 dark:text-gray-200" data-selected-portfolio-media="${url}">
            <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-black/40">
              <img src="${resolveUploadsUrl(file.url)}" class="h-full w-full object-cover" />
            </div>
            <div class="flex-1">
              <p class="font-medium">${file.name || 'Bez nazwy'}</p>
              <p class="text-xs text-gray-400">Tag: ${file.tag || 'other'}</p>
            </div>
            <button type="button" class="text-xs uppercase tracking-widest text-red-500" data-remove-portfolio-media="${url}">Usuń</button>
          </div>
        `;
      })
      .join('');

    if (!selectedContainer.dataset.sortable) {
      Sortable.create(selectedContainer, {
        animation: 150,
        onEnd: () => {
          portfolioMediaUrls = Array.from(selectedContainer.children)
            .map((child) => child.dataset.selectedPortfolioMedia)
            .filter(Boolean);
        },
      });
      selectedContainer.dataset.sortable = 'true';
    }

    document.querySelectorAll('[data-portfolio-tag]').forEach((button) => {
      const value = button.getAttribute('data-portfolio-tag');
      button.classList.toggle('bg-gold', portfolioTag === value);
      button.classList.toggle('text-black', portfolioTag === value);
      button.classList.toggle('border-gold', portfolioTag === value);
      button.classList.toggle('text-gray-500', portfolioTag !== value);
      button.classList.toggle('dark:text-gray-300', portfolioTag !== value);
    });
  };

  renderPortfolioPicker();

  const latestAllContainer = document.getElementById('latest-galleries-all');
  if (latestAllContainer) {
    latestAllContainer.addEventListener('click', (event) => {
      const addGallery = event.target.closest('[data-add-gallery]');
      if (!addGallery) return;
      const id = Number(addGallery.getAttribute('data-add-gallery'));
      if (!Number.isNaN(id) && !latestGalleryIds.includes(id) && latestGalleryIds.length < 6) {
        latestGalleryIds.push(id);
        renderLatestGalleries();
      }
    });
  }

  const latestSelectedContainer = document.getElementById('latest-galleries-selected');
  if (latestSelectedContainer) {
    latestSelectedContainer.addEventListener('click', (event) => {
      const removeGallery = event.target.closest('[data-remove-gallery]');
      if (!removeGallery) return;
      const id = Number(removeGallery.getAttribute('data-remove-gallery'));
      latestGalleryIds = latestGalleryIds.filter((item) => item !== id);
      renderLatestGalleries();
    });
  }

  const testimonialsAllContainer = document.getElementById('home-testimonials-all');
  if (testimonialsAllContainer) {
    testimonialsAllContainer.addEventListener('click', (event) => {
      const addTestimonial = event.target.closest('[data-add-testimonial]');
      if (!addTestimonial) return;
      const id = Number(addTestimonial.getAttribute('data-add-testimonial'));
      if (!Number.isNaN(id) && !homeTestimonialIds.includes(id)) {
        homeTestimonialIds.push(id);
        renderTestimonialsPicker();
      }
    });
  }

  const testimonialsSelectedContainer = document.getElementById('home-testimonials-selected');
  if (testimonialsSelectedContainer) {
    testimonialsSelectedContainer.addEventListener('click', (event) => {
      const removeTestimonial = event.target.closest('[data-remove-testimonial]');
      if (!removeTestimonial) return;
      const id = Number(removeTestimonial.getAttribute('data-remove-testimonial'));
      homeTestimonialIds = homeTestimonialIds.filter((item) => item !== id);
      renderTestimonialsPicker();
    });
  }

  const weddingTestimonialsAllContainer = document.getElementById('wedding-testimonials-all');
  if (weddingTestimonialsAllContainer) {
    weddingTestimonialsAllContainer.addEventListener('click', (event) => {
      const addTestimonial = event.target.closest('[data-add-wedding-testimonial]');
      if (!addTestimonial) return;
      const id = Number(addTestimonial.getAttribute('data-add-wedding-testimonial'));
      if (!Number.isNaN(id) && !weddingTestimonialIds.includes(id)) {
        weddingTestimonialIds.push(id);
        renderWeddingTestimonialsPicker();
      }
    });
  }

  const weddingTestimonialsSelectedContainer = document.getElementById(
    'wedding-testimonials-selected',
  );
  if (weddingTestimonialsSelectedContainer) {
    weddingTestimonialsSelectedContainer.addEventListener('click', (event) => {
      const removeTestimonial = event.target.closest('[data-remove-wedding-testimonial]');
      if (!removeTestimonial) return;
      const id = Number(removeTestimonial.getAttribute('data-remove-wedding-testimonial'));
      weddingTestimonialIds = weddingTestimonialIds.filter((item) => item !== id);
      renderWeddingTestimonialsPicker();
    });
  }

  const applyHomeContentVisibility = () => {
    const contentSection = document.getElementById('content-section');
    const homeDetailsSection = document.getElementById('home-details-section');
    const weddingDetailsSection = document.getElementById('wedding-details-section');
    const portfolioDetailsSection = document.getElementById('portfolio-details-section');
    const aboutDetailsSection = document.getElementById('about-details-section');
    const faqDetailsSection = document.getElementById('faq-details-section');
    if (contentSection)
      contentSection.classList.toggle(
        'hidden',
        isHomePage || isWeddingPage || isPortfolioPage || isAboutPage,
      );
    if (homeDetailsSection) homeDetailsSection.classList.toggle('hidden', !isHomePage);
    if (weddingDetailsSection) weddingDetailsSection.classList.toggle('hidden', !isWeddingPage);
    if (portfolioDetailsSection)
      portfolioDetailsSection.classList.toggle('hidden', !isPortfolioPage);
    if (aboutDetailsSection) aboutDetailsSection.classList.toggle('hidden', !isAboutPage);
    if (faqDetailsSection) faqDetailsSection.classList.toggle('hidden', !isLandingFaqPage);
  };

  const initDetailsAccordions = () => {
    const items = Array.from(document.querySelectorAll('[data-details-item]'));
    items.forEach((item, index) => {
      if (item.dataset.accordionReady === 'true') return;

      const sectionTitle = item.dataset.detailsTitle || `Sekcja ${index + 1}`;
      const panel = document.createElement('div');
      panel.className = 'details-accordion-panel mt-4 hidden space-y-4';
      panel.id = `details-accordion-panel-${index}`;

      while (item.firstChild) {
        panel.appendChild(item.firstChild);
      }

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className =
        'details-accordion-trigger flex w-full items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50/60 px-4 py-3 text-left transition-colors hover:border-gold dark:border-white/10 dark:bg-black/20';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panel.id);
      trigger.innerHTML = `
        <span class="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-200">${sectionTitle}</span>
        <span class="text-base text-gold" data-accordion-icon>+</span>
      `;

      trigger.addEventListener('click', () => {
        const isOpen = !panel.classList.contains('hidden');
        panel.classList.toggle('hidden', isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
        const icon = trigger.querySelector('[data-accordion-icon]');
        if (icon) icon.textContent = isOpen ? '+' : '−';
      });

      item.classList.add('rounded-lg');
      item.appendChild(trigger);
      item.appendChild(panel);
      item.dataset.accordionReady = 'true';
    });

    const firstVisibleTrigger = document.querySelector(
      '[data-details-item]:not(.hidden) .details-accordion-trigger',
    );
    if (firstVisibleTrigger instanceof HTMLElement) {
      firstVisibleTrigger.click();
    }
  };

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

  applyHomeContentVisibility();
  initDetailsAccordions();

  const portfolioAllContainer = document.getElementById('portfolio-media-all');
  if (portfolioAllContainer) {
    portfolioAllContainer.addEventListener('click', (event) => {
      const addMedia = event.target.closest('[data-add-portfolio-media]');
      if (!addMedia) return;
      const mediaUrl = addMedia.getAttribute('data-add-portfolio-media') || '';
      if (mediaUrl && !portfolioMediaUrls.includes(mediaUrl)) {
        portfolioMediaUrls.push(mediaUrl);
        renderPortfolioPicker();
      }
    });
  }

  const portfolioSelectedContainer = document.getElementById('portfolio-media-selected');
  if (portfolioSelectedContainer) {
    portfolioSelectedContainer.addEventListener('click', (event) => {
      const removeMedia = event.target.closest('[data-remove-portfolio-media]');
      if (!removeMedia) return;
      const mediaUrl = removeMedia.getAttribute('data-remove-portfolio-media') || '';
      portfolioMediaUrls = portfolioMediaUrls.filter((item) => item !== mediaUrl);
      renderPortfolioPicker();
    });
  }

  const portfolioFilterInput = document.getElementById('portfolio-media-filter');
  if (portfolioFilterInput) {
    portfolioFilterInput.addEventListener('input', (event) => {
      portfolioQuery = event.target.value;
      renderPortfolioPicker();
    });
  }

  document.querySelectorAll('[data-portfolio-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      portfolioTag = button.getAttribute('data-portfolio-tag') || 'all';
      renderPortfolioPicker();
    });
  });

  document.getElementById('page-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (window.tinymce) tinymce.triggerSave();

    if (isHomePage && latestGalleryIds.length !== 6) {
      alert('Wybierz dokładnie 6 sesji do sekcji Latest Moments.');
      return;
    }

    if (isHomePage && homeTestimonialIds.length < 3) {
      alert('Wybierz minimum 3 opinie na stronie głównej.');
      return;
    }

    if (isAboutPage) {
      if (imageLists.about_origin_images.length !== 3) {
        alert('W sekcji "From North Africa..." wybierz dokładnie 3 zdjęcia.');
        return;
      }
      if (imageLists.about_story_images.length !== 3) {
        alert('W sekcji zdjęć z podpisami wybierz dokładnie 3 zdjęcia.');
        return;
      }
      if (imageLists.about_work_images.length !== 3) {
        alert('W sekcji "What excites me most..." wybierz dokładnie 3 zdjęcia.');
        return;
      }
    }

    const data = {
      title: document.getElementById('title').value,
      content: document.getElementById('content')?.value || '',
      hero_image: document.getElementById('hero_image').value,
      is_home: isHomePage,
    };

    if (isHomePage) {
      data.home_gallery_wedding_images = imageLists.home_gallery_wedding_images;
      data.home_gallery_portrait_images = imageLists.home_gallery_portrait_images;
      data.home_gallery_product_images = imageLists.home_gallery_product_images;
      data.home_moments_image = document.getElementById('home_moments_image')?.value || '';
      data.home_latest_moments_bg = document.getElementById('home_latest_moments_bg')?.value || '';
      data.home_latest_gallery_ids = latestGalleryIds;
      data.home_testimonial_ids = homeTestimonialIds;
    }

    if (isWeddingPage) {
      data.wedding_slider_images = imageLists.wedding_slider_images;
      data.wedding_testimonial_ids = weddingTestimonialIds;
      data.wedding_session_types = collectWeddingSessionTypesFromDom();
    }

    if (isPortfolioPage) {
      data.portfolio_gallery_ids = portfolioMediaUrls;
    }

    if (isAboutPage) {
      data.about_origin_images = imageLists.about_origin_images;
      data.about_story_images = imageLists.about_story_images;
      data.about_work_images = imageLists.about_work_images;
      data.about_story_captions = [0, 1, 2].map(
        (index) => document.getElementById(`about_story_caption_${index}`)?.value?.trim() || '',
      );
    }

    if (isLandingFaqPage) {
      const rows = Array.from(document.querySelectorAll('.faq-item-row'));
      data.faq_items = rows
        .map((row) => {
          const questionInput = row.querySelector('.faq-question');
          const answerTextarea = row.querySelector('.faq-wysiwyg');
          return {
            question: questionInput?.value?.trim() || '',
            answer: answerTextarea?.value?.trim() || '',
          };
        })
        .filter((item) => item.question && item.answer);
    }

    // Add SEO Link data if admin
    if (currentUser.role === 'ADMIN') {
      data.meta_title = document.getElementById('meta_title').value;
      data.meta_description = document.getElementById('meta_description').value;
      data.seo_image = document.getElementById('seo_image').value;
      data.seo_use_hero = document.getElementById('seo_use_hero')?.checked || false;
    }

    try {
      const res = await fetch(`${ADMIN_API_URL}/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errText = errJson ? '' : await res.text().catch(() => '');
        throw new Error(errJson?.error || errText || `Blad zapisu (${res.status})`);
      }
      closeModal();
      loadPages();
    } catch (err) {
      console.error('Blad zapisu strony', err);
      alert(`Nie udalo sie zapisac zmian: ${err.message || 'blad zapisu'}`);
    }
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
  const query = galleriesFilterQuery.trim().toLowerCase();
  const filteredByCategory =
    galleriesFilterCategory === 'all'
      ? galleries
      : galleries.filter((g) => g.category === galleriesFilterCategory);
  const filteredGalleries = query
    ? filteredByCategory.filter((g) => {
        const label = `${g.name || ''} ${g.category || ''}`.toLowerCase();
        return label.includes(query);
      })
    : filteredByCategory;

  const renderGrid = () => `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${filteredGalleries
        .map((g) => {
          const cover = g.cover_image || g.items?.[0]?.image_path || '';
          return `
            <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden group hover:border-gold/50 transition-colors shadow-sm">
              <div class="h-48 bg-gray-100 dark:bg-black/50 relative">
                ${
                  cover
                    ? `<img src="${resolveUploadsUrl(cover)}" class="w-full h-full object-cover">`
                    : '<div class="flex items-center justify-center h-full text-gray-500">Brak zdjęć</div>'
                }
                <div class="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-gold">
                  ${CATEGORY_MAP[g.category] || g.category}
                </div>
              </div>
              <div class="p-5">
                <h3 class="font-display font-medium text-lg text-gray-900 dark:text-white mb-1 group-hover:text-gold transition-colors">${
                  g.name || 'Bez nazwy'
                }</h3>
                <p class="text-xs text-gray-500 uppercase tracking-widest mb-4">${g.items ? g.items.length : 0} zdjęć</p>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" onclick="editGallery(${g.id})" class="w-full py-2 border border-gray-300 dark:border-white/10 rounded text-gray-600 dark:text-gray-300 hover:bg-gold hover:text-black hover:border-gold transition-colors font-medium">Edytuj</button>
                  <button type="button" onclick="deleteGallery(${g.id})" class="w-full py-2 border border-red-500/40 rounded text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors font-medium">Usuń</button>
                </div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  const renderList = () => `
    <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm">
      <table class="w-full text-left">
        <thead class="bg-gray-50 dark:bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4">Sesja</th>
            <th class="px-6 py-4">Kategoria</th>
            <th class="px-6 py-4">Zdjęcia</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-white/5 text-sm text-gray-600 dark:text-gray-300">
          ${filteredGalleries
            .map(
              (g) => `
              <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  <button type="button" onclick="editGallery(${g.id})" class="text-left transition-colors hover:text-gold">
                    ${g.name || 'Bez nazwy'}
                  </button>
                </td>
                <td class="px-6 py-4"><span class="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-200">${CATEGORY_MAP[g.category] || g.category}</span></td>
                <td class="px-6 py-4">${g.items ? g.items.length : 0}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-bold uppercase ${
                    g.published !== false
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500'
                  }">
                    ${g.published !== false ? 'Opublikowana' : 'Ukryta'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button type="button" onclick="editGallery(${g.id})" class="text-gold hover:text-black dark:hover:text-white transition-colors font-medium">Edytuj</button>
                  <button type="button" onclick="deleteGallery(${g.id})" class="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">Usuń</button>
                </td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  const categoryButton = (value, label) => `
    <button type="button" data-category="${value}" class="${getTagPillClass(galleriesFilterCategory === value)}">${label}</button>
  `;

  container.innerHTML = `
    <div class="mb-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Sesje zdjęciowe</h2>
          <input id="galleries-filter" type="text" placeholder="Szukaj sesji" class="${CONTENT_SEARCH_INPUT_CLASS}" />
        </div>
        <button type="button" onclick="editGallery(null)" class="${CONTENT_ACTION_BUTTON_CLASS}">${PLUS_ICON_HTML}<span>Nowa sesja</span></button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        ${categoryButton('all', 'Wszystkie')}
        ${categoryButton('wedding', 'Ślubne')}
        ${categoryButton('portrait', 'Portretowe')}
        ${categoryButton('product', 'Produktowe')}
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" id="galleries-view-list" class="${getToggleButtonClass(galleriesViewMode === 'list')}">Lista</button>
          <button type="button" id="galleries-view-grid" class="${getToggleButtonClass(galleriesViewMode === 'grid')}">Siatka</button>
        </div>
      </div>
    </div>
    ${galleriesViewMode === 'list' ? renderList() : renderGrid()}
  `;

  const filterInput = document.getElementById('galleries-filter');
  if (filterInput) {
    filterInput.value = galleriesFilterQuery;
    filterInput.addEventListener('input', (event) => {
      galleriesFilterQuery = event.target.value;
      renderGalleries(galleries);
      const nextInput = document.getElementById('galleries-filter');
      if (nextInput) {
        nextInput.focus();
        const pos = galleriesFilterQuery.length;
        nextInput.setSelectionRange(pos, pos);
      }
    });
  }

  const gridBtn = document.getElementById('galleries-view-grid');
  const listBtn = document.getElementById('galleries-view-list');
  if (gridBtn)
    gridBtn.addEventListener('click', () => {
      galleriesViewMode = 'grid';
      renderGalleries(galleries);
    });
  if (listBtn)
    listBtn.addEventListener('click', () => {
      galleriesViewMode = 'list';
      renderGalleries(galleries);
    });

  container.querySelectorAll('[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      galleriesFilterCategory = btn.dataset.category;
      renderGalleries(galleries);
    });
  });
}

window.filterGalleries = (category) => {
  if (category === 'all') {
    renderGalleries(window.allGalleries);
  } else {
    const filtered = window.allGalleries.filter((g) => g.category === category);
    renderGalleries(filtered);
  }
};

window.deleteGallery = async (id) => {
  if (!confirm('Czy na pewno chcesz usunąć tę sesję?')) return;
  await fetch(`${ADMIN_API_URL}/galleries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  loadGalleries();
};

window.editGallery = async (id) => {
  let gallery = {
    category: 'wedding',
    name: '',
    short_description: '',
    items: [],
    published: false,
  };
  if (id) {
    const res = await fetch(`${ADMIN_API_URL}/galleries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    gallery = all.find((g) => g.id === id) || gallery;
  }

  if (id) {
    const firstImage = gallery.items?.[0]?.image_path || null;
    gallery.cover_image = firstImage || gallery.cover_image || null;
  }

  const html = `
        <div class="h-[72vh] space-y-6 overflow-y-auto pr-1">
            <form id="gallery-form" class="rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-white/10 dark:bg-black/20">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
            <div class="space-y-2">
                      <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Nazwa sesji</label>
                      <input type="text" id="name" value="${gallery.name || ''}" class="w-full rounded border border-gray-300 bg-white p-2 font-medium text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/30 dark:text-white">
                    </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Kategoria</label>
              <select id="category" class="w-full rounded border border-gray-300 bg-white p-2 font-medium text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/30 dark:text-white">
                <option value="wedding" ${gallery.category === 'wedding' ? 'selected' : ''}>Ślubna</option>
                <option value="portrait" ${gallery.category === 'portrait' ? 'selected' : ''}>Portretowa</option>
                <option value="product" ${gallery.category === 'product' ? 'selected' : ''}>Produktowa</option>
              </select>
            </div>
                </div>
                <div class="mt-4 space-y-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Krótki opis</label>
                  <textarea id="short_description" rows="3" class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/30 dark:text-white">${gallery.short_description || ''}</textarea>
                </div>
                ${!id ? '<p class="mt-3 text-xs text-gray-500">Zapisz sesję, aby móc dodawać zdjęcia.</p>' : ''}
            </form>

            ${
              id
                ? `
                <div class="rounded-xl border border-gray-200 p-5 dark:border-white/10">
                  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 class="font-display text-xl text-gray-900 dark:text-white">Zdjęcia (${gallery.items ? gallery.items.length : 0})</h3>
                      <p class="text-xs uppercase tracking-widest text-gray-500">Pierwsze zdjęcie jest automatycznie okładką</p>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs uppercase tracking-wider text-gray-500">Przeciągnij, by zmienić kolejność</span>
                      <button onclick="handleGalleryAddImages(${id})" type="button" class="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gold hover:text-gold dark:border-white/10 dark:text-gray-300">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        Dodaj zdjęcia
                      </button>
                    </div>
                  </div>
                  <div id="gallery-grid" class="grid grid-cols-2 gap-4 pb-2 md:grid-cols-4">
                    ${(gallery.items || [])
                      .map(
                        (item, index) => `
                        <div class="relative group aspect-square cursor-move overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-black ${
                          index === 0 ? 'ring-2 ring-gold border-gold' : ''
                        }" data-id="${item.id}" data-image-path="${item.image_path || ''}">
                            <img src="${resolveUploadsUrl(item.image_path)}" class="h-full w-full object-cover">
                            ${
                              index === 0
                                ? '<span class="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] uppercase tracking-widest text-gold">Okładka</span>'
                                : ''
                            }
                            <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                <button onclick="deleteGalleryItem(${item.id}, ${id})" class="p-2 text-red-500 hover:text-red-400">
                                     <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join('')}
                  </div>
                </div>
              `
                : ''
            }
        </div>
    `;

  openModal(id ? 'Edycja Sesji' : 'Nowa Sesja', html);
  setModalHeaderAccessory(`
    <label class="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
      <input type="checkbox" id="gallery_published" ${gallery.published !== false ? 'checked' : ''} class="h-4 w-4 cursor-pointer accent-gold">
      <span>Opublikowana</span>
    </label>
  `);
  setModalPrimaryAction(() => {
    const form = document.getElementById('gallery-form');
    if (form) form.requestSubmit();
  });

  const galleryGrid = document.getElementById('gallery-grid');
  const updateCoverMarker = () => {
    if (!galleryGrid) return;
    Array.from(galleryGrid.children).forEach((child, index) => {
      child.classList.toggle('ring-2', index === 0);
      child.classList.toggle('ring-gold', index === 0);
      child.classList.toggle('border-gold', index === 0);

      const oldBadge = child.querySelector('[data-cover-badge]');
      if (oldBadge) oldBadge.remove();
      if (index === 0) {
        const badge = document.createElement('span');
        badge.dataset.coverBadge = 'true';
        badge.className =
          'absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] uppercase tracking-widest text-gold';
        badge.textContent = 'Okładka';
        child.appendChild(badge);
      }
    });
  };

  const persistCoverFromGrid = async () => {
    if (!id || !galleryGrid) return;
    const firstItem = galleryGrid.firstElementChild;
    const coverImage = firstItem?.getAttribute('data-image-path') || null;
    await fetch(`${ADMIN_API_URL}/galleries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cover_image: coverImage }),
    });
  };

  // Save Form Logic
  document.getElementById('gallery-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      category: document.getElementById('category').value,
      name: document.getElementById('name').value,
      short_description: document.getElementById('short_description').value || null,
      published: document.getElementById('gallery_published').checked,
      cover_image: document.getElementById('cover_image').value || null,
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
        await persistCoverFromGrid();
        loadGalleries(); // Just refresh list background
        alert('Zapisano');
      }
    }
  });

  // Init Sortable if existing
  if (id) {
    if (galleryGrid) {
      Sortable.create(galleryGrid, {
        animation: 150,
        onEnd: async () => {
          const ids = Array.from(galleryGrid.children).map((el) => el.dataset.id);
          await fetch(`${ADMIN_API_URL}/gallery-items/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ items: ids }),
          });

          updateCoverMarker();
          await persistCoverFromGrid();
        },
      });

      updateCoverMarker();
    }
  }
};

window.syncGalleryCoverToFirst = async (galleryId) => {
  const res = await fetch(`${ADMIN_API_URL}/galleries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const galleries = await res.json();
  const gallery = (galleries || []).find((item) => item.id === galleryId);
  const coverImage = gallery?.items?.[0]?.image_path || null;

  await fetch(`${ADMIN_API_URL}/galleries/${galleryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cover_image: coverImage }),
  });
};

window.handleGalleryAddImages = async (galleryId) => {
  const urls = await openMediaPicker({ multiple: true });
  if (!Array.isArray(urls) || urls.length === 0) return;
  await Promise.all(
    urls.map((url) =>
      fetch(`${ADMIN_API_URL}/gallery-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          gallery_id: galleryId,
          image_path: url,
          title: 'Image',
        }),
      }),
    ),
  );
  await window.syncGalleryCoverToFirst(galleryId);
  closeModal();
  editGallery(galleryId);
};

window.deleteGalleryItem = async (itemId, galleryId) => {
  if (!confirm('Usunąć zdjęcie?')) return;
  await fetch(`${ADMIN_API_URL}/gallery-items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await window.syncGalleryCoverToFirst(galleryId);
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

  const query = testimonialsFilterQuery.trim().toLowerCase();
  const filteredByCategory =
    testimonialsFilterCategory === 'all'
      ? testimonials
      : testimonials.filter((t) => {
          const category = t.gallery?.category || 'other';
          return category === testimonialsFilterCategory;
        });
  const filteredTestimonials = query
    ? filteredByCategory.filter((t) => {
        const label = `${t.author || ''} ${t.content || ''}`.toLowerCase();
        return label.includes(query);
      })
    : filteredByCategory;

  const renderList = () => `
    <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden shadow-sm">
      <table class="w-full text-left">
        <thead class="bg-gray-50 dark:bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th class="px-6 py-4">Avatar</th>
            <th class="px-6 py-4">Klient</th>
            <th class="px-6 py-4">Kategoria</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-white/5 text-sm text-gray-600 dark:text-gray-300">
          ${filteredTestimonials
            .map(
              (t) => `
              <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td class="px-6 py-4">
                  ${
                    t.avatar_image
                      ? `<button type="button" onclick="editTestimonial(${t.id})" class="block rounded-full transition-transform hover:scale-105"><img src="${resolveUploadsUrl(t.avatar_image)}" srcset="${getImageSrcSet(
                          t.avatar_image,
                          [160, 480],
                        )}" sizes="40px" loading="lazy" decoding="async" class="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/10" /></button>`
                      : '<span class="text-xs text-gray-400">Brak</span>'
                  }
                </td>
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  <button type="button" onclick="editTestimonial(${t.id})" class="text-left transition-colors hover:text-gold">${t.author}</button>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-200">${CATEGORY_MAP[t.gallery?.category] || (t.gallery ? t.gallery.category : 'Inne')}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded text-xs font-bold uppercase ${
                    t.approved
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500'
                  }">
                    ${t.approved ? 'Opublikowana' : 'Ukryta'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button type="button" onclick="editTestimonial(${t.id})" class="text-gold hover:text-black dark:hover:text-white transition-colors font-medium">Edytuj</button>
                  <button type="button" onclick="deleteTestimonial(${t.id})" class="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">Usuń</button>
                </td>
              </tr>
            `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  const renderGrid = () => `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${filteredTestimonials
        .map(
          (t) => `
          <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
            <div class="flex items-start gap-3">
              <button type="button" onclick="editTestimonial(${t.id})" class="shrink-0 rounded-full transition-transform hover:scale-105">
                ${
                  t.avatar_image
                    ? `<img src="${resolveUploadsUrl(t.avatar_image)}" class="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-white/10" />`
                    : '<div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10"></div>'
                }
              </button>
              <div class="min-w-0 flex-1">
                <button type="button" onclick="editTestimonial(${t.id})" class="text-left text-sm font-medium text-gray-900 transition-colors hover:text-gold dark:text-white">${t.author}</button>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-200">${CATEGORY_MAP[t.gallery?.category] || (t.gallery ? t.gallery.category : 'Inne')}</span>
                  <span class="text-xs ${
                    t.approved ? 'text-emerald-500' : 'text-yellow-500'
                  }">${t.approved ? 'Opublikowana' : 'Ukryta'}</span>
                </div>
              </div>
            </div>
            <p class="mt-4 text-xs text-gray-500 line-clamp-4">${t.content || ''}</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onclick="editTestimonial(${t.id})" class="w-full py-2 border border-gray-300 dark:border-white/10 rounded text-gray-600 dark:text-gray-300 hover:bg-gold hover:text-black hover:border-gold transition-colors font-medium">Edytuj</button>
              <button type="button" onclick="deleteTestimonial(${t.id})" class="w-full py-2 border border-red-500/40 rounded text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors font-medium">Usuń</button>
            </div>
          </div>
        `,
        )
        .join('')}
    </div>
  `;

  container.innerHTML = `
    <div class="mb-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Opinie klientów</h2>
          <input id="testimonials-filter" type="text" placeholder="Szukaj opinii" class="${CONTENT_SEARCH_INPUT_CLASS}" />
        </div>
        <button type="button" onclick="editTestimonial(null)" class="${CONTENT_ACTION_BUTTON_CLASS}">${PLUS_ICON_HTML}<span>Dodaj opinię</span></button>
      </div>
      <div class="mb-6 flex flex-wrap items-center gap-2">
        <button type="button" data-testimonials-category="all" class="${getTagPillClass(testimonialsFilterCategory === 'all')}">Wszystkie</button>
        <button type="button" data-testimonials-category="wedding" class="${getTagPillClass(testimonialsFilterCategory === 'wedding')}">Ślubne</button>
        <button type="button" data-testimonials-category="portrait" class="${getTagPillClass(testimonialsFilterCategory === 'portrait')}">Portretowe</button>
        <button type="button" data-testimonials-category="product" class="${getTagPillClass(testimonialsFilterCategory === 'product')}">Produktowe</button>
        <button type="button" data-testimonials-category="other" class="${getTagPillClass(testimonialsFilterCategory === 'other')}">Inne</button>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" id="testimonials-view-list" class="${getToggleButtonClass(testimonialsViewMode === 'list')}">Lista</button>
          <button type="button" id="testimonials-view-grid" class="${getToggleButtonClass(testimonialsViewMode === 'grid')}">Siatka</button>
        </div>
      </div>
    </div>
    ${testimonialsViewMode === 'grid' ? renderGrid() : renderList()}
  `;

  const filterInput = document.getElementById('testimonials-filter');
  if (filterInput) {
    filterInput.value = testimonialsFilterQuery;
    filterInput.addEventListener('input', (event) => {
      testimonialsFilterQuery = event.target.value;
      loadTestimonials();
      const nextInput = document.getElementById('testimonials-filter');
      if (nextInput) {
        nextInput.focus();
        const pos = testimonialsFilterQuery.length;
        nextInput.setSelectionRange(pos, pos);
      }
    });
  }

  const listBtn = document.getElementById('testimonials-view-list');
  const gridBtn = document.getElementById('testimonials-view-grid');
  if (listBtn)
    listBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      testimonialsViewMode = 'list';
      loadTestimonials();
    });
  if (gridBtn)
    gridBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      testimonialsViewMode = 'grid';
      loadTestimonials();
    });

  container.querySelectorAll('[data-testimonials-category]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      testimonialsFilterCategory = button.getAttribute('data-testimonials-category') || 'all';
      loadTestimonials();
    });
  });
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
            <div class="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
              <div class="space-y-6">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Autor</label>
                    <input type="text" id="t_author" value="${t.author}" class="mt-1 w-full rounded border border-gray-300 bg-gray-50 p-2 font-medium text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white" required>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Powiązana sesja (opcjonalnie)</label>
                    <select id="t_gallery" class="mt-1 w-full rounded border border-gray-300 bg-gray-50 p-2 font-medium text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white">
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
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Avatar (wymagany)</label>
                <div>
                  <div id="t_avatar_empty" class="${t.avatar_image ? 'hidden' : ''} w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-400 transition-colors hover:border-gold hover:text-gold dark:border-white/10">
                    <div class="flex flex-col items-center justify-center gap-3 text-center">
                      <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                      <p class="text-sm">Wybierz avatar z biblioteki lub z komputera</p>
                      <div class="flex flex-wrap gap-2">
                        <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('t_avatar', url))">Z biblioteki</button>
                        <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="document.getElementById('t_avatar_upload').click()">Z komputera</button>
                      </div>
                    </div>
                  </div>
                  <div id="t_avatar_filled" class="${t.avatar_image ? '' : 'hidden'}">
                    <img id="t_avatar_preview" src="${resolveUploadsUrl(t.avatar_image || '')}" class="h-56 w-full rounded-lg border border-gray-200 object-cover dark:border-white/10" />
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('t_avatar', url))">Zmień</button>
                      <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="updateImagePicker('t_avatar', '')">Usuń</button>
                    </div>
                  </div>
                  <input type="text" id="t_avatar" value="${t.avatar_image || ''}" class="hidden">
                  <input type="file" id="t_avatar_upload" class="hidden" accept="image/*">
                </div>
              </div>
            </div>
            
            <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Treść</label>
                <textarea id="t_content" class="wysiwyg h-56">${t.content || ''}</textarea>
            </div>
        </form>
    `;

  openModal(id ? 'Edycja Opinii' : 'Nowa Opinia', html);
  initTinyMCE();
  setModalHeaderAccessory(`
    <label class="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
      <input type="checkbox" id="t_approved" ${t.approved ? 'checked' : ''} class="h-4 w-4 cursor-pointer accent-gold">
      <span>Opublikowana</span>
    </label>
  `);
  setModalPrimaryAction(() => {
    const form = document.getElementById('t-form');
    if (form) form.requestSubmit();
  });

  document.getElementById('t-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (window.tinymce) tinymce.triggerSave();
    if (!document.getElementById('t_avatar').value) {
      alert('Avatar jest wymagany.');
      return;
    }
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

  const avatarUploadInput = document.getElementById('t_avatar_upload');
  if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        updateUploadToast({
          title: 'Przesyłanie',
          message: `Wysyłanie: ${file.name}`,
          percent: 0,
          visible: true,
        });
        const result = await uploadFileWithResolution(file, (ratio) => {
          updateUploadToast({
            message: `Wysyłanie: ${file.name}`,
            percent: Math.round(ratio * 100),
          });
        });
        updateUploadToast({ title: 'Gotowe', message: 'Plik przesłany.', percent: 100 });
        setTimeout(() => updateUploadToast({ visible: false }), 1500);
        if (result?.url) window.updateImagePicker('t_avatar', result.url);
      } catch (err) {
        updateUploadToast({ title: 'Błąd', message: 'Nie udało się przesłać pliku.', percent: 0 });
        setTimeout(() => updateUploadToast({ visible: false }), 2500);
      }
      event.target.value = '';
    });
  }
};

window.deleteTestimonial = async (id) => {
  if (!confirm('Czy na pewno?')) return;
  await fetch(`${ADMIN_API_URL}/testimonials/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  loadTestimonials();
};

// 3. Media Library
async function loadMediaLibraryTab() {
  const container = document.getElementById('tab-media');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  let files = [];
  try {
    const res = await fetch(`${ADMIN_API_URL}/media/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    files = data.files || [];
  } catch (err) {
    console.error(err);
  }

  const buildUsageLines = (file) => {
    const lines = [];
    if (file.usage?.pages?.length) {
      file.usage.pages.forEach((page) => {
        const label = page.title || page.slug || 'Strona';
        const where = page.locations?.length ? ` (${page.locations.join(', ')})` : '';
        lines.push(`Strona: ${label}${where}`);
      });
    }
    if (file.usage?.galleries?.length) {
      file.usage.galleries.forEach((gallery) => {
        const name = gallery.name || 'Bez nazwy';
        const category = CATEGORY_MAP[gallery.category] || gallery.category || 'Galeria';
        lines.push(`Galeria: ${name} (${category})`);
      });
    }
    if (file.usage?.testimonials?.length) {
      file.usage.testimonials.forEach((testimonial) => {
        const author = testimonial.author || 'Bez autora';
        lines.push(`Opinia: ${author}`);
      });
    }
    if (file.usage?.settings?.length) {
      file.usage.settings.forEach((setting) => {
        lines.push(`Ustawienia: ${setting}`);
      });
    }
    return lines;
  };

  const TAG_LABEL_MAP = {
    wedding: 'Ślubne',
    portrait: 'Portretowe',
    product: 'Produktowe',
    utility: 'Użytkowe',
    other: 'Inne',
  };

  const renderUsageSection = (title, items = []) => {
    if (!items.length) return '';
    return `
      <div class="rounded border border-gray-200 p-3 dark:border-white/10">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-500">${title}</p>
        <ul class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          ${items.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  };

  const openMediaDetailsModal = async (file) => {
    if (!file) return;

    const pageItems = (file.usage?.pages || []).map((page) => {
      const where = page.locations?.length ? ` (${page.locations.join(', ')})` : '';
      const label = page.title || page.slug || 'Strona';
      return `${label}${where}`;
    });
    const galleryItems = (file.usage?.galleries || []).map((gallery) => {
      const category = CATEGORY_MAP[gallery.category] || gallery.category || 'Galeria';
      return `${gallery.name || 'Bez nazwy'} (${category})`;
    });
    const testimonialItems = (file.usage?.testimonials || []).map(
      (testimonial) => `Opinia: ${testimonial.author || 'Bez autora'}`,
    );
    const settingsItems = (file.usage?.settings || []).map((setting) => `Ustawienia: ${setting}`);

    const meta = await getMediaPreviewMeta(file.url);
    const html = `
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="space-y-4">
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-white/10">
            <img src="${resolveUploadsUrl(file.url)}" alt="${file.name}" class="h-full w-full object-contain" onerror="console.error('Media details failed', this.src)">
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div class="rounded border border-gray-200 p-3 dark:border-white/10">
              <p class="text-xs uppercase tracking-widest text-gray-500">Tag</p>
              <p class="mt-1 font-medium">${TAG_LABEL_MAP[file.tag] || 'Inne'}</p>
            </div>
            <div class="rounded border border-gray-200 p-3 dark:border-white/10">
              <p class="text-xs uppercase tracking-widest text-gray-500">Użycia</p>
              <p class="mt-1 font-medium">${file.usageCount || 0}</p>
            </div>
            <div class="rounded border border-gray-200 p-3 dark:border-white/10">
              <p class="text-xs uppercase tracking-widest text-gray-500">Wymiary</p>
              <p class="mt-1 font-medium">${meta.dimensions}</p>
            </div>
            <div class="rounded border border-gray-200 p-3 dark:border-white/10">
              <p class="text-xs uppercase tracking-widest text-gray-500">Rozmiar</p>
              <p class="mt-1 font-medium">${meta.size}</p>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="rounded border border-gray-200 p-4 dark:border-white/10">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-500">Plik</p>
            <p class="mt-2 break-all text-sm font-medium text-gray-900 dark:text-white">${file.name}</p>
            <p class="mt-1 text-xs text-gray-500">${file.url}</p>
          </div>
          <div class="rounded border border-gray-200 p-4 dark:border-white/10">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-500">SEO obrazu</p>
            <div class="mt-3 space-y-3">
              <label class="block text-xs uppercase tracking-widest text-gray-500">
                Tytuł
                <input id="media-meta-title" type="text" value="${escapeHtml(file.title_text)}" class="mt-2 w-full rounded border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-gray-100" placeholder="Np. Sesja ślubna - plener" />
              </label>
              <label class="block text-xs uppercase tracking-widest text-gray-500">
                Alt text
                <input id="media-meta-alt" type="text" value="${escapeHtml(file.alt_text)}" class="mt-2 w-full rounded border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-black/40 dark:text-gray-100" placeholder="Np. Para młoda na tle zachodu słońca" />
              </label>
              <p id="media-meta-status" class="text-sm text-gray-500"></p>
            </div>
          </div>
          ${renderUsageSection('Strony', pageItems)}
          ${renderUsageSection('Sesje', galleryItems)}
          ${renderUsageSection('Opinie', testimonialItems)}
          ${renderUsageSection('Globalne ustawienia', settingsItems)}
          ${
            !pageItems.length &&
            !galleryItems.length &&
            !testimonialItems.length &&
            !settingsItems.length
              ? '<p class="rounded border border-gray-200 p-3 text-sm text-gray-500 dark:border-white/10">To medium nie jest obecnie używane.</p>'
              : ''
          }
        </div>
      </div>
    `;

    openModal('Szczegóły medium', html);

    const titleInput = document.getElementById('media-meta-title');
    const altInput = document.getElementById('media-meta-alt');
    const status = document.getElementById('media-meta-status');

    setModalPrimaryAction(async () => {
      if (!titleInput || !altInput) return;
      const titleText = titleInput.value.trim();
      const altText = altInput.value.trim();
      if (dom.modalPrimaryAction) dom.modalPrimaryAction.setAttribute('disabled', 'disabled');
      if (status) status.textContent = 'Zapisywanie...';

      try {
        const response = await fetch(
          `${ADMIN_API_URL}/media/${encodeURIComponent(file.name)}/meta`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title_text: titleText, alt_text: altText }),
          },
        );

        if (!response.ok) throw new Error('Nie udało się zapisać metadanych.');

        file.title_text = titleText || null;
        file.alt_text = altText || null;
        if (status) status.textContent = 'Zapisano.';
      } catch (error) {
        if (status) status.textContent = 'Błąd zapisu.';
      } finally {
        if (dom.modalPrimaryAction) dom.modalPrimaryAction.removeAttribute('disabled');
      }
    }, '<span>Zapisz</span>');
  };

  const renderMediaLibrary = () => {
    const previousScrollTop = container.scrollTop;
    const previousWindowScrollY = window.scrollY;
    const filterText = mediaFilterQuery.trim().toLowerCase();
    const tagFiltered = mediaTagFilter
      ? files.filter((f) => (f.tag || 'other') === mediaTagFilter)
      : files;
    const filteredFiles = filterText
      ? tagFiltered.filter((file) => {
          const usageText = buildUsageLines(file).join(' ').toLowerCase();
          const tagText = String(file.tag || '').toLowerCase();
          return (
            file.name.toLowerCase().includes(filterText) ||
            usageText.includes(filterText) ||
            tagText.includes(filterText)
          );
        })
      : tagFiltered;

    const mediaTagPill = (value, label, activeValue, key) => {
      const active = activeValue === value;
      return `<button type="button" data-${key}="${value}" class="${getTagPillClass(active)}">${label}</button>`;
    };

    const renderGrid = () => {
      return `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${filteredFiles
            .map((file) => {
              const count = file.usageCount || 0;
              const used = count > 0;
              return `
                <div data-media-preview="${file.name}" class="group relative aspect-square cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black">
                  <img src="${resolveUploadsUrl(file.url)}" alt="${file.name}" class="h-full w-full object-cover" onerror="console.error('Media grid failed', this.src)" />
                  <span class="${GRID_BADGE_LEFT_CLASS}">${TAG_LABEL_MAP[file.tag] || 'Inne'}</span>
                  ${used ? `<span class="${GRID_STATUS_BADGE_CLASS}" aria-label="Używane">${SAVE_ICON_HTML}</span>` : ''}
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div class="w-full p-3 text-xs text-white">
                      <p class="truncate">${file.name}</p>
                      <p class="mt-1 text-gold">Użycia: ${count}</p>
                      <select data-media-tag-select-grid="${file.name}" class="mt-1 w-full rounded border border-white/20 bg-black/60 px-1 py-1 text-[10px] uppercase tracking-widest text-white cursor-pointer">
                        <option value="wedding" ${file.tag === 'wedding' ? 'selected' : ''}>Ślubne</option>
                        <option value="portrait" ${file.tag === 'portrait' ? 'selected' : ''}>Portretowe</option>
                        <option value="product" ${file.tag === 'product' ? 'selected' : ''}>Produktowe</option>
                        <option value="utility" ${file.tag === 'utility' ? 'selected' : ''}>Użytkowe</option>
                        <option value="other" ${file.tag === 'other' || !file.tag ? 'selected' : ''}>Inne</option>
                      </select>
                      <div class="mt-2 flex gap-2">
                        <button data-media-preview="${file.name}" class="rounded-full border border-white/30 px-2 py-1 text-[10px] uppercase tracking-widest text-white hover:bg-white/10">Szczegóły</button>
                        <button data-file="${file.name}" class="rounded-full border border-white/30 px-2 py-1 text-[10px] uppercase tracking-widest text-white hover:bg-white/10">Usuń</button>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    };

    const renderList = () => {
      return `
        <div class="space-y-3">
          ${filteredFiles
            .map((file) => {
              const lines = buildUsageLines(file);
              return `
                <div class="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4">
                  <button type="button" data-media-preview="${file.name}" class="h-16 w-16 shrink-0 overflow-hidden rounded border border-gray-200 dark:border-white/10">
                    <img src="${resolveUploadsUrl(file.url)}" alt="${file.name}" class="h-full w-full object-cover" onerror="console.error('Media list failed', this.src)" />
                  </button>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">${file.name}</p>
                      <div class="flex items-center gap-2 text-xs text-gray-500">
                        <select data-media-tag-select="${file.name}" class="rounded border border-gray-200 bg-white/80 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-600 dark:border-white/10 dark:bg-black/40 dark:text-gray-200">
                          <option value="wedding" ${file.tag === 'wedding' ? 'selected' : ''}>Ślubne</option>
                          <option value="portrait" ${file.tag === 'portrait' ? 'selected' : ''}>Portretowe</option>
                          <option value="product" ${file.tag === 'product' ? 'selected' : ''}>Produktowe</option>
                          <option value="utility" ${file.tag === 'utility' ? 'selected' : ''}>Użytkowe</option>
                          <option value="other" ${file.tag === 'other' || !file.tag ? 'selected' : ''}>Inne</option>
                        </select>
                        <span>Użycia: ${file.usageCount || 0}</span>
                        <button data-media-preview="${file.name}" class="rounded-full border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gold dark:border-white/10">Szczegóły</button>
                        <button data-file="${file.name}" class="rounded-full border border-gray-200 dark:border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gold">
                          Usuń
                        </button>
                      </div>
                    </div>
                    <div class="mt-2 space-y-1 text-xs text-gray-500">
                      ${
                        lines.length
                          ? lines.map((line) => `<p>${line}</p>`).join('')
                          : '<p>Nieużywane</p>'
                      }
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    };

    container.innerHTML = `
      <div class="mb-6 space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-4">
              <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white">Biblioteka mediów</h2>
              <input id="media-filter" type="text" placeholder="Szukaj mediów" class="${CONTENT_SEARCH_INPUT_CLASS}" />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label for="media-upload-tag-select" class="text-xs font-bold uppercase tracking-widest text-gray-500">Tag nowych mediów</label>
            <select id="media-upload-tag-select" class="min-w-[9rem] rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-gold focus:outline-none">
              <option value="wedding" ${mediaUploadTag === 'wedding' ? 'selected' : ''}>Ślubne</option>
              <option value="portrait" ${mediaUploadTag === 'portrait' ? 'selected' : ''}>Portretowe</option>
              <option value="product" ${mediaUploadTag === 'product' ? 'selected' : ''}>Produktowe</option>
              <option value="utility" ${mediaUploadTag === 'utility' ? 'selected' : ''}>Użytkowe</option>
              <option value="other" ${mediaUploadTag === 'other' ? 'selected' : ''}>Inne</option>
            </select>
            <button type="button" id="media-upload-trigger" class="${CONTENT_ACTION_BUTTON_CLASS}">${PLUS_ICON_HTML}<span>Dodaj media</span></button>
            <input id="media-upload" type="file" class="hidden" multiple accept="image/*" />
          </div>
        </div>
        <div class="mb-6 flex flex-wrap items-center gap-2">
          ${mediaTagPill('', 'Wszystkie', mediaTagFilter, 'media-filter-pill')}
          ${mediaTagPill('wedding', 'Ślubne', mediaTagFilter, 'media-filter-pill')}
          ${mediaTagPill('portrait', 'Portretowe', mediaTagFilter, 'media-filter-pill')}
          ${mediaTagPill('product', 'Produktowe', mediaTagFilter, 'media-filter-pill')}
          ${mediaTagPill('utility', 'Użytkowe', mediaTagFilter, 'media-filter-pill')}
          ${mediaTagPill('other', 'Inne', mediaTagFilter, 'media-filter-pill')}
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" id="media-view-list" class="${getToggleButtonClass(mediaViewMode === 'list')}">Lista</button>
            <button type="button" id="media-view-grid" class="${getToggleButtonClass(mediaViewMode === 'grid')}">Siatka</button>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
        ${mediaViewMode === 'list' ? renderList() : renderGrid()}
      </div>
    `;

    const gridBtn = document.getElementById('media-view-grid');
    const listBtn = document.getElementById('media-view-list');
    const filterInput = document.getElementById('media-filter');
    const uploadInput = document.getElementById('media-upload');
    const uploadTrigger = document.getElementById('media-upload-trigger');
    const uploadTagSelect = document.getElementById('media-upload-tag-select');
    const deleteButtons = Array.from(container.querySelectorAll('[data-file]'));
    const previewTriggers = Array.from(container.querySelectorAll('[data-media-preview]'));
    const tagSelects = Array.from(container.querySelectorAll('[data-media-tag-select]'));
    const filterTagButtons = Array.from(container.querySelectorAll('[data-media-filter-pill]'));
    if (gridBtn)
      gridBtn.addEventListener('click', () => {
        mediaViewMode = 'grid';
        renderMediaLibrary();
      });
    if (listBtn)
      listBtn.addEventListener('click', () => {
        mediaViewMode = 'list';
        renderMediaLibrary();
      });
    if (filterInput) {
      filterInput.value = mediaFilterQuery;
      filterInput.addEventListener('input', (event) => {
        mediaFilterQuery = event.target.value;
        renderMediaLibrary();
        const nextInput = document.getElementById('media-filter');
        if (nextInput) {
          nextInput.focus();
          const pos = mediaFilterQuery.length;
          nextInput.setSelectionRange(pos, pos);
        }
      });
    }
    if (uploadTrigger && uploadInput) {
      uploadTrigger.addEventListener('click', () => uploadInput.click());
    }
    if (uploadTagSelect) {
      uploadTagSelect.addEventListener('change', (event) => {
        mediaUploadTag = event.target.value || 'other';
      });
    }
    if (uploadInput) {
      uploadInput.addEventListener('change', async (event) => {
        const filesToUpload = event.target.files;
        if (!filesToUpload || !filesToUpload.length) return;
        const selectedTag = mediaUploadTag || 'other';
        for (let file of filesToUpload) {
          await uploadFileWithResolution(file, () => {}, { tag: selectedTag });
        }
        uploadInput.value = '';
        loadMediaLibraryTab();
      });
    }
    filterTagButtons.forEach((button) => {
      button.addEventListener('click', () => {
        mediaTagFilter = button.getAttribute('data-media-filter-pill') || '';
        renderMediaLibrary();
      });
    });
    previewTriggers.forEach((trigger) => {
      trigger.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const fileName = trigger.getAttribute('data-media-preview');
        const file = files.find((item) => item.name === fileName);
        if (file) {
          await openMediaDetailsModal(file);
        }
      });
    });
    tagSelects.forEach((selectEl) => {
      selectEl.addEventListener('change', async (event) => {
        event.stopPropagation();
        const fileName = event.target.getAttribute('data-media-tag-select');
        const tag = event.target.value || 'other';
        if (!fileName) return;
        await fetch(`${ADMIN_API_URL}/media/${encodeURIComponent(fileName)}/tag`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tag }),
        });
        const file = files.find((item) => item.name === fileName);
        if (file) file.tag = tag;
        renderMediaLibrary();
      });
    });
    const tagSelectsGrid = Array.from(container.querySelectorAll('[data-media-tag-select-grid]'));
    tagSelectsGrid.forEach((selectEl) => {
      selectEl.addEventListener('change', async (event) => {
        event.stopPropagation();
        const fileName = event.target.getAttribute('data-media-tag-select-grid');
        const tag = event.target.value || 'other';
        if (!fileName) return;
        await fetch(`${ADMIN_API_URL}/media/${encodeURIComponent(fileName)}/tag`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tag }),
        });
        const file = files.find((item) => item.name === fileName);
        if (file) file.tag = tag;
        renderMediaLibrary();
      });
    });
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        const name = btn.dataset.file;
        const target = files.find((file) => file.name === name);
        const usageLines = target ? buildUsageLines(target) : [];
        const usageText = usageLines.length
          ? `To medium jest użyte w:\n- ${usageLines.join('\n- ')}\n\nCzy na pewno usunąć?`
          : 'Czy na pewno usunąć to medium?';
        if (!confirm(usageText)) return;
        await fetch(`${ADMIN_API_URL}/files/${encodeURIComponent(name)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        loadMediaLibraryTab();
      });
    });

    container.scrollTop = previousScrollTop;
    if (Math.abs(window.scrollY - previousWindowScrollY) > 2) {
      window.scrollTo({ top: previousWindowScrollY, behavior: 'auto' });
    }
  };

  renderMediaLibrary();
}

// 4. Settings
async function loadSettings() {
  const container = document.getElementById('tab-settings');
  container.innerHTML =
    '<div class="loader mx-auto w-10 h-10 rounded-full border-2 border-t-gold"></div>';

  const [settingsRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/settings`),
    currentUser?.role === 'ADMIN'
      ? fetch(`${ADMIN_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : Promise.resolve(null),
  ]);
  const s = await settingsRes.json();
  const users = usersRes && usersRes.ok ? await usersRes.json() : [];

  const renderSettingsImagePicker = ({ inputId, label, value, sizeClass = 'h-40' }) => {
    const hasValue = Boolean(value);
    return `
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-gray-500">${label}</label>
        <div>
          <div id="${inputId}_empty" class="${hasValue ? 'hidden' : ''} w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-white/10 p-6 text-gray-400 transition-colors hover:border-gold hover:text-gold">
            <div class="flex flex-col items-center justify-center gap-3 text-center">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p class="text-sm">Wybierz z biblioteki lub dodaj z komputera</p>
              <div class="flex flex-wrap justify-center gap-2">
                <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('${inputId}', url))">Wybierz z biblioteki</button>
                <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="document.getElementById('${inputId}_upload').click()">Dodaj z komputera</button>
              </div>
            </div>
          </div>

          <div id="${inputId}_filled" class="${hasValue ? '' : 'hidden'}">
            <img id="${inputId}_preview" src="${resolveUploadsUrl(value || '')}" class="w-full ${sizeClass} rounded-lg border border-gray-200 dark:border-white/10 object-cover" />
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="rounded bg-gray-200 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" onclick="openMediaPicker().then(url => updateImagePicker('${inputId}', url))">Zmień</button>
              <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="updateImagePicker('${inputId}', '')">Usuń</button>
              <button type="button" class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" onclick="document.getElementById('${inputId}_upload').click()">Z komputera</button>
            </div>
          </div>

          <input type="text" id="${inputId}" value="${value || ''}" class="hidden" />
          <input type="file" id="${inputId}_upload" class="hidden" accept="image/*" />
        </div>
      </div>
    `;
  };

  const usersSection =
    currentUser?.role === 'ADMIN'
      ? `
                  <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                    <h4 class="text-gold font-display font-medium">Zarządzanie użytkownikami</h4>
                    <div id="user-create-panel" class="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 dark:border-white/10 md:items-end md:grid-cols-[minmax(14rem,18rem)_10rem_auto]">
                      <label class="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Email nowego użytkownika
                        <input type="email" id="new-user-email" class="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white" placeholder="email@domena.pl">
                      </label>
                      <label class="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                        Rola
                        <select id="new-user-role" class="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-gold dark:border-white/10 dark:bg-black/20 dark:text-white">
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </label>
                      <div class="flex items-end md:justify-end">
                        <button type="button" id="create-user-btn" class="${CONTENT_ACTION_BUTTON_CLASS} w-full justify-center whitespace-nowrap md:w-auto md:min-w-[13rem]">${PLUS_ICON_HTML}<span class="whitespace-nowrap">Dodaj użytkownika</span></button>
                      </div>
                    </div>
                    <div class="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                      <table class="w-full text-left text-sm">
                        <thead class="bg-gray-50 dark:bg-white/5 text-xs uppercase tracking-widest text-gray-500">
                          <tr>
                            <th class="px-4 py-3">E-mail</th>
                            <th class="px-4 py-3">Rola</th>
                            <th class="px-4 py-3 text-right">Akcja</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-white/10 text-gray-700 dark:text-gray-200">
                          ${users
                            .map(
                              (user) => `
                                <tr>
                                  <td class="px-4 py-3 font-medium">${escapeHtml(user.email || '')}</td>
                                  <td class="px-4 py-3">${escapeHtml(user.role || 'MANAGER')}</td>
                                  <td class="px-4 py-3 text-right">
                                    <div class="flex justify-end gap-2">
                                      <button type="button" data-user-reset="${user.id}" class="rounded border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-gold hover:text-gold dark:text-gray-300">Wyślij reset hasła</button>
                                      <button type="button" data-user-delete="${user.id}" data-user-email="${escapeHtml(user.email || '')}" class="rounded border border-red-500/30 px-3 py-1.5 text-xs text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white">Usuń</button>
                                    </div>
                                  </td>
                                </tr>
                              `,
                            )
                            .join('')}
                        </tbody>
                      </table>
                    </div>
                    <p id="users-reset-status" class="hidden rounded border border-gray-200 px-3 py-2 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300"></p>
                  </div>
                `
      : '';

  container.innerHTML = `
        <h2 class="text-3xl font-display font-medium text-gray-900 dark:text-white mb-6">Ustawienia Globalne</h2>
        <!-- REMOVED max-w-2xl -->
        <div class="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-white/5 rounded-xl p-8 shadow-sm">
             <form id="settings-form" class="space-y-6 pb-28">
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
                     <h4 class="text-gold font-display font-medium">Logotypy globalne</h4>
                     <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                       ${renderSettingsImagePicker({ inputId: 's_logo_path', label: 'Logo główne', value: s.logo_path || '', sizeClass: 'h-44' })}
                       ${renderSettingsImagePicker({ inputId: 's_logo_secondary_path', label: 'Logo dodatkowe', value: s.logo_secondary_path || '', sizeClass: 'h-44' })}
                     </div>
                 </div>

                 <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
                   <h4 class="text-gold font-display font-medium">Mega menu</h4>
                   ${renderSettingsImagePicker({ inputId: 's_mega_menu_image', label: 'Zdjęcie po lewej stronie', value: s.mega_menu_image || '', sizeClass: 'h-48' })}
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
                  ${renderSettingsImagePicker({ inputId: 's_og_image', label: 'OG Image', value: s.og_image || '', sizeClass: 'h-44' })}
                  ${renderSettingsImagePicker({ inputId: 's_favicon', label: 'Favicon', value: s.favicon || '', sizeClass: 'h-32' })}
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

                  ${usersSection}

             </form>
        </div>
                 <div class="pointer-events-none fixed bottom-4 left-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:left-auto sm:right-6">
                <p id="settings-save-status" class="pointer-events-auto hidden max-w-sm rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-sm text-gray-700 shadow-lg shadow-black/10 backdrop-blur dark:bg-dark-secondary/95 dark:text-gray-200"></p>
                <button type="submit" form="settings-form" id="settings-save-btn" class="pointer-events-auto inline-flex min-h-[3.5rem] items-center justify-center gap-2 self-stretch rounded-full bg-gold px-6 py-3 text-base font-bold text-black transition-all hover:bg-gold-hover hover:shadow-2xl hover:shadow-gold/20 sm:min-w-[14rem] sm:self-auto">${SAVE_LABEL_HTML}</button>
                 </div>
    `;

  initMetaCounters();

  const bindSettingsImageUpload = (inputId) => {
    const uploadInput = document.getElementById(`${inputId}_upload`);
    if (!uploadInput) return;
    uploadInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        updateUploadToast({
          title: 'Przesyłanie',
          message: `Wysyłanie: ${file.name}`,
          percent: 0,
          visible: true,
        });
        const result = await uploadFileWithResolution(file, (ratio) => {
          updateUploadToast({
            message: `Wysyłanie: ${file.name}`,
            percent: Math.round(ratio * 100),
          });
        });
        updateUploadToast({ title: 'Gotowe', message: 'Plik przesłany.', percent: 100 });
        setTimeout(() => updateUploadToast({ visible: false }), 1500);
        if (result?.url) window.updateImagePicker(inputId, result.url);
      } catch (err) {
        updateUploadToast({ title: 'Błąd', message: 'Nie udało się przesłać pliku.', percent: 0 });
        setTimeout(() => updateUploadToast({ visible: false }), 2500);
      }
      event.target.value = '';
    });
  };

  ['s_logo_path', 's_logo_secondary_path', 's_mega_menu_image', 's_og_image', 's_favicon'].forEach(
    bindSettingsImageUpload,
  );

  const usersResetStatus = document.getElementById('users-reset-status');
  const setUsersStatus = (message, isError = false) => {
    if (!usersResetStatus) return;
    usersResetStatus.textContent = message;
    usersResetStatus.classList.remove('hidden', 'text-red-500', 'border-red-500/40');
    if (isError) {
      usersResetStatus.classList.add('text-red-500', 'border-red-500/40');
    }
  };

  const createUserButton = document.getElementById('create-user-btn');
  if (createUserButton) {
    createUserButton.addEventListener('click', async () => {
      const emailInput = document.getElementById('new-user-email');
      const roleInput = document.getElementById('new-user-role');
      const submitButton = createUserButton;
      const email = emailInput?.value?.trim();
      const role = roleInput?.value || 'MANAGER';
      if (!email) return;

      submitButton?.setAttribute('disabled', 'disabled');
      try {
        const res = await fetch(`${ADMIN_API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email, role }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Nie udało się dodać użytkownika.');
        }
        setUsersStatus('Użytkownik został dodany i otrzymał e-mail do ustawienia hasła.');
        loadSettings();
      } catch (error) {
        setUsersStatus(error.message || 'Wystąpił błąd podczas dodawania użytkownika.', true);
      } finally {
        submitButton?.removeAttribute('disabled');
      }
    });
  }

  document.querySelectorAll('[data-user-reset]').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = button.getAttribute('data-user-reset');
      if (!userId) return;
      button.setAttribute('disabled', 'disabled');
      try {
        const res = await fetch(`${ADMIN_API_URL}/users/${userId}/send-reset`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Nie udało się wysłać resetu hasła.');
        }
        setUsersStatus('Wiadomość resetująca hasło została wysłana.');
      } catch (error) {
        setUsersStatus(error.message || 'Wystąpił błąd podczas wysyłki.', true);
      } finally {
        button.removeAttribute('disabled');
      }
    });
  });

  document.querySelectorAll('[data-user-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = button.getAttribute('data-user-delete');
      const userEmail = button.getAttribute('data-user-email') || 'tego użytkownika';
      if (!userId) return;
      if (!confirm(`Czy na pewno usunąć użytkownika ${userEmail}?`)) return;
      button.setAttribute('disabled', 'disabled');
      try {
        const res = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Nie udało się usunąć użytkownika.');
        }
        setUsersStatus('Użytkownik został usunięty.');
        loadSettings();
      } catch (error) {
        setUsersStatus(error.message || 'Wystąpił błąd podczas usuwania użytkownika.', true);
      } finally {
        button.removeAttribute('disabled');
      }
    });
  });

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveButton = document.getElementById('settings-save-btn');
    const saveStatus = document.getElementById('settings-save-status');
    const setSaveStatus = (message, isError = false) => {
      if (!saveStatus) return;
      saveStatus.textContent = message;
      saveStatus.classList.remove(
        'hidden',
        'text-red-500',
        'border-red-500/40',
        'text-emerald-500',
        'border-emerald-500/40',
      );
      if (isError) {
        saveStatus.classList.add('text-red-500', 'border-red-500/40');
      } else {
        saveStatus.classList.add('text-emerald-500', 'border-emerald-500/40');
      }
    };
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
      logo_path: document.getElementById('s_logo_path').value,
      logo_secondary_path: document.getElementById('s_logo_secondary_path').value,
      mega_menu_image: document.getElementById('s_mega_menu_image').value,
      umami_script_url: document.getElementById('s_umami_script_url').value,
      umami_website_id: document.getElementById('s_umami_website_id').value,
      umami_domains: document.getElementById('s_umami_domains').value,
      umami_dashboard_url: document.getElementById('s_umami_dashboard_url').value,
    };

    saveButton?.setAttribute('disabled', 'disabled');
    setSaveStatus('Zapisywanie ustawień...');

    try {
      const response = await fetch(`${ADMIN_API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Nie udało się zapisać ustawień.');
      }

      await response.json().catch(() => null);
      await syncAdminFavicon();
      setSaveStatus('Ustawienia zostały zapisane.');
    } catch (error) {
      setSaveStatus(error.message || 'Wystąpił błąd podczas zapisu.', true);
    } finally {
      saveButton?.removeAttribute('disabled');
    }
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
        <p class="text-gray-500 dark:text-gray-400">Brak Website ID. Uzupełnij dane w zakładce Ustawienia.</p>
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
          }">Szczegółowa analityka</a>
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
          <h3 class="text-sm uppercase tracking-widest text-gray-400">Zaangażowanie</h3>
          <div class="mt-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div class="flex items-center justify-between">
              <span>Odbicia</span>
              <span class="text-gray-500">${formatNumber(stats.bounces)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Średni czas</span>
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
          ${buildList(referrers, 'Brak danych o źródłach.')}
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400 mb-4">Kraje (${days} dni)</h3>
          ${buildList(countries, 'Brak danych o krajach.')}
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-black/20 p-6">
          <h3 class="text-sm uppercase tracking-widest text-gray-400 mb-4">Środowisko</h3>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-xs uppercase tracking-widest text-gray-400 mb-3">Urządzenia</p>
              ${buildList(devices, 'Brak danych')}
            </div>
            <div>
              <p class="text-xs uppercase tracking-widest text-gray-400 mb-3">Przeglądarki</p>
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
window.updateImagePicker = (inputId, url) => {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(`${inputId}_preview`);
  const emptyState = document.getElementById(`${inputId}_empty`);
  const filledState = document.getElementById(`${inputId}_filled`);
  const hasValue = Boolean(url);

  if (input) input.value = url || '';
  if (preview && url) preview.src = resolveUploadsUrl(url);
  if (preview && !url) preview.removeAttribute('src');
  if (emptyState) emptyState.classList.toggle('hidden', hasValue);
  if (filledState) filledState.classList.toggle('hidden', !hasValue);
};

function initMetaCounters() {
  const counters = [
    {
      input: 'meta_title',
      counter: 'meta_title_count',
      hint: 'meta_title_hint',
      min: 50,
      max: 60,
    },
    {
      input: 'meta_description',
      counter: 'meta_description_count',
      hint: 'meta_description_hint',
      min: 140,
      max: 160,
    },
    {
      input: 's_meta_title',
      counter: 's_meta_title_count',
      min: 50,
      max: 60,
    },
    {
      input: 's_meta_description',
      counter: 's_meta_description_count',
      min: 140,
      max: 160,
    },
  ];

  counters.forEach(({ input, counter, hint, min, max }) => {
    const inputEl = document.getElementById(input);
    const counterEl = document.getElementById(counter);
    const hintEl = hint ? document.getElementById(hint) : null;
    if (!inputEl || !counterEl) return;

    const applyState = (length) => {
      if (!hintEl) return;

      hintEl.classList.remove(
        'border-emerald-400/60',
        'bg-emerald-500/10',
        'text-emerald-600',
        'dark:text-emerald-300',
        'border-amber-400/60',
        'bg-amber-500/10',
        'text-amber-700',
        'dark:text-amber-300',
        'border-rose-400/60',
        'bg-rose-500/10',
        'text-rose-700',
        'dark:text-rose-300',
      );

      if (length < min) {
        hintEl.classList.add(
          'border-amber-400/60',
          'bg-amber-500/10',
          'text-amber-700',
          'dark:text-amber-300',
        );
        return;
      }

      if (length > max) {
        hintEl.classList.add(
          'border-rose-400/60',
          'bg-rose-500/10',
          'text-rose-700',
          'dark:text-rose-300',
        );
        return;
      }

      hintEl.classList.add(
        'border-emerald-400/60',
        'bg-emerald-500/10',
        'text-emerald-600',
        'dark:text-emerald-300',
      );
    };

    const update = () => {
      const valueLength = inputEl.value.length;
      counterEl.textContent = valueLength.toString();
      applyState(valueLength);
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
  const seoPickFilled = document.getElementById('seo_image_pick_filled');
  const seoClear = document.getElementById('seo_image_clear');
  const seoUploadBtn = document.getElementById('seo_image_upload_btn');
  const seoUploadInput = document.getElementById('seo_image_upload');

  if (!useHero || !seoInput) return;

  const heroValue = heroInput ? heroInput.value : '';
  if (useHero.checked) {
    if (!seoInput.dataset.customValue) {
      seoInput.dataset.customValue = seoInput.value;
    }
    window.updateImagePicker('seo_image', heroValue || '');
    seoInput.disabled = true;
    if (seoPick) seoPick.disabled = true;
    if (seoPickFilled) seoPickFilled.disabled = true;
    if (seoClear) seoClear.disabled = true;
    if (seoUploadBtn) seoUploadBtn.disabled = true;
    if (seoUploadInput) seoUploadInput.disabled = true;
  } else {
    const custom = seoInput.dataset.customValue || '';
    window.updateImagePicker('seo_image', custom);
    seoInput.disabled = false;
    if (seoPick) seoPick.disabled = false;
    if (seoPickFilled) seoPickFilled.disabled = false;
    if (seoClear) seoClear.disabled = false;
    if (seoUploadBtn) seoUploadBtn.disabled = false;
    if (seoUploadInput) seoUploadInput.disabled = false;
  }
}

function resolveUmamiDashboardUrl(settings) {
  if (!settings) return '';
  if (settings.umami_dashboard_url) return settings.umami_dashboard_url;
  if (!settings.umami_script_url) return '';
  return settings.umami_script_url.replace(/\/script\.js$/i, '');
}

function setModalPrimaryAction(onClick, labelHtml = SAVE_LABEL_HTML) {
  if (!dom.modalPrimaryAction) return;
  dom.modalPrimaryAction.innerHTML = labelHtml;
  dom.modalPrimaryAction.classList.remove('hidden');
  dom.modalPrimaryAction.classList.add('inline-flex', 'items-center', 'gap-2');
  dom.modalPrimaryAction.onclick = onClick;
}

function setModalHeaderAccessory(content) {
  if (!dom.modalHeaderAccessory) return;
  dom.modalHeaderAccessory.innerHTML = content || '';
  dom.modalHeaderAccessory.classList.add('flex', 'items-center');
  dom.modalHeaderAccessory.classList.toggle('hidden', !content);
}

function openModal(title, content) {
  dom.modalTitle.textContent = title;
  dom.modalContent.innerHTML = content;
  setModalHeaderAccessory('');
  if (dom.modalPrimaryAction) {
    dom.modalPrimaryAction.innerHTML = SAVE_LABEL_HTML;
    dom.modalPrimaryAction.classList.add('hidden');
    dom.modalPrimaryAction.onclick = null;
  }
  dom.modal.classList.remove('hidden');
  dom.modal.classList.add('flex');
  if (dom.modalContent) {
    dom.modalContent.scrollTop = 0;
  }
}

function closeModal() {
  dom.modal.classList.add('hidden');
  dom.modal.classList.remove('flex');
  setModalHeaderAccessory('');
  if (dom.modalPrimaryAction) {
    dom.modalPrimaryAction.innerHTML = SAVE_LABEL_HTML;
    dom.modalPrimaryAction.classList.add('hidden');
    dom.modalPrimaryAction.onclick = null;
  }
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
    promotion: false,
    branding: false,
    menubar: false,
    plugins: 'link lists',
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link | removeformat',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
  });
}
