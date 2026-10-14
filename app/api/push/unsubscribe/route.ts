import { NextResponse } from 'next/server';
import { hasSupabaseConfig, supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  if (!hasSupabaseConfig) {
    return NextResponse.json(
      { error: 'Push scheduling is unavailable until Supabase is configured.' },
      { status: 503 },
    );
  }

  let body: { endpoint?: unknown };
  try {
    body = (await request.json()) as { endpoint?: unknown };
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) {
    return NextResponse.json({ error: 'A valid push endpoint is required.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .filter('subscription->>endpoint', 'eq', body.endpoint);
  if (error) {
    console.error('Could not remove push subscription:', error.message);
    return NextResponse.json({ error: 'Could not remove notification settings.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
