/**
 * @stuff-the-vpn/shared
 * Constantes et utilitaires communs.
 *
 * TODO (Phase 3): Compléter au fur et à mesure du développement.
 */

// ─── Constantes ──────────────────────────────────────────────────────────────
export const APP_NAME = 'Stuff The VPN';
export const APP_VERSION = '1.0.0';

export const DEFAULT_QUOTA = {
  bandwidthMb: 10240,   // 10 GB
  durationDays: 30,
  maxDevices: 3,
  protocol: 'both' as const,
};

export const VOUCHER_CODE_LENGTH = 16;
export const VOUCHER_CODE_PREFIX = 'STV';

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/** Formate un nombre de bytes en unité lisible (MB, GB, TB). */
export function formatBytes(bytes: number): string {
  // TODO (Phase 3): Implémenter
  return `${bytes} B`;
}

/** Génère un code voucher aléatoire. */
export function generateVoucherCode(): string {
  // TODO (Phase 3): Implémenter avec crypto
  return `${VOUCHER_CODE_PREFIX}-PLACEHOLDER`;
}

/** Vérifie si un voucher est expiré. */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
