/**
 * crypto.ts — AES-256-GCM encryption/decryption for VPN configs
 *
 * Chaque config VPN est chiffrée avant d'être envoyée au mobile.
 * Le mobile déchiffre avec la clé dérivée (Device ID + secret partagé).
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 12;   // 96 bits recommandé pour GCM
const TAG_LENGTH = 16;  // 128 bits auth tag

/** Dérive une clé 32 octets depuis la ENCRYPTION_KEY de l'env */
function deriveKey(): Buffer {
  return createHash("sha256").update(env.ENCRYPTION_KEY).digest();
}

/**
 * Chiffre une chaîne en AES-256-GCM.
 * Format de sortie : base64(iv + tag + ciphertext)
 */
export function encryptConfig(plaintext: string): string {
  const key = deriveKey();
  const iv  = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Concatène IV | AuthTag | Ciphertext
  const result = Buffer.concat([iv, tag, encrypted]);
  return result.toString("base64");
}

/**
 * Déchiffre une config AES-256-GCM (format produit par encryptConfig).
 */
export function decryptConfig(encryptedBase64: string): string {
  const key  = deriveKey();
  const data = Buffer.from(encryptedBase64, "base64");

  const iv         = data.subarray(0, IV_LENGTH);
  const tag        = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  return decipher.update(ciphertext) + decipher.final("utf8");
}

/** Utilitaire générique — omet des clés d'un objet */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const copy = { ...obj };
  for (const k of keys) delete copy[k];
  return copy;
}
