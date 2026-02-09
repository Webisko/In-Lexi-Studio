const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./inlexistudio.db',
    },
  },
});

const WEDDING_SESSIONS = [
  'Lesleyann & Colin',
  'BillyJo & Martin',
  'Alice & Alex',
  'Clair & John',
  'Chloe & Thomas',
  'Claire & Ryan',
];

const TESTIMONIALS = {
  'Lesleyann & Colin':
    'We felt completely at ease from the first minutes, and the photos captured all the little emotions we were hoping to remember. The images feel cinematic but still very much us.',
  'BillyJo & Martin':
    'So grateful for the calm, natural way our day was documented. The story feels authentic and full of real moments, not staged or forced in any way.',
  'Alice & Alex':
    'The light, the smiles, the atmosphere - everything came together beautifully. We look at the gallery and can relive the day instantly.',
  'Clair & John':
    'Zero stress and no awkward posing. The photos are warm, honest, and full of the feelings we had on the day.',
  'Chloe & Thomas':
    'Wonderful energy with us and our guests. We felt looked after and the final images are a beautiful keepsake we will treasure for years.',
  'Claire & Ryan':
    'Amazing timing and attention to detail. Every photo feels like a small story, and the whole set feels so personal to us.',
};

const buildTestimonialContent = (name) =>
  TESTIMONIALS[name] ||
  'Sesja ślubna była wyjątkowa - dziękujemy za piękne kadry i wspaniałą atmosferę.';

async function ensureGallery(name) {
  const existing = await prisma.gallery.findFirst({
    where: { name, category: 'wedding' },
  });
  if (existing) return existing;
  return prisma.gallery.create({ data: { name, category: 'wedding' } });
}

async function ensureTestimonial(author) {
  const content = buildTestimonialContent(author);
  const existing = await prisma.testimonial.findFirst({ where: { author } });
  if (existing) {
    return prisma.testimonial.update({
      where: { id: existing.id },
      data: { content, rating: 5, approved: true },
    });
  }
  return prisma.testimonial.create({
    data: {
      author,
      content,
      rating: 5,
      approved: true,
    },
  });
}

async function main() {
  for (const name of WEDDING_SESSIONS) {
    const gallery = await ensureGallery(name);
    const testimonial = await ensureTestimonial(name);
    await prisma.testimonial.update({
      where: { id: testimonial.id },
      data: { gallery_id: gallery.id },
    });
  }

  console.log('Seeded wedding sessions and testimonials.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
