# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
COPY apps/backend/package.json ./
RUN npm install

COPY apps/backend/ ./
RUN npx prisma generate
RUN node ./build.mjs

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:22-alpine AS production
RUN apk add --no-cache openssl libc6-compat postgresql-client

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeuser \
 && chown -R nodeuser:nodejs /app

COPY --chown=nodeuser:nodejs apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nodeuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/healthz || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
