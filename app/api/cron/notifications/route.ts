import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { hasSupabaseConfig, supabaseAdmin } from '@/lib/supabase-admin';

interface ScheduledSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  timezone: string;
  lastSentMorning: string | null;
  lastSentEvening: string | null;
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

  const hasDb = Boolean(process.env.DATABASE_URL);
  if (!hasDb && !hasSupabaseConfig) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
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

  const result = { sent: 0, failed: 0, expired: 0, skipped: 0 };
  const now = new Date();

  // 1. Neon Drizzle Primary Scheduler
  if (hasDb) {
    try {
      const rows = await db
        .select({
          id: pushSubscriptions.id,
          endpoint: pushSubscriptions.endpoint,
          p256dh: pushSubscriptions.p256dh,
          auth: pushSubscriptions.auth,
          morningEnabled: pushSubscriptions.morningEnabled,
          morningTime: pushSubscriptions.morningTime,
          eveningEnabled: pushSubscriptions.eveningEnabled,
          eveningTime: pushSubscriptions.eveningTime,
          timezone: pushSubscriptions.timezone,
          lastSentMorning: pushSubscriptions.lastSentMorning,
          lastSentEvening: pushSubscriptions.lastSentEvening,
        })
        .from(pushSubscriptions)
        .where(
          or(
            eq(pushSubscriptions.morningEnabled, true),
            eq(pushSubscriptions.eveningEnabled, true)
          )
        )
        .limit(1000);

      for (const row of rows) {
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
            enabled: row.morningEnabled,
            time: row.morningTime,
            lastSent: row.lastSentMorning,
            title: 'Morning Adhkār & Du’ā 🌅',
            body: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ · Begin your day in the protective light of Allah’s remembrance.',
            tag: 'dhikrly-morning',
            url: '/?session=morning',
          },
          {
            period: 'evening' as const,
            enabled: row.eveningEnabled,
            time: row.eveningTime,
            lastSent: row.lastSentEvening,
            title: 'Evening Adhkār & Du’ā 🌙',
            body: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ · Bring peace to your evening with sincere adhkār and gratitude.',
            tag: 'dhikrly-evening',
            url: '/?session=evening',
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

        const pushSub: webpush.PushSubscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        };

        for (const schedule of due) {
          try {
            await webpush.sendNotification(
              pushSub,
              JSON.stringify({
                title: schedule.title,
                body: schedule.body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: schedule.tag,
                url: schedule.url,
                actions: [
                  { action: 'open_app', title: 'Open Adhkār 🤲' },
                  { action: 'open_quran', title: 'Read Qur’an 📖' },
                ],
              }),
            );

            if (schedule.period === 'morning') {
              await db
                .update(pushSubscriptions)
                .set({ lastSentMorning: local.date, updatedAt: new Date() })
                .where(eq(pushSubscriptions.id, row.id));
            } else {
              await db
                .update(pushSubscriptions)
                .set({ lastSentEvening: local.date, updatedAt: new Date() })
                .where(eq(pushSubscriptions.id, row.id));
            }
            result.sent += 1;
          } catch (error) {
            if (getPushStatus(error) === 404 || getPushStatus(error) === 410) {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
              result.expired += 1;
            } else {
              console.error(`Could not send ${schedule.period} reminder:`, error);
              result.failed += 1;
            }
          }
        }
      }

      return NextResponse.json({ ok: true, engine: 'neon-drizzle', ...result });
    } catch (neonErr) {
      console.error('Neon cron query failed, attempting Supabase fallback if configured:', neonErr);
    }
  }

  // 2. Supabase Fallback Scheduler
  if (hasSupabaseConfig) {
    const { data, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select(
        'id, subscription, morning_enabled, morning_time, evening_enabled, evening_time, timezone, last_sent_morning, last_sent_evening',
      )
      .or('morning_enabled.eq.true,evening_enabled.eq.true')
      .limit(1000);

    if (error) {
      console.error('Could not load scheduled push subscriptions from Supabase:', error.message);
      return NextResponse.json({ error: 'Could not load scheduled notifications.' }, { status: 500 });
    }

    for (const row of (data ?? []) as any[]) {
      let local: ReturnType<typeof getLocalDateTime>;
      try {
        local = getLocalDateTime(now, row.timezone);
      } catch (error) {
        result.failed += 1;
        continue;
      }

      const due = [
        {
          period: 'morning' as const,
          enabled: row.morning_enabled,
          time: row.morning_time,
          lastSent: row.last_sent_morning,
          title: 'Morning Adhkār & Du’ā 🌅',
          body: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ · Begin your day in the protective light of Allah’s remembrance.',
          tag: 'dhikrly-morning',
          url: '/?session=morning',
        },
        {
          period: 'evening' as const,
          enabled: row.evening_enabled,
          time: row.evening_time,
          lastSent: row.last_sent_evening,
          title: 'Evening Adhkār & Du’ā 🌙',
          body: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ · Bring peace to your evening with sincere adhkār and gratitude.',
          tag: 'dhikrly-evening',
          url: '/?session=evening',
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

      for (const schedule of due) {
        try {
          await webpush.sendNotification(
            row.subscription as webpush.PushSubscription,
            JSON.stringify({
              title: schedule.title,
              body: schedule.body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: schedule.tag,
              url: schedule.url,
            }),
          );

          const column =
            schedule.period === 'morning' ? 'last_sent_morning' : 'last_sent_evening';
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ [column]: local.date })
            .eq('id', row.id);
          result.sent += 1;
        } catch (error) {
          if (getPushStatus(error) === 404 || getPushStatus(error) === 410) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', row.id);
            result.expired += 1;
          } else {
            result.failed += 1;
          }
        }
      }
    }

    return NextResponse.json({ ok: true, engine: 'supabase', ...result });
  }

  return NextResponse.json({ ok: true, ...result });
}
