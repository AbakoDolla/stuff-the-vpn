import { NextRequest, NextResponse } from 'next/server';

// Backend runs on localhost:4000 on the same machine, or use VPS backend in production
// For production, we use relative paths to go through Next.js API routes (proxy)
const BACKEND_BASE = (
  process.env.NODE_ENV === 'production'
    ? 'https://vpnsxb.afrihall.com'
    : process.env.BACKEND_URL ?? 'http://localhost:4000'
).replace(/\/+$/, '');

export async function proxyToBackend(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    // Strip the /api prefix that Next.js routing adds
    const path = url.pathname.replace(/^\/api/, '') || '/';
    const backendUrl = `${BACKEND_BASE}${path}${url.search}`;

    const headers = new Headers();
    const auth = request.headers.get('authorization');
    if (auth) headers.set('authorization', auth);
    const ct = request.headers.get('content-type');
    if (ct) headers.set('content-type', ct);
    const xfor = request.headers.get('x-forwarded-for');
    if (xfor) headers.set('x-forwarded-for', xfor);
    const deviceName = request.headers.get('x-device-name');
    if (deviceName) headers.set('x-device-name', deviceName);

    const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const body = hasBody ? await request.text() : undefined;

    const res = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(20000),
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[proxy] Backend unreachable:', err);
    return NextResponse.json(
      { success: false, message: 'Backend inaccessible', error: String(err) },
      { status: 503 }
    );
  }
}
