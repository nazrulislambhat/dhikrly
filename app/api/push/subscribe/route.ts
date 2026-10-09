import { NextResponse } from 'next/server';
import { hasSupabaseConfig, supabaseAdmin } from '@/lib/supabase-admin';
import type { NotifSettings } from '@/types';

interface SubscribePayload {
  subscription?: {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  userId?: unknown;
  deviceId?: unknown;
  morningEnabled?: unknown;
  morningTime?: unknown;
  eveningEnabled?: unknown;
  eveningTime?: unknown;
  timezone?: unknown;
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig) {
    return NextResponse.json(
      { error: 'Push scheduling is unavailable until Supabase is configured.' },
      { status: 503 },
    );
  }

  let body: SubscribePayload;
  try {
    body = (await request.json()) as SubscribePayload;
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const endpoint = body.subscription?.endpoint;
  const keys = body.subscription?.keys;
  const deviceId = body.deviceId;
  const settings: NotifSettings = {
    morningEnabled: body.morningEnabled === true,
    morningTime: typeof body.morningTime === 'string' ? body.morningTime : '',
    eveningEnabled: body.eveningEnabled === true,
    eveningTime: typeof body.eveningTime === 'string' ? body.eveningTime : '',
  };
  const timezone = body.timezone;

  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    typeof keys?.p256dh !== 'string' ||
    typeof keys.auth !== 'string'
  ) {
    return NextResponse.json({ error: 'A valid push subscription is required.' }, { status: 400 });
  }
  if (
    typeof deviceId !== 'string' ||
    deviceId.length < 8 ||
    deviceId.length > 128 ||
    !validTimezone(timezone) ||
    !validTime(settings.morningTime) ||
    !validTime(settings.eveningTime)
  ) {
    return NextResponse.json({ error: 'Invalid device or reminder settings.' }, { status: 400 });
  }

  const userId =
    typeof body.userId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.userId)
      ? body.userId
      : null;

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id')
    .eq('device_id', deviceId)
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error('Could not find existing push subscription:', lookupError.message);
    return NextResponse.json({ error: 'Could not save notification settings.' }, { status: 500 });
  }

  const subscription = {
    user_id: userId,
    device_id: deviceId,
    subscription: body.subscription,
    morning_enabled: settings.morningEnabled,
    morning_time: settings.morningTime,
    evening_enabled: settings.eveningEnabled,
    evening_time: settings.eveningTime,
    timezone,
  };
  const result = existing
    ? await supabaseAdmin
        .from('push_subscriptions')
        .update(subscription)
        .eq('id', existing.id)
    : await supabaseAdmin.from('push_subscriptions').insert(subscription);

  if (result.error) {
    console.error('Could not save push subscription:', result.error.message);
    return NextResponse.json({ error: 'Could not save notification settings.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
