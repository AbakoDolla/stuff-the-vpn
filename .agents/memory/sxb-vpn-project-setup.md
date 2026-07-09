---
name: SXB VPN project setup
description: How this Replit workspace relates to the real SXB VPN GitHub repo and VPS, for anyone continuing this work.
---

This workspace was originally bootstrapped from Replit's default pnpm-artifacts template, but the user's real product is an existing GitHub repo (`AbakoDolla/stuff-the-vpn`) with its own monorepo layout: `apps/backend` (Express + Prisma API), `apps/dashboard` (Next.js admin dashboard), `apps/mobile` (Flutter mobile app — the actively maintained one), plus a legacy/unused `mobile/` Flutter attempt at repo root and `lib/`, `packages/` shared code. The repo does NOT use Replit's `artifacts/` convention.

**Why:** The user asked to redesign the mobile app without breaking existing architecture, using only real backend data — this required importing the real repo instead of building fresh under the artifacts system (Flutter has no supported Replit artifact type / live preview).

**How to apply:** The Replit template scaffold (`artifacts/`, root `lib/`, `pnpm-workspace.yaml`, etc.) was removed and replaced with a real checkout of `origin/main` from the GitHub repo on a `sxb-vpn-redesign` branch (`git checkout -B sxb-vpn-redesign origin/main`), keeping `.replit`/`.replitignore` as untracked local-only files (listed in `.git/info/exclude`). Treat this workspace root as the real repo from now on — do not recreate `artifacts/*` or expect `createArtifact`/workflow-based preview to work for the mobile app. There is no Flutter build/preview available in this sandbox (only a very old Flutter 2.2.1 via `nix-shell -p flutter`, incompatible with the app's dependencies — cannot run `flutter analyze`/build here).

Production backend is deployed on a VPS via PM2 (not Docker) — process names `sxbvpn-backend` (port 4000) and `sxbvpn-dashboard` (port 3001), reverse-proxied by nginx at `https://vpnsxb.afrihall.com` (`/api` → :4000, `/` → :3001). Mobile app's `ApiEndpoints.baseUrl` already points there in release builds (`apps/mobile/lib/core/network/endpoints.dart`). Real mobile-facing API contract lives in `apps/backend/src/controllers/mobile.controller.ts` + `apps/backend/src/routes/mobile.routes.ts`, mounted at `/api/mobile/*`; notifications are a separate top-level `/api/notifications` route (JWT-protected, backed by a real `Notification` Prisma model).

GitHub and VPS credentials are stored as Replit secrets (`GITHUB_ACCESS_TOKEN`, `VPS_SSH_HOST`, `VPS_SSH_USER`, `VPS_SSH_PASSWORD`) — SSH access confirmed working via `sshpass -e ssh ...` (note: trim whitespace from secret values before use, one had a trailing space).
