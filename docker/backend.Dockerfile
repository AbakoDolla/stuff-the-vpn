# Backend Dockerfile — standalone npm build (no monorepo context needed)
  FROM node:20-alpine AS base

  FROM base AS deps
  WORKDIR /app
  COPY package.json package-lock.json* ./
  RUN npm ci

  FROM deps AS builder
  WORKDIR /app
  COPY . .
  RUN npx prisma generate
  RUN node ./build.mjs

  FROM node:20-alpine AS production
  WORKDIR /app
  ENV NODE_ENV=production

  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/package.json ./package.json
  COPY --from=builder /app/prisma ./prisma

  RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser
  USER nodeuser

  EXPOSE 5000
  CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
  