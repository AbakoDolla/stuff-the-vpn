import { proxyToBackend } from '../../../_proxy';
import type { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) { return proxyToBackend(req); }
export async function POST(req: NextRequest) { return proxyToBackend(req); }
export async function DELETE(req: NextRequest) { return proxyToBackend(req); }
