import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { eq, and, gt } from 'drizzle-orm';
import { db, hasDatabaseConfig } from '@/db';
import { sessions, users } from '@/db/schema';

export const SESSION_COOKIE_NAME = 'dhikrly_session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  timezone: string | null;
  city: string | null;
  country: string | null;
  calculationMethod: string | null;
  madhhab: string | null;
  niyyah: string | null;
  hijriOffset: number | null;
  dailyDhikrGoal: number | null;
  createdAt: Date;
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new session in the database
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  if (hasDatabaseConfig) {
    try {
      await db.insert(sessions).values({
        id: token,
        userId,
        expiresAt,
      });
    } catch (err) {
      console.error('Failed to persist session:', err);
    }
  }

  return { token, expiresAt };
}

/**
 * Validate a session token against the database and return the associated user
 */
export async function validateSessionToken(token: string): Promise<AuthUser | null> {
  if (!hasDatabaseConfig || !token) return null;

  try {
    const now = new Date();
    const result = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { user } = result[0];
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      accentColor: user.accentColor,
      timezone: user.timezone,
      city: user.city,
      country: user.country,
      calculationMethod: user.calculationMethod,
      madhhab: user.madhhab,
      niyyah: user.niyyah,
      hijriOffset: user.hijriOffset,
      dailyDhikrGoal: user.dailyDhikrGoal,
      createdAt: user.createdAt,
    };
  } catch (err) {
    console.error('Session validation error:', err);
    return null;
  }
}

/**
 * Invalidate a session token
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!hasDatabaseConfig || !token) return;

  try {
    await db.delete(sessions).where(eq(sessions.id, token));
  } catch (err) {
    console.error('Failed to invalidate session:', err);
  }
}

/**
 * Get the currently authenticated user from incoming request cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) return null;

    return await validateSessionToken(sessionToken);
  } catch {
    return null;
  }
}
