import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../_proxy';

export async function GET(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  return proxyToBackend(request);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  return proxyToBackend(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  return proxyToBackend(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  return proxyToBackend(request);
}
