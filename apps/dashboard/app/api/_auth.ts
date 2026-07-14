import { NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sxbvpn.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'SxBvpn2026';

interface TokenPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export function makeToken(payload: Record<string, unknown>): string {
  const data = JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 86400000 });
  return Buffer.from(data).toString('base64url');
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as TokenPayload;
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

export function getAdminCreds() {
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}

export function adminUser() {
  return { id: 'admin-001', username: 'Admin SXB', email: ADMIN_EMAIL, role: 'ADMIN', status: 'ACTIVE' };
}

export function unauthorized() {
  return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
}

export function authFromRequest(request: Request): TokenPayload | null {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  return token ? verifyToken(token) : null;
}
