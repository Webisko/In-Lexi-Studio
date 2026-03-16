const express = require('express');
const router = express.Router();
const prisma = require('./db');
const { authenticateToken, login } = require('./auth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// --- Uploads Config ---
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MAX_DIMENSION = 2560;
const VARIANT_SIZES = [1920, 1440, 960, 480, 160];
const SEO_SIZE = { width: 1200, height: 630 };
const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 60);
const RESET_BASE_URL = process.env.RESET_BASE_URL || 'https://admin.inlexistudio.com';
const UMAMI_API_URL = process.env.UMAMI_API_URL || 'https://api.umami.is/v1';
const UMAMI_API_KEY = process.env.UMAMI_API_KEY;
const MEDIA_TAG_VALUES = ['wedding', 'portrait', 'product', 'utility', 'other'];

let resetMailer;
const resolveResetMailer = () => {
  if (resetMailer !== undefined) return resetMailer;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    resetMailer = null;
    return resetMailer;
  }

  resetMailer = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return resetMailer;
};

const sendResetEmail = async (email, resetLink) => {
  const mailer = resolveResetMailer();
  if (!mailer) {
    console.log(`[Password reset] ${email} -> ${resetLink}`);
    return;
  }

  const from = process.env.SMTP_FROM || 'In Lexi Studio <no-reply@inlexistudio.com>';
  await mailer.sendMail({
    from,
    to: email,
    subject: 'Reset hasla do CMS',
    text: `Aby ustawic nowe haslo, otworz link: ${resetLink}`,
    html: `
      <p>Aby ustawic nowe haslo, otworz link:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Link wygasa po ${RESET_TOKEN_TTL_MINUTES} minutach.</p>
    `,
  });
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeFieldValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join(', ');
  }
  return String(value || '').trim();
};

const CONTACT_FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  message: 'Message',
  'your-name': 'Your name',
  'partner-name': "Partner's name",
  'contact-email': 'Email address',
  'contact-phone': 'Phone number',
  location: 'Location',
  date: 'Wedding date',
  venue: 'Ceremony venue',
  'ceremony-type': 'Ceremony type',
  guests: 'Expected guest count',
  vision: 'Wedding vision',
  story: 'Love story',
  attraction: 'What attracted you to my work',
  'found-me': 'How did you find me',
  extras: 'Requested extras',
  questions: 'Additional questions/notes',
  'gdpr-consent': 'GDPR consent',
};

const CONTACT_RECIPIENT_EMAIL = String(
  process.env.CONTACT_RECIPIENT_EMAIL || 'info@inlexistudio.com',
).trim();

const toTitleCase = (value) =>
  String(value || '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const getFormSubject = (formType) => {
  if (formType === 'wedding') return 'New Wedding Enquiry — In Lexi Studio';
  if (formType === 'contact') return 'New Contact Form Message — In Lexi Studio';
  if (formType === 'portrait') return 'New Portrait Enquiry — In Lexi Studio';
  if (formType === 'product') return 'New Product Enquiry — In Lexi Studio';

  const label = toTitleCase(formType) || 'Website';
  return `New ${label} Form Message — In Lexi Studio`;
};

const getAutoReplySubject = (formType) => {
  if (formType === 'wedding') return 'Thank you for your wedding enquiry — In Lexi Studio';
  if (formType === 'portrait') return 'Thank you for your portrait enquiry — In Lexi Studio';
  if (formType === 'product') return 'Thank you for your product enquiry — In Lexi Studio';
  return 'Thank you for your message — In Lexi Studio';
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const resolveSubmitterName = (payload) =>
  normalizeFieldValue(payload?.name) || normalizeFieldValue(payload?.['your-name']) || 'there';

const buildAutoReplyTextEmail = ({ formType, submitterName }) => {
  const formLabel = toTitleCase(formType) || 'Contact';
  return [
    `Hi ${submitterName},`,
    '',
    'Thank you for getting in touch with In Lexi Studio.',
    `We have safely received your ${formLabel.toLowerCase()} form submission.`,
    'A photographer from our team will review your message and reply shortly.',
    '',
    'Warm regards,',
    'In Lexi Studio',
  ].join('\n');
};

const buildAutoReplyHtmlEmail = ({ formType, submitterName }) => {
  const formLabel = toTitleCase(formType) || 'Contact';
  return `
    <div style="margin:0; padding:24px; background:#080808; color:#fcfcfc; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:640px; margin:0 auto; border:1px solid rgba(212,175,55,0.35); background:#101010;">
        <div style="padding:28px 28px 20px; text-align:center; border-bottom:1px solid rgba(212,175,55,0.25);">
          <p style="margin:0; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#d4af37;">In Lexi Studio</p>
          <h1 style="margin:14px 0 0; font-size:28px; line-height:1.25; color:#fcfcfc; font-weight:600;">Thank you for your message</h1>
        </div>
        <div style="padding:24px 28px; font-size:16px; line-height:1.7; color:#f3f3f3;">
          <p style="margin:0 0 14px;">Hi ${escapeHtml(submitterName)},</p>
          <p style="margin:0 0 14px;">Thank you for getting in touch with In Lexi Studio. We have safely received your <strong>${escapeHtml(formLabel.toLowerCase())}</strong> form submission.</p>
          <p style="margin:0 0 14px;">A photographer from our team will review your message and respond shortly.</p>
          <p style="margin:0; color:#d4af37;">Warm regards,<br />In Lexi Studio</p>
        </div>
      </div>
    </div>
  `;
};

const buildSubmissionTextEmail = ({ formType, submittedAt, rows }) => {
  const lines = rows.map((row) => row.textLine).join('\n');
  return [
    'You have received a new website form submission.',
    '',
    `Form type: ${toTitleCase(formType) || 'Unknown'}`,
    `Submitted at (UTC): ${submittedAt}`,
    '',
    'Submitted details:',
    lines,
  ].join('\n');
};

const buildSubmissionHtmlEmail = ({ formType, submittedAt, rows }) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2 style="margin: 0 0 12px; color: #111827;">New website form submission</h2>
      <p style="margin: 0 0 6px;"><strong>Form type:</strong> ${escapeHtml(toTitleCase(formType) || 'Unknown')}</p>
      <p style="margin: 0 0 16px;"><strong>Submitted at (UTC):</strong> ${escapeHtml(submittedAt)}</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 16px;" />
      ${rows.map((row) => row.htmlLine).join('')}
    </div>
  `;
};

const buildSubmissionRows = (payload) => {
  const ignoredFields = new Set(['formType']);
  return Object.entries(payload || {})
    .filter(([key, value]) => !ignoredFields.has(key) && normalizeFieldValue(value))
    .map(([key, value]) => {
      const label = CONTACT_FIELD_LABELS[key] || key;
      const normalizedValue = normalizeFieldValue(value);
      return {
        label,
        textLine: `${label}: ${normalizedValue}`,
        htmlLine: `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(normalizedValue)}</p>`,
      };
    });
};

const validatePassword = (password) => {
  if (!password || password.length < 10) return 'Haslo musi miec co najmniej 10 znakow.';
  if (!/[A-Z]/.test(password)) return 'Haslo musi zawierac wielka litere.';
  if (!/[a-z]/.test(password)) return 'Haslo musi zawierac mala litere.';
  if (!/[0-9]/.test(password)) return 'Haslo musi zawierac cyfre.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Haslo musi zawierac znak specjalny.';
  return null;
};

const requireAdmin = (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
};

const normalizeUserRole = (value) => {
  const role = String(value || 'MANAGER')
    .trim()
    .toUpperCase();
  return role === 'ADMIN' ? 'ADMIN' : 'MANAGER';
};

const generateTemporaryPassword = () => crypto.randomBytes(24).toString('base64url');

const issuePasswordResetForUser = async (user) => {
  if (!user) return;

  await prisma.passwordResetToken.deleteMany({ where: { user_id: user.id } });

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  const resetLink = `${RESET_BASE_URL}/?reset=${token}`;

  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  await sendResetEmail(user.email, resetLink);
};

const buildUmamiUrl = (endpoint, params = {}) => {
  const url = new URL(`${UMAMI_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const umamiRequest = async (endpoint, params) => {
  if (!UMAMI_API_KEY) {
    throw new Error('Umami API key not configured');
  }

  const res = await fetch(buildUmamiUrl(endpoint, params), {
    headers: {
      Accept: 'application/json',
      'x-umami-api-key': UMAMI_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Umami API error ${res.status}`);
  }

  return res.json();
};

const upload = multer({ storage: multer.memoryStorage() });

const normalizeMediaTag = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return MEDIA_TAG_VALUES.includes(normalized) ? normalized : 'other';
};

const normalizeGalleryPayload = (payload = {}) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'published')) {
    payload.published = Boolean(payload.published);
  }
};

const upsertMediaAssetTag = async (fileUrl, tag) => {
  if (!fileUrl) return;
  const normalizedTag = normalizeMediaTag(tag);
  await prisma.mediaAsset.upsert({
    where: { file_url: fileUrl },
    update: { tag: normalizedTag },
    create: { file_url: fileUrl, tag: normalizedTag },
  });
};

const ensureMediaAssetRecord = async (fileUrl, tag = null) => {
  if (!fileUrl) return;
  const existing = await prisma.mediaAsset.findUnique({ where: { file_url: fileUrl } });
  if (existing) {
    if (tag) {
      await prisma.mediaAsset.update({
        where: { file_url: fileUrl },
        data: { tag: normalizeMediaTag(tag) },
      });
    }
    return;
  }
  await prisma.mediaAsset.create({
    data: {
      file_url: fileUrl,
      tag: normalizeMediaTag(tag || 'other'),
    },
  });
};

const autoTagImagesFromPage = async (data) => {
  const tagMap = [
    { field: 'wedding_slider_images', tag: 'wedding' },
    { field: 'home_gallery_wedding_images', tag: 'wedding' },
    { field: 'home_gallery_portrait_images', tag: 'portrait' },
    { field: 'home_gallery_product_images', tag: 'product' },
    { field: 'portfolio_gallery_ids', tag: 'product' },
  ];
  for (const { field, tag } of tagMap) {
    let urls = [];
    try {
      urls = JSON.parse(data[field] || '[]');
    } catch {}
    if (!Array.isArray(urls)) continue;
    for (const url of urls) {
      if (typeof url === 'string' && url) {
        try {
          await ensureMediaAssetRecord(url, tag);
        } catch {}
      }
    }
  }
};

const isVariantFile = (name) => /-w\d+\.webp$/i.test(name) || /-seo-1200x630\.webp$/i.test(name);
const SVG_MIME_TYPE = 'image/svg+xml';

const sanitizeBaseName = (name) => {
  const parsed = path.parse(name || '').name.toLowerCase();
  const safe = parsed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || `upload-${Date.now()}`;
};

const getUploadFormatFromName = (name) => {
  const ext = path.extname(String(name || '')).toLowerCase();
  return ext === '.svg' ? 'svg' : 'webp';
};

const getUploadFilename = (baseName, format = 'webp') =>
  `${baseName}.${format === 'svg' ? 'svg' : 'webp'}`;

const resolveExistingUpload = (baseName) => {
  if (!baseName) return { exists: false, filename: null, url: null, format: null };
  const candidates = [getUploadFilename(baseName, 'svg'), getUploadFilename(baseName, 'webp')];

  for (const filename of candidates) {
    const fullPath = path.join(uploadDir, filename);
    if (fs.existsSync(fullPath)) {
      const format = filename.toLowerCase().endsWith('.svg') ? 'svg' : 'webp';
      return {
        exists: true,
        filename,
        url: `/uploads/${filename}`,
        format,
      };
    }
  }

  return { exists: false, filename: null, url: null, format: null };
};

const isSvgUpload = (file) => {
  if (!file) return false;
  return (
    file.mimetype === SVG_MIME_TYPE ||
    (file.originalname && file.originalname.toLowerCase().endsWith('.svg'))
  );
};

const buildBaseName = (originalName) => {
  const base = sanitizeBaseName(originalName);
  let candidate = base;
  let counter = 1;
  while (resolveExistingUpload(candidate).exists) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
};

const buildFilePaths = (baseName) => {
  const mainName = `${baseName}.webp`;
  const variants = VARIANT_SIZES.map((size) => `${baseName}-w${size}.webp`);
  return {
    mainName,
    variants,
    mainPath: path.join(uploadDir, mainName),
    variantPaths: variants.map((name) => path.join(uploadDir, name)),
  };
};

const deleteExistingVariants = (baseName) => {
  if (!baseName) return;
  const filesToDelete = fs
    .readdirSync(uploadDir)
    .filter(
      (file) =>
        file === `${baseName}.svg` ||
        file === `${baseName}.webp` ||
        file.startsWith(`${baseName}-w`) ||
        file.startsWith(`${baseName}-seo-1200x630`),
    )
    .map((file) => path.join(uploadDir, file));

  filesToDelete.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

const writeWebpVariants = async (buffer, baseName, isWebpSource = false) => {
  const { mainName, variants, mainPath, variantPaths } = buildFilePaths(baseName);
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const maxSide = Math.max(metadata.width || 0, metadata.height || 0);

  if (isWebpSource) {
    fs.writeFileSync(mainPath, buffer);
  } else {
    await image
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(mainPath);
  }

  const createdVariants = [];
  for (let i = 0; i < VARIANT_SIZES.length; i += 1) {
    const size = VARIANT_SIZES[i];
    if (maxSide && maxSide < size) continue;
    await sharp(buffer)
      .rotate()
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(variantPaths[i]);
    createdVariants.push({ size, url: `/uploads/${variants[i]}` });
  }

  return {
    url: `/uploads/${mainName}`,
    filename: mainName,
    variants: createdVariants,
  };
};

const writeSvgOriginal = (buffer, baseName) => {
  const filename = getUploadFilename(baseName, 'svg');
  const fullPath = path.join(uploadDir, filename);
  fs.writeFileSync(fullPath, buffer);
  return {
    url: `/uploads/${filename}`,
    filename,
    variants: [],
  };
};

const getPathFromUrl = (url) => {
  if (!url) return null;
  const filename = path.basename(url);
  return path.join(uploadDir, filename);
};

const ensureSeoImage = async (sourceUrl) => {
  if (!sourceUrl) return null;
  if (/-seo-1200x630\.webp$/i.test(sourceUrl)) return sourceUrl;

  const sourcePath = getPathFromUrl(sourceUrl);
  if (!sourcePath || !fs.existsSync(sourcePath)) return sourceUrl;

  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const seoName = `${baseName}-seo-1200x630.webp`;
  const seoPath = path.join(uploadDir, seoName);

  if (!fs.existsSync(seoPath)) {
    await sharp(sourcePath)
      .rotate()
      .resize(SEO_SIZE.width, SEO_SIZE.height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toFile(seoPath);
  }

  return `/uploads/${seoName}`;
};

// --- Public Routes ---

// Get all pages (slugs) - Required for Static Site Generation
router.get('/pages', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const pages = await prisma.page.findMany({
      orderBy: [{ sort_order: 'asc' }, { updated_at: 'desc' }],
    });
    res.json(pages.map((page) => normalizePageResponse(page, settings)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get home page
router.get('/pages/home', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    let page = await prisma.page.findFirst({ where: { is_home: true } });
    if (!page) page = await prisma.page.findFirst({ where: { slug: '/' } });
    if (!page) page = await prisma.page.findFirst({ where: { slug: 'home' } });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(normalizePageResponse(page, settings));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all pages or by slug
router.get('/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(normalizePageResponse(page, settings));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/galleries', async (req, res) => {
  try {
    const galleries = await prisma.gallery.findMany({
      where: { published: true },
      include: {
        items: { orderBy: { sort_order: 'asc' } },
        testimonial: true, // Include linked testimonial
      },
    });
    res.json(galleries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/gallery/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const galleries = await prisma.gallery.findMany({
      where: { category, published: true },
      include: { items: { orderBy: { sort_order: 'asc' } } },
    });
    res.json(galleries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { approved: true },
      include: { gallery: true }, // Include linked gallery
    });
    res.json(testimonials);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/media', async (req, res) => {
  try {
    const mediaAssets = await prisma.mediaAsset.findMany();
    const mediaAssetByUrl = new Map(mediaAssets.map((item) => [item.file_url, item]));
    const files = fs
      .readdirSync(uploadDir)
      .filter((f) => !isVariantFile(f))
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const url = `/uploads/${f}`;
        const asset = mediaAssetByUrl.get(url);
        return {
          name: f,
          url,
          tag: normalizeMediaTag(asset?.tag),
          title_text: asset?.title_text || null,
          alt_text: asset?.alt_text || null,
        };
      });

    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    res.json(settings || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/contact', upload.none(), async (req, res) => {
  try {
    const payload = req.body || {};
    const formType = String(payload.formType || 'contact').toLowerCase();

    const recipientEmail = CONTACT_RECIPIENT_EMAIL;

    if (!recipientEmail) {
      return res.status(500).json({ error: 'Recipient email is not configured on the server.' });
    }

    const rows = buildSubmissionRows(payload);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No form fields provided.' });
    }

    const mailer = resolveResetMailer();
    if (!mailer) {
      return res.status(500).json({ error: 'SMTP is not configured on the server.' });
    }

    const replyTo =
      normalizeFieldValue(payload.email) ||
      normalizeFieldValue(payload['contact-email']) ||
      undefined;
    const submitterEmail = replyTo && isValidEmail(replyTo) ? replyTo : null;
    const submitterName = resolveSubmitterName(payload);

    const submittedAt = new Date().toISOString();
    const subject = getFormSubject(formType);

    const from = process.env.SMTP_FROM || 'In Lexi Studio <no-reply@inlexistudio.com>';

    await mailer.sendMail({
      from,
      to: recipientEmail,
      replyTo,
      subject,
      text: buildSubmissionTextEmail({ formType, submittedAt, rows }),
      html: buildSubmissionHtmlEmail({ formType, submittedAt, rows }),
    });

    if (submitterEmail) {
      try {
        await mailer.sendMail({
          from,
          to: submitterEmail,
          subject: getAutoReplySubject(formType),
          text: buildAutoReplyTextEmail({ formType, submitterName }),
          html: buildAutoReplyHtmlEmail({ formType, submitterName }),
        });
      } catch (autoReplyError) {
        console.error(
          '[contact] Auto-reply email failed:',
          autoReplyError?.message || autoReplyError,
        );
      }
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send form message.' });
  }
});

// --- Admin Routes ---

router.post('/admin/login', login);

router.get('/admin/umami/summary', authenticateToken, async (req, res) => {
  const { websiteId, startAt, endAt } = req.query;
  if (!websiteId) return res.status(400).json({ error: 'websiteId is required' });

  const end = Number(endAt) || Date.now();
  const start = Number(startAt) || end - 30 * 24 * 60 * 60 * 1000;

  try {
    const [stats, active, pageviews, topPagesRaw, referrers, countries, devices, browsers] =
      await Promise.all([
        umamiRequest(`/websites/${websiteId}/stats`, {
          startAt: start,
          endAt: end,
          compare: 'prev',
        }),
        umamiRequest(`/websites/${websiteId}/active`),
        umamiRequest(`/websites/${websiteId}/pageviews`, {
          startAt: start,
          endAt: end,
          unit: 'day',
          compare: 'prev',
        }),
        umamiRequest(`/websites/${websiteId}/metrics`, {
          startAt: start,
          endAt: end,
          type: 'path',
          limit: 10,
        }),
        umamiRequest(`/websites/${websiteId}/metrics`, {
          startAt: start,
          endAt: end,
          type: 'referrer',
          limit: 10,
        }),
        umamiRequest(`/websites/${websiteId}/metrics`, {
          startAt: start,
          endAt: end,
          type: 'country',
          limit: 8,
        }),
        umamiRequest(`/websites/${websiteId}/metrics`, {
          startAt: start,
          endAt: end,
          type: 'device',
          limit: 6,
        }),
        umamiRequest(`/websites/${websiteId}/metrics`, {
          startAt: start,
          endAt: end,
          type: 'browser',
          limit: 6,
        }),
      ]);

    const topPages = await Promise.all(
      topPagesRaw.map(async (item, index) => {
        if (index > 4) return item;
        try {
          const series = await umamiRequest(`/websites/${websiteId}/pageviews`, {
            startAt: start,
            endAt: end,
            unit: 'day',
            path: item.x,
          });
          return { ...item, series: series.pageviews || [] };
        } catch (err) {
          return { ...item, series: [] };
        }
      }),
    );

    res.json({
      stats,
      active,
      pageviews,
      topPages,
      referrers,
      countries,
      devices,
      browsers,
      range: { startAt: start, endAt: end },
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load analytics' });
  }
});

router.post('/admin/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) await issuePasswordResetForUser(user);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to start password reset' });
  }
});

router.post('/admin/reset-password', async (req, res) => {
  const { token: rawToken, password } = req.body;
  if (!rawToken || !password) return res.status(400).json({ error: 'Token and password required' });

  const validationError = validatePassword(password);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const tokenHash = crypto.createHash('sha256').update(String(rawToken)).digest('hex');
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: { gt: new Date() },
      },
    });

    if (!resetToken) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { user_id: resetToken.user_id, id: { not: resetToken.id } },
      }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.get('/admin/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

router.get('/admin/users', authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
      select: { id: true, email: true, role: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.post('/admin/users', authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const role = normalizeUserRole(req.body?.role);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Użytkownik z tym adresem e-mail już istnieje.' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        role,
        password: passwordHash,
      },
      select: { id: true, email: true, role: true },
    });

    await issuePasswordResetForUser(user);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/admin/users/:id/send-reset', authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await issuePasswordResetForUser(user);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset link' });
  }
});

router.delete('/admin/users/:id', authenticateToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  if (req.user?.id === userId) {
    return res.status(400).json({ error: 'Nie możesz usunąć aktualnie zalogowanego użytkownika.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Nie można usunąć ostatniego administratora.' });
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// File Upload
router.get('/admin/upload/check', authenticateToken, (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const rawName = String(name);
  const baseName = sanitizeBaseName(rawName);
  const preferredFormat = getUploadFormatFromName(rawName);
  const existing = resolveExistingUpload(baseName);
  const filename = existing.exists
    ? existing.filename
    : getUploadFilename(baseName, preferredFormat);

  res.json({
    exists: existing.exists,
    baseName,
    filename,
    url: existing.exists ? existing.url : null,
    format: existing.exists ? existing.format : preferredFormat,
  });
});

router.post('/admin/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const requestedBase = sanitizeBaseName(req.body.baseName || req.file.originalname);
    const overwrite = req.body.overwrite === 'true';
    const incomingFormat = isSvgUpload(req.file) ? 'svg' : 'webp';
    const targetFilename = getUploadFilename(requestedBase, incomingFormat);
    const existingPath = path.join(uploadDir, targetFilename);
    const existingUpload = resolveExistingUpload(requestedBase);

    if ((fs.existsSync(existingPath) || existingUpload.exists) && !overwrite) {
      return res.status(409).json({
        error: 'File exists',
        baseName: requestedBase,
        url: existingUpload.exists ? existingUpload.url : `/uploads/${targetFilename}`,
      });
    }

    if (overwrite) {
      deleteExistingVariants(requestedBase);
    }

    const baseName = requestedBase;
    const hasExplicitTag = typeof req.body.tag === 'string' && req.body.tag.trim() !== '';
    const mediaTag = hasExplicitTag ? normalizeMediaTag(req.body.tag) : null;
    if (incomingFormat === 'svg') {
      const result = writeSvgOriginal(req.file.buffer, baseName);
      try {
        await ensureMediaAssetRecord(result.url, mediaTag);
      } catch (e) {
        console.error('mediaAsset tag error:', e.message);
      }
      return res.json(result);
    }

    const isWebpSource =
      req.file.mimetype === 'image/webp' ||
      (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.webp'));
    const result = await writeWebpVariants(req.file.buffer, baseName, isWebpSource);
    try {
      await ensureMediaAssetRecord(result.url, mediaTag);
    } catch (e) {
      console.error('mediaAsset tag error:', e.message);
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/admin/files', authenticateToken, async (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const mediaAssets = await prisma.mediaAsset.findMany();
    const mediaAssetByUrl = new Map(mediaAssets.map((item) => [item.file_url, item]));

    const fileList = files
      .filter((f) => !isVariantFile(f))
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const url = `/uploads/${f}`;
        const asset = mediaAssetByUrl.get(url);
        return {
          name: f,
          url,
          tag: normalizeMediaTag(asset?.tag),
          title_text: asset?.title_text || null,
          alt_text: asset?.alt_text || null,
        };
      });

    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.put('/admin/media/:name/meta', authenticateToken, async (req, res) => {
  try {
    const safeName = path.basename(req.params.name || '');
    if (!safeName) return res.status(400).json({ error: 'Invalid filename' });

    const targetPath = path.join(uploadDir, safeName);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });

    const fileUrl = `/uploads/${safeName}`;
    const titleText = String(req.body?.title_text || '').trim();
    const altText = String(req.body?.alt_text || '').trim();

    const asset = await prisma.mediaAsset.upsert({
      where: { file_url: fileUrl },
      update: {
        title_text: titleText || null,
        alt_text: altText || null,
      },
      create: {
        file_url: fileUrl,
        tag: 'other',
        title_text: titleText || null,
        alt_text: altText || null,
      },
    });

    res.json({
      ok: true,
      file_url: fileUrl,
      title_text: asset.title_text,
      alt_text: asset.alt_text,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/files/:name', authenticateToken, async (req, res) => {
  const rawName = req.params.name;
  const safeName = path.basename(rawName);
  if (!safeName) return res.status(400).json({ error: 'Invalid filename' });

  const targetPath = path.join(uploadDir, safeName);
  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const baseName = path.basename(safeName, path.extname(safeName));
  const filesToDelete = fs
    .readdirSync(uploadDir)
    .filter(
      (file) =>
        file === safeName ||
        file.startsWith(`${baseName}-w`) ||
        file.startsWith(`${baseName}-seo-1200x630`),
    )
    .map((file) => path.join(uploadDir, file));

  filesToDelete.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  await prisma.mediaAsset.deleteMany({
    where: {
      file_url: {
        in: filesToDelete.map((filePath) => `/uploads/${path.basename(filePath)}`),
      },
    },
  });

  res.json({ ok: true, deleted: filesToDelete.length });
});

router.put('/admin/media/:name/tag', authenticateToken, async (req, res) => {
  try {
    const safeName = path.basename(req.params.name || '');
    if (!safeName) return res.status(400).json({ error: 'Invalid filename' });
    const targetPath = path.join(uploadDir, safeName);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });

    const fileUrl = `/uploads/${safeName}`;
    const tag = normalizeMediaTag(req.body?.tag);
    await upsertMediaAssetTag(fileUrl, tag);
    res.json({ ok: true, file_url: fileUrl, tag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/media/usage', authenticateToken, async (req, res) => {
  try {
    const mediaAssets = await prisma.mediaAsset.findMany();
    const mediaAssetByUrl = new Map(mediaAssets.map((item) => [item.file_url, item]));
    const files = fs
      .readdirSync(uploadDir)
      .filter((f) => !isVariantFile(f))
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const url = `/uploads/${f}`;
        const asset = mediaAssetByUrl.get(url);
        return {
          name: f,
          url,
          tag: normalizeMediaTag(asset?.tag),
          title_text: asset?.title_text || null,
          alt_text: asset?.alt_text || null,
        };
      });

    const pages = await prisma.page.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        meta_title: true,
        hero_image: true,
        seo_image: true,
        content: true,
      },
    });

    const galleries = await prisma.gallery.findMany({
      include: { items: true },
    });

    const testimonials = await prisma.testimonial.findMany({
      select: { id: true, author: true, avatar_image: true },
    });

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });

    const usageFiles = files.map((file) => {
      const usage = { pages: [], galleries: [], testimonials: [], settings: [] };
      const filename = file.name;

      pages.forEach((page) => {
        const locations = [];
        if (page.hero_image && page.hero_image.includes(filename)) locations.push('Hero');
        if (page.seo_image && page.seo_image.includes(filename)) locations.push('SEO');
        if (page.content && page.content.includes(filename)) locations.push('Treść');
        if (locations.length) {
          usage.pages.push({
            id: page.id,
            slug: page.slug,
            title: page.title || page.meta_title || page.slug,
            locations,
          });
        }
      });

      galleries.forEach((gallery) => {
        const hasMatch = (gallery.items || []).some(
          (item) => item.image_path && item.image_path.includes(filename),
        );
        if (hasMatch) {
          usage.galleries.push({
            id: gallery.id,
            name: gallery.name,
            category: gallery.category,
          });
        }
      });

      testimonials.forEach((testimonial) => {
        if (testimonial.avatar_image && testimonial.avatar_image.includes(filename)) {
          usage.testimonials.push({
            id: testimonial.id,
            author: testimonial.author,
          });
        }
      });

      if (settings) {
        if (settings.og_image && settings.og_image.includes(filename)) {
          usage.settings.push('OG Image');
        }
        if (settings.favicon && settings.favicon.includes(filename)) {
          usage.settings.push('Favicon');
        }
        if (settings.logo_path && settings.logo_path.includes(filename)) {
          usage.settings.push('Logo');
        }
        if (settings.logo_secondary_path && settings.logo_secondary_path.includes(filename)) {
          usage.settings.push('Logo dodatkowe');
        }
        if (settings.mega_menu_image && settings.mega_menu_image.includes(filename)) {
          usage.settings.push('Mega menu');
        }
      }

      const usageCount =
        usage.pages.length +
        usage.galleries.length +
        usage.testimonials.length +
        usage.settings.length;

      return { ...file, usage, usageCount };
    });

    res.json({ files: usageFiles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Page Routes (Admin)
const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseJsonArray = (value) => {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const stringifyJsonArray = (value) => {
  if (value === undefined || value === null) return null;
  const parsed = parseJsonArray(value);
  if (parsed === undefined || parsed === null) return null;
  return JSON.stringify(parsed);
};

const normalizeStringArray = (value) =>
  (parseJsonArray(value) || [])
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeNumberArray = (value) =>
  (parseJsonArray(value) || []).map((item) => Number(item)).filter((item) => Number.isFinite(item));

const PAGE_MUTABLE_FIELDS = new Set([
  'slug',
  'title',
  'content',
  'hero_image',
  'home_hero_logo',
  'logo_variant',
  'home_gallery_wedding_id',
  'home_gallery_portrait_id',
  'home_gallery_product_id',
  'home_gallery_wedding_images',
  'home_gallery_portrait_images',
  'home_gallery_product_images',
  'home_moments_image',
  'home_latest_moments_bg',
  'home_latest_gallery_ids',
  'home_testimonial_ids',
  'wedding_testimonial_ids',
  'faq_items',
  'wedding_slider_images',
  'wedding_session_types',
  'portfolio_gallery_ids',
  'about_origin_images',
  'about_story_images',
  'about_story_captions',
  'about_work_images',
  'meta_title',
  'meta_description',
  'seo_image',
  'sort_order',
  'is_home',
  'seo_use_hero',
]);

const SUPPORTED_PAGE_FIELDS = (() => {
  try {
    const runtimeFields = prisma?._runtimeDataModel?.models?.Page?.fields;
    if (Array.isArray(runtimeFields) && runtimeFields.length) {
      return new Set(runtimeFields.map((field) => field.name));
    }
  } catch (error) {
    console.warn('Unable to inspect Prisma runtime Page fields:', error?.message || error);
  }
  return null;
})();

const HOME_FAQ_DEFAULTS = [
  {
    question: 'What photography services do you offer?',
    answer:
      'I provide three main photography services: Wedding Photography - I capture your special day with a blend of candid moments and posed portraits, documenting everything from getting ready to the first dance. Portrait and Headshot Photography - Professional headshots for business, LinkedIn, or acting portfolios, plus personal portraits for family occasions. Sessions can be in-studio or on location, and I can bring studio equipment to your chosen spot. Product and Promotional Photography - Commercial photography for businesses including product shots, e-commerce imagery, social media content, and promotional campaigns that help your brand stand out.',
  },
  {
    question: 'What is included in your photography services and what are your rates?',
    answer:
      'Every service is tailored to your specific needs and includes professional consultation, the photography session, and expert post-processing with delivery of high-resolution edited images. For detailed package information and current rates, please visit my rates section or contact me here for a personalized quote based on your requirements.',
  },
  {
    question:
      'How far in advance should I book my photography session and what is your booking process?',
    answer:
      'I recommend booking as soon as possible since dates fill quickly and I keep a limited number of spots to ensure quality service. To secure your date, reach out through my contact form and we will discuss your needs, check availability, and finalize your booking with a signed contract and retainer.',
  },
  {
    question: 'Do you offer complimentary consultations?',
    answer:
      'Yes. I offer free consultations to discuss your vision, answer questions, and make sure we are the perfect fit.',
  },
  {
    question: 'What happens if I wait to book?',
    answer:
      'My calendar fills months in advance, especially for popular wedding dates and seasons. The longer you wait, the less likely your preferred date will be available.',
  },
  {
    question: 'Can you show me recent work from sessions like mine?',
    answer:
      'Absolutely. I love sharing recent galleries that match what you are looking for. Contact me with details about your event or session and I will send you a personalized portfolio of similar work.',
  },
];

const WEDDING_FAQ_DEFAULTS = [
  {
    question: "Can't meet in person?",
    answer:
      '<p>We are always happy to meet with you in person.</p><p>We can also meet via Skype or a similar video call.</p>',
  },
  {
    question: 'Booking',
    answer:
      '<p>A deposit is needed to secure the date, with the amount depending on your chosen plan or individual needs.</p><p>The smallest amount to secure a date is £250.</p>',
  },
  {
    question: 'Payments and deposit',
    answer:
      '<p>Payment for your package is required two weeks before your big date. Full payments can be made by bank transfer or in cash.</p><p>Additional products can always be purchased after the wedding by contacting us.</p><p>Above prices include VAT; however, they do not include travel costs or postage for sending prints.</p>',
  },
  {
    question: 'Wedding day coverage',
    answer:
      '<p>A standard full day of wedding coverage consists of 8 hours, and half day coverage lasts for 4 hours.</p><p>If you would like different hours, please get in touch for a quote with some event details.</p>',
  },
  {
    question: 'Family and group photos',
    answer:
      '<p>Nearly every client wants at least a few group photos, and we see this as a normal part of the day.</p><p>We recommend keeping the number of group photos to around 7 so this part does not take over the day.</p><p>Before your wedding, we will send you a guide with different ways to organize group photos so you get what you want.</p>',
  },
  {
    question: 'Second photographer',
    answer:
      '<p>Having two photographers adds freshness and variety, and lets us be in two places at once.</p><p>It also means we move around less; for example, during a ceremony we can have two viewpoints without moving, which is less obtrusive.</p>',
  },
  {
    question: 'Travel',
    answer:
      '<p>We do not charge travel within a fifty mile range of Glasgow.</p><p>For further afield, we do not charge travelling time, only expenses incurred.</p>',
  },
  {
    question: 'Online gallery',
    answer:
      '<p>Online secured gallery available for you to view, download, and share with family and friends.</p><p>Access is provided for 6 months.</p>',
  },
];

const getDefaultFaqItems = (page) => {
  const slug = String(page?.slug || '')
    .replace(/^\/+/, '')
    .toLowerCase();
  const isHome = Boolean(page?.is_home) || slug === '' || slug === 'home';
  if (isHome) return HOME_FAQ_DEFAULTS;
  if (slug === 'wedding-photography') return WEDDING_FAQ_DEFAULTS;
  return [];
};

const normalizeFaqItems = (faqItems, page) => {
  const parsed = parseJsonArray(faqItems);
  if (Array.isArray(parsed) && parsed.length) {
    return parsed
      .map((item) => ({
        question: String(item?.question || '').trim(),
        answer: String(item?.answer || '').trim(),
      }))
      .filter((item) => item.question && item.answer);
  }
  return getDefaultFaqItems(page);
};

const normalizeWeddingSessionTypes = (sessionTypes) => {
  const parsed = parseJsonArray(sessionTypes);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      title: String(item?.title || '').trim(),
      description: String(item?.description || '').trim(),
      image: String(item?.image || '').trim(),
      items: Array.isArray(item?.items)
        ? item.items.map((i) => String(i).trim()).filter(Boolean)
        : [],
    }))
    .filter((item) => item.title || item.description || item.image);
};

const normalizePageResponse = (page, settings = null) => {
  if (!page) return page;
  const logoVariant =
    String(page.logo_variant || 'primary') === 'secondary' ? 'secondary' : 'primary';
  const resolvedMainLogo = page?.home_hero_logo || null;
  const resolvedGlobalMainLogo = settings?.logo_path || null;
  const resolvedGlobalSecondaryLogo = settings?.logo_secondary_path || null;
  const resolvedHeroLogo =
    logoVariant === 'secondary'
      ? resolvedGlobalSecondaryLogo || resolvedGlobalMainLogo || resolvedMainLogo
      : resolvedGlobalMainLogo || resolvedGlobalSecondaryLogo || resolvedMainLogo;

  return {
    ...page,
    logo_variant: logoVariant,
    home_hero_logo: resolvedHeroLogo || null,
    home_gallery_wedding_images: parseJsonArray(page.home_gallery_wedding_images),
    home_gallery_portrait_images: parseJsonArray(page.home_gallery_portrait_images),
    home_gallery_product_images: parseJsonArray(page.home_gallery_product_images),
    home_latest_gallery_ids: parseJsonArray(page.home_latest_gallery_ids),
    home_testimonial_ids: parseJsonArray(page.home_testimonial_ids),
    wedding_testimonial_ids: parseJsonArray(page.wedding_testimonial_ids),
    wedding_slider_images: parseJsonArray(page.wedding_slider_images),
    wedding_session_types: normalizeWeddingSessionTypes(page.wedding_session_types),
    portfolio_gallery_ids: normalizeStringArray(page.portfolio_gallery_ids),
    about_origin_images: parseJsonArray(page.about_origin_images),
    about_story_images: parseJsonArray(page.about_story_images),
    about_story_captions: parseJsonArray(page.about_story_captions),
    about_work_images: parseJsonArray(page.about_work_images),
    faq_items: normalizeFaqItems(page.faq_items, page),
  };
};

const isProtectedHomePage = (page) => {
  const normalizedSlug = String(page?.slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  return Boolean(page?.is_home) || normalizedSlug === '' || normalizedSlug === 'home';
};

const normalizePagePayload = (data) => {
  if (!data) return;

  Object.keys(data).forEach((key) => {
    const notMutable = !PAGE_MUTABLE_FIELDS.has(key);
    const notSupportedByClient = SUPPORTED_PAGE_FIELDS && !SUPPORTED_PAGE_FIELDS.has(key);
    if (notMutable || notSupportedByClient) {
      delete data[key];
    }
  });

  data.home_gallery_wedding_id = toNumberOrNull(data.home_gallery_wedding_id);
  data.home_gallery_portrait_id = toNumberOrNull(data.home_gallery_portrait_id);
  data.home_gallery_product_id = toNumberOrNull(data.home_gallery_product_id);
  data.home_gallery_wedding_images = stringifyJsonArray(
    normalizeStringArray(data.home_gallery_wedding_images),
  );
  data.home_gallery_portrait_images = stringifyJsonArray(
    normalizeStringArray(data.home_gallery_portrait_images),
  );
  data.home_gallery_product_images = stringifyJsonArray(
    normalizeStringArray(data.home_gallery_product_images),
  );
  data.logo_variant =
    String(data.logo_variant || 'primary') === 'secondary' ? 'secondary' : 'primary';
  data.home_hero_logo = data.home_hero_logo || null;
  data.home_moments_image = data.home_moments_image || null;
  data.home_latest_moments_bg = data.home_latest_moments_bg || null;
  data.home_latest_gallery_ids = stringifyJsonArray(
    normalizeNumberArray(data.home_latest_gallery_ids),
  );
  data.home_testimonial_ids = stringifyJsonArray(normalizeNumberArray(data.home_testimonial_ids));
  data.wedding_testimonial_ids = stringifyJsonArray(
    normalizeNumberArray(data.wedding_testimonial_ids),
  );
  data.wedding_slider_images = stringifyJsonArray(normalizeStringArray(data.wedding_slider_images));
  data.wedding_session_types = stringifyJsonArray(
    normalizeWeddingSessionTypes(data.wedding_session_types),
  );
  data.portfolio_gallery_ids = stringifyJsonArray(normalizeStringArray(data.portfolio_gallery_ids));
  data.about_origin_images = stringifyJsonArray(normalizeStringArray(data.about_origin_images));
  data.about_story_images = stringifyJsonArray(normalizeStringArray(data.about_story_images));
  data.about_story_captions = stringifyJsonArray(normalizeStringArray(data.about_story_captions));
  data.about_work_images = stringifyJsonArray(normalizeStringArray(data.about_work_images));
  data.faq_items = stringifyJsonArray(data.faq_items);
};

router.get('/admin/pages', authenticateToken, async (req, res) => {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const pages = await prisma.page.findMany({
    orderBy: [{ sort_order: 'asc' }, { updated_at: 'desc' }],
  });
  res.json(pages.map((page) => normalizePageResponse(page, settings)));
});
router.put('/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    const pageId = Number(id);

    normalizePagePayload(data);
router.delete('/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    const pageId = Number(req.params.id);
    if (!Number.isFinite(pageId)) {
      return res.status(400).json({ error: 'Invalid page id' });
    }

    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (isProtectedHomePage(page)) {
      return res.status(400).json({ error: 'Nie mozna usunac aktywnej strony glownej.' });
    }

    await prisma.page.delete({ where: { id: pageId } });
    res.json({ success: true });
  } catch (e) {
    console.error('Page delete failed:', e);
    res.status(500).json({ error: e.message || 'Page delete failed' });
  }
});

    if (data.is_home) {
      data.slug = '/';
    }

    if (data.seo_use_hero) {
      data.seo_image = data.hero_image ? await ensureSeoImage(data.hero_image) : null;
    } else if (data.seo_image) {
      data.seo_image = await ensureSeoImage(data.seo_image);
    }

    if (data.is_home) {
      await prisma.page.updateMany({
        where: { is_home: true, NOT: { id: pageId } },
        data: { is_home: false },
      });

      const conflict = await prisma.page.findFirst({
        where: { slug: '/', NOT: { id: pageId } },
      });
      if (conflict) {
        await prisma.page.update({
          where: { id: conflict.id },
          data: { slug: `home-${conflict.id}` },
        });
      }
    }

    const page = await prisma.page.update({ where: { id: Number(id) }, data });
    try {
      await autoTagImagesFromPage(data);
    } catch {}
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const normalized = normalizePageResponse(page, settings);
    res.json(normalized);
  } catch (e) {
    console.error('Page update failed:', e);
    res.status(500).json({ error: e.message || 'Page update failed' });
  }
});
router.post('/admin/pages', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body };

    normalizePagePayload(data);

    if (data.is_home) {
      data.slug = '/';
      await prisma.page.updateMany({
        where: { is_home: true },
        data: { is_home: false },
      });
    }

    if (data.seo_use_hero) {
      data.seo_image = data.hero_image ? await ensureSeoImage(data.hero_image) : null;
    } else if (data.seo_image) {
      data.seo_image = await ensureSeoImage(data.seo_image);
    }

    const page = await prisma.page.create({ data });
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const normalized = normalizePageResponse(page, settings);
    res.json(normalized);
  } catch (e) {
    console.error('Page create failed:', e);
    res.status(500).json({ error: e.message || 'Page create failed' });
  }
});

router.post('/admin/pages/reorder', authenticateToken, async (req, res) => {
  const { items } = req.body;
  const updates = items.map((id, index) =>
    prisma.page.update({
      where: { id: Number(id) },
      data: { sort_order: index },
    }),
  );
  await prisma.$transaction(updates);
  res.json({ success: true });
});

// Galleries (Admin)
router.get('/admin/galleries', authenticateToken, async (req, res) => {
  const data = await prisma.gallery.findMany({
    include: {
      items: { orderBy: { sort_order: 'asc' } },
      testimonial: true,
    },
  });
  res.json(data);
});
router.post('/admin/galleries', authenticateToken, async (req, res) => {
  const payload = { ...req.body };
  normalizeGalleryPayload(payload);
  const data = await prisma.gallery.create({ data: payload });
  res.json(data);
});
router.put('/admin/galleries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body };
  normalizeGalleryPayload(payload);
  const data = await prisma.gallery.update({ where: { id: Number(id) }, data: payload });
  res.json(data);
});
router.delete('/admin/galleries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const galleryId = Number(id);
  await prisma.$transaction([
    prisma.testimonial.updateMany({
      where: { gallery_id: galleryId },
      data: { gallery_id: null },
    }),
    prisma.gallery.delete({ where: { id: galleryId } }),
  ]);
  res.json({ success: true });
});

// Gallery Items
router.post('/admin/gallery-items', authenticateToken, async (req, res) => {
  const { gallery_id, ...rest } = req.body;
  const item = await prisma.galleryItem.create({
    data: {
      ...rest,
      gallery: { connect: { id: Number(gallery_id) } },
    },
  });
  try {
    const gallery = await prisma.gallery.findUnique({ where: { id: Number(gallery_id) } });
    if (
      gallery &&
      rest.image_path &&
      ['wedding', 'portrait', 'product'].includes(gallery.category)
    ) {
      await ensureMediaAssetRecord(rest.image_path, gallery.category);
    }
  } catch {}
  res.json(item);
});

router.delete('/admin/gallery-items/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await prisma.galleryItem.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

router.post('/admin/gallery-items/reorder', authenticateToken, async (req, res) => {
  const { items } = req.body; // Array of IDs in new order
  const updates = items.map((id, index) =>
    prisma.galleryItem.update({
      where: { id: Number(id) },
      data: { sort_order: index },
    }),
  );
  await prisma.$transaction(updates);
  res.json({ success: true });
});

// Testimonials (Admin)
router.get('/admin/testimonials', authenticateToken, async (req, res) => {
  const data = await prisma.testimonial.findMany({
    include: { gallery: true },
  });
  res.json(data);
});
router.post('/admin/testimonials', authenticateToken, async (req, res) => {
  const data = await prisma.testimonial.create({ data: req.body });
  res.json(data);
});
router.put('/admin/testimonials/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const data = await prisma.testimonial.update({ where: { id: Number(id) }, data: req.body });
  res.json(data);
});
router.delete('/admin/testimonials/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await prisma.testimonial.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

// Settings
router.put('/admin/settings', authenticateToken, async (req, res) => {
  const data = await prisma.settings.upsert({
    where: { id: 1 },
    update: req.body,
    create: { id: 1, ...req.body },
  });
  res.json(data);
});

module.exports = router;
