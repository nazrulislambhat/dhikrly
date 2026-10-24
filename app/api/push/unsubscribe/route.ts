import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hasSupabaseConfig, supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  let body: { endpoint?: unknown };
  try {
    body = (await request.json()) as { endpoint?: unknown };
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'A valid push endpoint is required.' }, { status: 400 });
  }

  // 1. Neon Drizzle Path
  if (process.env.DATABASE_URL) {
    try {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint));
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.warn('Could not delete push subscription from Neon DB, falling back:', err);
    }
  }

  // 2. Supabase Fallback Path
  if (hasSupabaseConfig) {
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .filter('subscription->>endpoint', 'eq', body.endpoint);

    if (error) {
      const isMissing =
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist');

      if (!isMissing) {
        console.error('Could not remove push subscription from Supabase:', error.message);
        return NextResponse.json({ error: 'Could not remove notification settings.' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
