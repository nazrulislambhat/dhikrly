import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { hasSupabaseConfig, supabaseAdmin } from '@/lib/supabase-admin';

interface ScheduledSubscription {
  id: string;
  subscription: {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  morning_enabled: boolean;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
  timezone: string;
  last_sent_morning: string | null;
  last_sent_evening: string | null;
}

function getLocalDateTime(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function isPushSubscription(value: ScheduledSubscription['subscription']) {
  return (
    typeof value?.endpoint === 'string' &&
    typeof value.keys?.p256dh === 'string' &&
    typeof value.keys.auth === 'string'
  );
}

function isWithinSendWindow(scheduledTime: string, localTime: string) {
  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  };
  const minutesAfterSchedule = toMinutes(localTime) - toMinutes(scheduledTime);
  return minutesAfterSchedule >= 0 && minutesAfterSchedule < 5;
}

function getPushStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return undefined;
  }
  return typeof error.statusCode === 'number' ? error.statusCode : undefined;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!hasSupabaseConfig) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: 'Push notification keys are not configured.' }, { status: 503 });
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL ?? 'mailto:hello@dhikrly.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  } catch (error) {
    console.error('Could not configure VAPID for scheduled notifications:', error);
    return NextResponse.json({ error: 'Push notification keys are invalid.' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select(
      'id, subscription, morning_enabled, morning_time, evening_enabled, evening_time, timezone, last_sent_morning, last_sent_evening',
    )
    .or('morning_enabled.eq.true,evening_enabled.eq.true')
    .limit(1000);

  if (error) {
    console.error('Could not load scheduled push subscriptions:', error.message);
    return NextResponse.json({ error: 'Could not load scheduled notifications.' }, { status: 500 });
  }

  const result = { sent: 0, failed: 0, expired: 0, skipped: 0 };
  const now = new Date();

  for (const row of (data ?? []) as ScheduledSubscription[]) {
    let local: ReturnType<typeof getLocalDateTime>;
    try {
      local = getLocalDateTime(now, row.timezone);
    } catch (error) {
      console.error(`Invalid timezone for push subscription ${row.id}:`, error);
      result.failed += 1;
      continue;
    }

    const due = [
      {
        period: 'morning' as const,
        enabled: row.morning_enabled,
        time: row.morning_time,
        lastSent: row.last_sent_morning,
        title: 'Morning Adhkār',
        body: 'Begin your day with remembrance and duʿā.',
      },
      {
        period: 'evening' as const,
        enabled: row.evening_enabled,
        time: row.evening_time,
        lastSent: row.last_sent_evening,
        title: 'Evening Adhkār',
        body: 'Take a moment for your evening remembrance and duʿā.',
      },
    ].filter(
      (schedule) =>
        schedule.enabled &&
        isWithinSendWindow(schedule.time, local.time) &&
        schedule.lastSent !== local.date,
    );

    if (due.length === 0) {
      result.skipped += 1;
      continue;
    }
    if (!isPushSubscription(row.subscription)) {
      result.failed += 1;
      console.error(`Invalid push subscription data for subscription ${row.id}.`);
      continue;
    }

    for (const schedule of due) {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          JSON.stringify({
            title: schedule.title,
            body: schedule.body,
            tag: `adhkar-${schedule.period}`,
            url: '/',
          }),
        );

        const column =
          schedule.period === 'morning' ? 'last_sent_morning' : 'last_sent_evening';
        const { error: updateError } = await supabaseAdmin
          .from('push_subscriptions')
          .update({ [column]: local.date })
          .eq('id', row.id);
        if (updateError) {
          console.error(`Could not record sent ${schedule.period} reminder:`, updateError.message);
          result.failed += 1;
        } else {
          result.sent += 1;
        }
      } catch (error) {
        if (getPushStatus(error) === 404 || getPushStatus(error) === 410) {
          const { error: deleteError } = await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('id', row.id);
          if (deleteError) {
            console.error('Could not remove expired push subscription:', deleteError.message);
          }
          result.expired += 1;
        } else {
          console.error(`Could not send ${schedule.period} reminder:`, error);
          result.failed += 1;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
