# ─── Backend Dockerfile ───────────────────────────────────────────────────────
# Multi-stage build pour minimiser la taille de l'image de production.
#
# TODO (Phase 7): Affiner les optimisations de sécurité (utilisateur non-root, etc.)

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/index.js"]
