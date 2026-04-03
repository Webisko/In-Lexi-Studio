# Stage 1: Build frontend and admin assets
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY api ./api
COPY prisma ./prisma
COPY public ./public
COPY admin ./admin
COPY app.js ./app.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/admin/tailwind.generated.css ./admin/tailwind.generated.css

ENV DATABASE_URL=file:./inlexistudio.db
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

RUN npx prisma generate

CMD ["node", "app.js"]
