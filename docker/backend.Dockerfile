# ── Stage 1: deps ────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
# On cible spécifiquement le package.json du backend
COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm install

# ── Stage 2: build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm install
# On copie tout le contenu de apps/backend dans le répertoire /app du conteneur
COPY apps/backend/ ./
RUN npx prisma generate
RUN node ./build.mjs

# ── Stage 3: production ──────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nodeuser \
 && chown -R nodeuser:nodejs /app
USER nodeuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/healthz || exit 1
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
