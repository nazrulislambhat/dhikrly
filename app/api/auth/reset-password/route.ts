import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, hasDatabaseConfig } from '@/db';
import { users } from '@/db/schema';
import { rateLimiter } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = await rateLimiter.limit(`reset:${ip}`, 5, 3600);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please wait an hour.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const email = body?.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Even if user not found, return success for privacy/anti-enumeration
    if (hasDatabaseConfig) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0) {
        // In production with email delivery (Resend/SendGrid/SMTP), dispatch reset email
        console.log(`[Auth] Password reset requested for ${normalizedEmail}`);
      }
    }

    return NextResponse.json({
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
  } catch (err) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { error: 'Internal server error processing password reset' },
      { status: 500 }
    );
  }
}
