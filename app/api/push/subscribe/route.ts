import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subscription,   // PushSubscription JSON from browser
      userId,         // null if not logged in
      deviceId,       // anonymous identifier
      morningEnabled,
      morningTime,
      eveningEnabled,
      eveningTime,
      timezone,
    } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert based on subscription endpoint (unique per browser/device)
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId ?? null,
          device_id: deviceId ?? null,
          subscription,
          morning_enabled: morningEnabled ?? false,
          morning_time: morningTime ?? '06:00',
          evening_enabled: eveningEnabled ?? false,
          evening_time: eveningTime ?? '18:00',
          timezone: timezone ?? 'UTC',
          updated_at: new Date().toISOString(),
        },
        {
          // Match on the endpoint URL inside the subscription JSON
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Push subscribe error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
