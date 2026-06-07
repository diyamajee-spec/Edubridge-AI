import { NextResponse } from 'next/server';
import { store, verifyPassword, makeToken } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Try real Python backend first
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.detail || errorData.error || 'Invalid credentials' },
          { status: 401 }
        );
      } catch { /* backend unreachable */ }
    }

    // Demo mode — shared globalThis store
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = store.users.get(email);
    if (!user || !verifyPassword(password, user.hashedPassword)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = makeToken(email, user.id);
    return NextResponse.json({
      access_token: token,
      refresh_token: token,
      token_type: 'bearer',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
