const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./inlexistudio.db',
    },
  },
});

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

const hasFaq = (value) => {
  if (!value) return false;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch (err) {
    return false;
  }
};

async function backfillPageFaq(slug, faqItems) {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return;
  if (hasFaq(page.faq_items)) return;
  await prisma.page.update({
    where: { id: page.id },
    data: { faq_items: JSON.stringify(faqItems) },
  });
  console.log(`Backfilled FAQ for ${slug}`);
}

async function main() {
  await backfillPageFaq('/', HOME_FAQ_DEFAULTS);
  await backfillPageFaq('home', HOME_FAQ_DEFAULTS);
  await backfillPageFaq('wedding-photography', WEDDING_FAQ_DEFAULTS);
  console.log('FAQ backfill complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
