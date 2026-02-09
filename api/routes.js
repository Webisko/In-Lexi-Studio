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

const validatePassword = (password) => {
  if (!password || password.length < 10) return 'Haslo musi miec co najmniej 10 znakow.';
  if (!/[A-Z]/.test(password)) return 'Haslo musi zawierac wielka litere.';
  if (!/[a-z]/.test(password)) return 'Haslo musi zawierac mala litere.';
  if (!/[0-9]/.test(password)) return 'Haslo musi zawierac cyfre.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Haslo musi zawierac znak specjalny.';
  return null;
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

const isVariantFile = (name) => /-w\d+\.webp$/i.test(name) || /-seo-1200x630\.webp$/i.test(name);

const sanitizeBaseName = (name) => {
  const parsed = path.parse(name || '').name.toLowerCase();
  const safe = parsed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || `upload-${Date.now()}`;
};

const buildBaseName = (originalName) => {
  const base = sanitizeBaseName(originalName);
  let candidate = base;
  let counter = 1;
  while (fs.existsSync(path.join(uploadDir, `${candidate}.webp`))) {
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
    const pages = await prisma.page.findMany({
      orderBy: [{ sort_order: 'asc' }, { updated_at: 'desc' }],
    });
    res.json(pages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get home page
router.get('/pages/home', async (req, res) => {
  try {
    let page = await prisma.page.findFirst({ where: { is_home: true } });
    if (!page) page = await prisma.page.findFirst({ where: { slug: '/' } });
    if (!page) page = await prisma.page.findFirst({ where: { slug: 'home' } });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all pages or by slug
router.get('/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/galleries', async (req, res) => {
  try {
    const galleries = await prisma.gallery.findMany({
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
      where: { category },
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

router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    res.json(settings || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
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

    if (user) {
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
    }

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

// File Upload
router.get('/admin/upload/check', authenticateToken, (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const baseName = sanitizeBaseName(String(name));
  const filename = `${baseName}.webp`;
  const exists = fs.existsSync(path.join(uploadDir, filename));
  res.json({
    exists,
    baseName,
    filename,
    url: exists ? `/uploads/${filename}` : null,
  });
});

router.post('/admin/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const requestedBase = sanitizeBaseName(req.body.baseName || req.file.originalname);
    const overwrite = req.body.overwrite === 'true';
    const existingPath = path.join(uploadDir, `${requestedBase}.webp`);

    if (fs.existsSync(existingPath) && !overwrite) {
      return res
        .status(409)
        .json({
          error: 'File exists',
          baseName: requestedBase,
          url: `/uploads/${requestedBase}.webp`,
        });
    }

    if (overwrite) {
      deleteExistingVariants(requestedBase);
    }

    const baseName = requestedBase;
    const isWebpSource =
      req.file.mimetype === 'image/webp' ||
      (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.webp'));
    const result = await writeWebpVariants(req.file.buffer, baseName, isWebpSource);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/admin/files', authenticateToken, (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    const fileList = files
      .filter((f) => !isVariantFile(f))
      .map((f) => ({
        name: f,
        url: `/uploads/${f}`,
      }))
      .filter((f) => !f.name.startsWith('.')); // hide dotfiles
    res.json(fileList);
  });
});

router.delete('/admin/files/:name', authenticateToken, (req, res) => {
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

  res.json({ ok: true, deleted: filesToDelete.length });
});

router.get('/admin/media/usage', authenticateToken, async (req, res) => {
  try {
    const files = fs
      .readdirSync(uploadDir)
      .filter((f) => !isVariantFile(f))
      .filter((f) => !f.startsWith('.'))
      .map((f) => ({ name: f, url: `/uploads/${f}` }));

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

const normalizePagePayload = (data) => {
  if (!data) return;
  data.home_gallery_wedding_id = toNumberOrNull(data.home_gallery_wedding_id);
  data.home_gallery_portrait_id = toNumberOrNull(data.home_gallery_portrait_id);
  data.home_gallery_product_id = toNumberOrNull(data.home_gallery_product_id);
  data.home_gallery_wedding_images = parseJsonArray(data.home_gallery_wedding_images);
  data.home_gallery_portrait_images = parseJsonArray(data.home_gallery_portrait_images);
  data.home_gallery_product_images = parseJsonArray(data.home_gallery_product_images);
  data.home_hero_logo = data.home_hero_logo || null;
  data.home_moments_image = data.home_moments_image || null;
  data.home_latest_moments_bg = data.home_latest_moments_bg || null;
  data.home_latest_gallery_ids = parseJsonArray(data.home_latest_gallery_ids);
  data.home_testimonial_ids = parseJsonArray(data.home_testimonial_ids);
  data.wedding_slider_images = parseJsonArray(data.wedding_slider_images);
  data.portfolio_gallery_ids = parseJsonArray(data.portfolio_gallery_ids);
};

router.get('/admin/pages', authenticateToken, async (req, res) => {
  const pages = await prisma.page.findMany({
    orderBy: [{ sort_order: 'asc' }, { updated_at: 'desc' }],
  });
  res.json(pages);
});
router.put('/admin/pages/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  const pageId = Number(id);

  normalizePagePayload(data);

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
  res.json(page);
});
router.post('/admin/pages', authenticateToken, async (req, res) => {
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
  res.json(page);
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
  const data = await prisma.gallery.create({ data: req.body });
  res.json(data);
});
router.put('/admin/galleries/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const data = await prisma.gallery.update({ where: { id: Number(id) }, data: req.body });
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
