import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db, hasDatabaseConfig } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = await rateLimiter.limit(`login:${ip}`, 10, 60); // 10 attempts per minute per IP
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!hasDatabaseConfig) {
      return NextResponse.json(
        { error: 'Database is not yet configured. Please configure DATABASE_URL.' },
        { status: 503 }
      );
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        accentColor: users.accentColor,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (result.length === 0 || !result[0].passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result[0];
    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create session and set cookie
    const { token, expiresAt } = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      expires: expiresAt,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.displayName,
          avatar_url: user.avatarUrl,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error while logging in' }, { status: 500 });
  }
}
