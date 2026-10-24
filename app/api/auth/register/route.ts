import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db, hasDatabaseConfig } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = await rateLimiter.limit(`register:${ip}`, 10, 3600); // 10 registrations per hour per IP
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password, displayName } = body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!hasDatabaseConfig) {
      return NextResponse.json(
        { error: 'Database is not yet configured. Please configure DATABASE_URL.' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password and insert user
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        displayName: displayName?.trim() || normalizedEmail.split('@')[0],
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        accentColor: users.accentColor,
        createdAt: users.createdAt,
      });

    // Create session and set HTTP-only cookie
    const { token, expiresAt } = await createSession(newUser.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      expires: expiresAt,
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: {
            full_name: newUser.displayName,
            avatar_url: newUser.avatarUrl,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'Internal server error while creating account' },
      { status: 500 }
    );
  }
}
