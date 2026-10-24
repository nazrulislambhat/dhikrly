import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { invalidateSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await invalidateSession(token);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: true });
  }
}
