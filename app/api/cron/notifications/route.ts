import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Configure VAPID
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Vercel Cron calls this every minute
// Protected by CRON_SECRET so only Vercel can call it
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = { sent: 0, failed: 0, skipped: 0 };

  try {
    // Fetch all active subscriptions
    const { data: subs, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .or('morning_enabled.eq.true,evening_enabled.eq.true');

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, ...results });
    }

    await Promise.all(
      subs.map(async (sub) => {
        const tz = sub.timezone ?? 'UTC';

        // Get current time in the subscriber's timezone
        const localTime = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now);

        const localDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(now); // "YYYY-MM-DD"

        const [localHH, localMM] = localTime.split(':');
        const localMinutes = parseInt(localHH) * 60 + parseInt(localMM);

        const shouldSend = (
          enabled: boolean,
          timeStr: string,
          lastSent: string | null
        ): boolean => {
          if (!enabled) return false;
          if (lastSent === localDateStr) return false; // already sent today
          const [h, m] = timeStr.split(':').map(Number);
          const targetMinutes = h * 60 + m;
          // Fire within a 1-minute window
          return localMinutes === targetMinutes;
        };

        const sendPush = async (label: string, session: 'morning' | 'evening') => {
          const payload = JSON.stringify({
            title: 'Daily Adhkār Reminder 🌙',
            body: `Time for your ${label} adhkār & du'ā`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `adhkar-${session}`,
            url: '/',
          });

          try {
            await webpush.sendNotification(
              sub.subscription as webpush.PushSubscription,
              payload
            );

            // Record sent date to avoid duplicates
            await supabaseAdmin
              .from('push_subscriptions')
              .update({
                [`last_sent_${session}`]: localDateStr,
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);

            results.sent++;
          } catch (err: unknown) {
            const pushErr = err as { statusCode?: number };
            if (pushErr?.statusCode === 410 || pushErr?.statusCode === 404) {
              // Subscription expired — remove it
              await supabaseAdmin
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);
            }
            results.failed++;
          }
        };

        if (shouldSend(sub.morning_enabled, sub.morning_time, sub.last_sent_morning)) {
          await sendPush('Morning', 'morning');
        } else if (shouldSend(sub.evening_enabled, sub.evening_time, sub.last_sent_evening)) {
          await sendPush('Evening', 'evening');
        } else {
          results.skipped++;
        }
      })
    );

    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
