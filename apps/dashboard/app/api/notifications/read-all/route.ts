import { proxyToBackend } from '../../../../_proxy';
import type { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function PATCH(req: NextRequest) { return proxyToBackend(req); }
