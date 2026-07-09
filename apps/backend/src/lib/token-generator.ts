/**
 * SXB VPN - Token Generator
 * 
 * Génère des tokens cryptographiques pour l'activation des appareils.
 * Format: base64(deviceId.timestamp.signature)
 * 
 * La signature HMAC-SHA256 garantit que:
 * - Le token ne peut être généré que par le serveur
 * - Le token est lié à un deviceId spécifique
 * - Le token expire après TOKEN_VALIDITY_MS
 */

import * as crypto from "crypto";
import { env } from "../config/env.js";

export interface TokenData {
  token: string;
  deviceId: string;
  timestamp: bigint;
  expiresAt: Date;
  signature: string;
}

export interface VerifiedToken {
  valid: boolean;
  deviceId?: string;
  timestamp?: bigint;
  error?: string;
}

/**
 * Génère un token cryptographique pour un appareil
 */
export function generateActivationToken(deviceId: string): TokenData {
  const timestamp = BigInt(Date.now());
  const expiresAt = new Date(Number(timestamp) + env.TOKEN_VALIDITY_MS);
  
  // Données à signer: deviceId.timestamp
  const data = `${deviceId}.${timestamp}`;
  
  // Signature HMAC-SHA256
  const hmac = crypto.createHmac("sha256", env.SERVER_SECRET);
  hmac.update(data);
  const signature = hmac.digest("base64url");
  
  // Token complet: base64(deviceId.timestamp.signature)
  const tokenPayload = Buffer.from(`${data}.${signature}`).toString("base64url");
  
  return {
    token: tokenPayload,
    deviceId,
    timestamp,
    expiresAt,
    signature,
  };
}

/**
 * Vérifie un token et valide son contenu
 */
export function verifyActivationToken(token: string, expectedDeviceId?: string): VerifiedToken {
  try {
    // Décoder le token
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(".");
    
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }
    
    const [tokenDeviceId, timestampStr, providedSignature] = parts;
    const timestamp = BigInt(timestampStr);
    const now = Date.now();
    
    // 1. Vérifier l'expiration
    if (now > Number(timestamp) + env.TOKEN_VALIDITY_MS) {
      return { valid: false, error: "Token expired" };
    }
    
    // 2. Vérifier deviceId si fourni
    if (expectedDeviceId && tokenDeviceId !== expectedDeviceId) {
      return { valid: false, error: "Device ID mismatch" };
    }
    
    // 3. Vérifier la signature
    const data = `${tokenDeviceId}.${timestampStr}`;
    const hmac = crypto.createHmac("sha256", env.SERVER_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("base64url");
    
    if (providedSignature !== expectedSignature) {
      return { valid: false, error: "Invalid signature" };
    }
    
    return {
      valid: true,
      deviceId: tokenDeviceId,
      timestamp,
    };
  } catch {
    return { valid: false, error: "Token verification failed" };
  }
}

/**
 * Parse un token sans vérifier la signature (pour affichage)
 */
export function parseToken(token: string): { deviceId: string; timestamp: bigint; expiresAt: Date } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [deviceId, timestampStr] = decoded.split(".");
    const timestamp = BigInt(timestampStr);
    const expiresAt = new Date(Number(timestamp) + env.TOKEN_VALIDITY_MS);
    return { deviceId, timestamp, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Génère un identifiant unique pour l'appareil
 */
export function generateDeviceId(): string {
  return crypto.randomUUID();
}
