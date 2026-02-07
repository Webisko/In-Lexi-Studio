const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Prisma 7 with separated config might require explicit URL in client if removed from schema
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./inlexistudio.db',
    },
  },
});

module.exports = prisma;
