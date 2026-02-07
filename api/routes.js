const express = require('express');
const router = express.Router();
const prisma = require('./db');
const { authenticateToken, login } = require('./auth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// --- Uploads Config ---
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// --- Public Routes ---

// Get all pages (slugs) - Required for Static Site Generation
router.get('/pages', async (req, res) => {
  try {
    const pages = await prisma.page.findMany();
    res.json(pages);
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

router.get('/admin/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// File Upload
router.post('/admin/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.get('/admin/files', authenticateToken, (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    const fileList = files
      .map((f) => ({
        name: f,
        url: `/uploads/${f}`,
      }))
      .filter((f) => !f.name.startsWith('.')); // hide dotfiles
    res.json(fileList);
  });
});

// Page Routes (Admin)
router.get('/admin/pages', authenticateToken, async (req, res) => {
  const pages = await prisma.page.findMany();
  res.json(pages);
});
router.put('/admin/pages/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Ensure we are updating correct fields based on new schema
  const data = req.body;
  const page = await prisma.page.update({ where: { id: Number(id) }, data });
  res.json(page);
});
router.post('/admin/pages', authenticateToken, async (req, res) => {
  const page = await prisma.page.create({ data: req.body });
  res.json(page);
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
