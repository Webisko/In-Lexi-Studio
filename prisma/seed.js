const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./inlexistudio.db',
    },
  },
});

async function main() {
  const adminEmail = 'admin@webisko.pl';
  const adminPassword = 'LexiAdmin!2026';
  const managerEmail = 'info@inlexistudio.com';
  const managerPassword = 'LexiManager!2026';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const managerHash = await bcrypt.hash(managerPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminHash, role: 'ADMIN' },
    create: {
      email: adminEmail,
      password: adminHash,
      role: 'ADMIN',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: managerEmail },
    update: { password: managerHash, role: 'MANAGER' },
    create: {
      email: managerEmail,
      password: managerHash,
      role: 'MANAGER',
    },
  });

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      login_background_image: '/uploads/ils-166.webp',
      instagram: 'https://www.instagram.com/alexandanna.weddings',
      facebook: 'https://www.facebook.com/alexandannaweddingphotography',
    },
    create: {
      site_name: 'In Lexi Studio',
      email: 'kontakt@inlexistudio.com',
      login_background_image: '/uploads/ils-166.webp',
      instagram: 'https://www.instagram.com/alexandanna.weddings',
      facebook: 'https://www.facebook.com/alexandannaweddingphotography',
    },
  });

  console.log({ adminUser, managerUser, settings });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
