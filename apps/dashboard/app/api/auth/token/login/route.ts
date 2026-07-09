import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token requis' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vpnsxb.afrihall.com';
    const response = await fetch(`${backendUrl}/api/auth/token/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Token invalide' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      data: data.data,
    });
  } catch (error) {
    console.error('Token login error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
