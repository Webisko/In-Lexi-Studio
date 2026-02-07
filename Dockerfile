# Stage 1: Build Frontend (Astro)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Server (Node.js)
FROM node:22-alpine
WORKDIR /app

# Install production deps for backend
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY api ./api
COPY prisma ./prisma

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy admin panel
COPY admin ./admin

# Setup SQLite (ensure database file exists or is created)
# Note: In production, you likely mount a volume for /app/prisma/fotograf.db
ENV DATABASE_URL="file:./inlexistudio.db"
ENV NODE_ENV=production
ENV PORT=80

# Expose port
EXPOSE 80

# Prisma Generate & Seed (optional, handled via entrypoint usually)
RUN npx prisma generate

# Startup command
CMD ["node", "api/server.js"]
