FROM node:22-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ── Build ─────────────────────────────────────────────────────────
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production ────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sxbvpn

COPY --from=builder --chown=sxbvpn:nodejs /app/dist ./dist
COPY --from=builder --chown=sxbvpn:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sxbvpn:nodejs /app/prisma ./prisma
COPY --from=builder --chown=sxbvpn:nodejs /app/package.json ./package.json

USER sxbvpn
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.mjs"]
