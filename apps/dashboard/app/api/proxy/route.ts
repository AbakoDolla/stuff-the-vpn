import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, method = 'POST', body: requestBody, ...rest } = body;
    
    if (!path) {
      return NextResponse.json({ success: false, message: 'Path required' }, { status: 400 });
    }
    
    const url = `${API_URL}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    
    // Add auth token if available
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });
    
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Proxy error' }, { status: 500 });
  }
}
