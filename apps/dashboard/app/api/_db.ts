import { createServerClient } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export function getDb() {
  return createServerClient();
}

export function noDb() {
  return NextResponse.json({ success: false, message: 'Database non configurée. Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel.' }, { status: 503 });
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function paginate(items: unknown[], total: number, page: number, limit: number) {
  return ok({ items, total, page, limit, pages: Math.ceil(total / limit) });
}
