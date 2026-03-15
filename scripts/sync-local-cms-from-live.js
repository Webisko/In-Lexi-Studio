const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const LIVE_API_BASE = process.env.LIVE_API_BASE || 'https://inlexistudio.com/app/api';
const ROOT_DIR = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'inlexistudio.db');
const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./inlexistudio.db',
    },
  },
});

const CANONICAL_WEDDING_SESSION_TYPES = [
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

const fetchJson = async (endpoint) => {
  const response = await fetch(`${LIVE_API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }
  return response.json();
};

const jsonOrNull = (value) => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const backupDatabase = () => {
  if (!fs.existsSync(DB_PATH)) return null;
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUPS_DIR, `inlexistudio-${stamp}.db`);
  fs.copyFileSync(DB_PATH, target);
  return target;
};

const normalizePageForDb = (page) => {
  const isWeddingPage = String(page.slug || '').replace(/^\/+/, '') === 'wedding-photography';
  const weddingSessionTypes =
    isWeddingPage &&
    (!Array.isArray(page.wedding_session_types) || page.wedding_session_types.length === 0)
      ? CANONICAL_WEDDING_SESSION_TYPES
      : page.wedding_session_types;

  return {
    id: Number(page.id),
    slug: String(page.slug || ''),
    title: page.title || null,
    content: page.content || null,
    hero_image: page.hero_image || null,
    home_hero_logo: page.home_hero_logo || null,
    logo_variant: page.logo_variant || 'primary',
    home_gallery_wedding_id: page.home_gallery_wedding_id ?? null,
    home_gallery_portrait_id: page.home_gallery_portrait_id ?? null,
    home_gallery_product_id: page.home_gallery_product_id ?? null,
    home_gallery_wedding_images: jsonOrNull(page.home_gallery_wedding_images),
    home_gallery_portrait_images: jsonOrNull(page.home_gallery_portrait_images),
    home_gallery_product_images: jsonOrNull(page.home_gallery_product_images),
    home_moments_image: page.home_moments_image || null,
    home_latest_moments_bg: page.home_latest_moments_bg || null,
    home_latest_gallery_ids: jsonOrNull(page.home_latest_gallery_ids),
    home_testimonial_ids: jsonOrNull(page.home_testimonial_ids),
    wedding_testimonial_ids: jsonOrNull(page.wedding_testimonial_ids),
    faq_items: jsonOrNull(page.faq_items),
    wedding_slider_images: jsonOrNull(page.wedding_slider_images),
    wedding_session_types: jsonOrNull(weddingSessionTypes),
    portfolio_gallery_ids: jsonOrNull(page.portfolio_gallery_ids),
    about_origin_images: jsonOrNull(page.about_origin_images),
    about_story_images: jsonOrNull(page.about_story_images),
    about_story_captions: jsonOrNull(page.about_story_captions),
    about_work_images: jsonOrNull(page.about_work_images),
    meta_title: page.meta_title || null,
    meta_description: page.meta_description || null,
    seo_image: page.seo_image || null,
    sort_order: page.sort_order ?? 0,
    is_home: Boolean(page.is_home),
    seo_use_hero: page.seo_use_hero !== false,
  };
};

const normalizeGalleryForDb = (gallery) => ({
  id: Number(gallery.id),
  category: String(gallery.category || 'other'),
  name: gallery.name || null,
  short_description: gallery.short_description || null,
  cover_image: gallery.cover_image || null,
  published: gallery.published !== false,
});

const normalizeGalleryItemsForDb = (galleries) =>
  galleries.flatMap((gallery) =>
    (gallery.items || []).map((item) => ({
      id: Number(item.id),
      gallery_id: Number(gallery.id),
      title: item.title || null,
      image_path: item.image_path,
      alt: item.alt || null,
      sort_order: item.sort_order ?? 0,
    })),
  );

const normalizeTestimonialsForDb = (testimonials) =>
  testimonials.map((item) => ({
    id: Number(item.id),
    author: item.author,
    avatar_image: item.avatar_image || null,
    content: item.content || null,
    rating: item.rating ?? 5,
    approved: item.approved !== false,
    gallery_id: item.gallery_id ?? null,
  }));

const normalizeSettingsForDb = (settings) => ({
  id: Number(settings.id || 1),
  site_name: settings.site_name || null,
  meta_title: settings.meta_title || null,
  meta_description: settings.meta_description || null,
  og_image: settings.og_image || null,
  favicon: settings.favicon || null,
  canonical_base_url: settings.canonical_base_url || null,
  head_html: settings.head_html || null,
  body_html: settings.body_html || null,
  cta_text: settings.cta_text || null,
  cta_url: settings.cta_url || null,
  footer_text: settings.footer_text || null,
  privacy_url: settings.privacy_url || null,
  logo_path: settings.logo_path || null,
  logo_secondary_path: settings.logo_secondary_path || null,
  mega_menu_image: settings.mega_menu_image || null,
  email: settings.email || null,
  phone: settings.phone || null,
  instagram: settings.instagram || null,
  facebook: settings.facebook || null,
  umami_script_url: settings.umami_script_url || null,
  umami_website_id: settings.umami_website_id || null,
  umami_domains: settings.umami_domains || null,
  umami_dashboard_url: settings.umami_dashboard_url || null,
});

const normalizeMediaForDb = (media) =>
  media.map((item) => ({
    file_url: item.url,
    tag: item.tag || 'other',
    title_text: item.title_text || null,
    alt_text: item.alt_text || null,
  }));

async function main() {
  const backupPath = backupDatabase();
  if (backupPath) {
    console.log(`Backup created: ${backupPath}`);
  }

  const [pages, galleries, testimonials, settings, media] = await Promise.all([
    fetchJson('/pages'),
    fetchJson('/galleries'),
    fetchJson('/testimonials'),
    fetchJson('/settings'),
    fetchJson('/media'),
  ]);

  const pageRows = pages.map(normalizePageForDb);
  const galleryRows = galleries.map(normalizeGalleryForDb);
  const galleryItemRows = normalizeGalleryItemsForDb(galleries);
  const testimonialRows = normalizeTestimonialsForDb(testimonials);
  const settingsRow = normalizeSettingsForDb(settings);
  const mediaRows = normalizeMediaForDb(media);

  await prisma.$transaction(async (tx) => {
    await tx.galleryItem.deleteMany();
    await tx.testimonial.deleteMany();
    await tx.gallery.deleteMany();
    await tx.page.deleteMany();
    await tx.mediaAsset.deleteMany();
    await tx.settings.deleteMany();

    if (galleryRows.length) {
      await tx.gallery.createMany({ data: galleryRows });
    }
    if (galleryItemRows.length) {
      await tx.galleryItem.createMany({ data: galleryItemRows });
    }
    if (testimonialRows.length) {
      await tx.testimonial.createMany({ data: testimonialRows });
    }
    if (pageRows.length) {
      await tx.page.createMany({ data: pageRows });
    }
    await tx.settings.create({ data: settingsRow });
    if (mediaRows.length) {
      await tx.mediaAsset.createMany({ data: mediaRows });
    }
  });

  console.log(
    JSON.stringify(
      {
        synced: true,
        pages: pageRows.length,
        galleries: galleryRows.length,
        galleryItems: galleryItemRows.length,
        testimonials: testimonialRows.length,
        mediaAssets: mediaRows.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
