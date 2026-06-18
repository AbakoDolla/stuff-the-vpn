# Backend Dockerfile — monorepo-aware build
  # Builds from workspace root to resolve @workspace/* packages

  FROM node:20-alpine AS base
  RUN corepack enable && corepack prepare pnpm@9 --activate

  FROM base AS deps
  WORKDIR /app
  COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
  COPY tsconfig.base.json tsconfig.json ./
  COPY lib/ ./lib/
  COPY apps/backend/package.json ./apps/backend/
  COPY packages/ ./packages/
  RUN pnpm install --frozen-lockfile

  FROM deps AS builder
  COPY apps/backend/ ./apps/backend/
  RUN pnpm run typecheck:libs
  RUN pnpm --filter @workspace/api-server exec npx prisma generate
  RUN pnpm --filter @workspace/api-server run build

  FROM node:20-alpine AS production
  WORKDIR /app
  ENV NODE_ENV=production
  RUN corepack enable && corepack prepare pnpm@9 --activate
  COPY --from=builder /app/apps/backend/dist ./dist
  COPY --from=builder /app/apps/backend/node_modules ./node_modules
  COPY --from=builder /app/apps/backend/package.json ./package.json
  COPY --from=builder /app/apps/backend/prisma ./prisma
  EXPOSE 5000
  CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
  