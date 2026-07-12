import { proxyToBackend } from '../../../_proxy';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) { 
  return proxyToBackend(req); 
}
