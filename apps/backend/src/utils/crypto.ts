import { randomBytes } from "crypto";
import { VOUCHER_CODE_LENGTH } from "../constants/index.js";

export function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(VOUCHER_CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj } as T;
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}
