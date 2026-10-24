import { NextResponse } from 'next/server';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { db, hasDatabaseConfig } from '@/db';
import {
  adhkarCompletions,
  customDuas,
  salahLogs,
  qadaBalances,
  qadaHistory,
  quranProgress,
  quranBookmarks,
  tasbihSessions,
  userStreaks,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/redis';

// ── GET /api/v1/sync (Full Remote State Pull) ─────────────────────────
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasDatabaseConfig) {
      return NextResponse.json(
        { error: 'Database is not yet configured' },
        { status: 503 }
      );
    }

    // 1. Fetch Adhkār completions
    const adhkarRows = await db
      .select({
        date: adhkarCompletions.date,
        duaId: adhkarCompletions.duaId,
      })
      .from(adhkarCompletions)
      .where(eq(adhkarCompletions.userId, user.id));

    const checkedByDate: Record<string, Record<string, boolean>> = {};
    for (const row of adhkarRows) {
      if (!checkedByDate[row.date]) checkedByDate[row.date] = {};
      checkedByDate[row.date][row.duaId] = true;
    }

    // 2. Fetch Custom Du‘ās
    const userCustomDuas = await db
      .select()
      .from(customDuas)
      .where(eq(customDuas.userId, user.id));

    // 3. Fetch Ṣalāh logs
    const userSalahLogs = await db
      .select()
      .from(salahLogs)
      .where(eq(salahLogs.userId, user.id));

    const salahByDate: Record<string, Record<string, { status: string; isCongregation: boolean }>> = {};
    for (const row of userSalahLogs) {
      if (!salahByDate[row.date]) salahByDate[row.date] = {};
      salahByDate[row.date][row.prayer] = {
        status: row.status,
        isCongregation: row.isCongregation,
      };
    }

    // 4. Fetch Qadā Balances
    const [qadaBalance] = await db
      .select()
      .from(qadaBalances)
      .where(eq(qadaBalances.userId, user.id))
      .limit(1);

    // 5. Fetch Qur’an Progress & Bookmarks
    const [progress] = await db
      .select()
      .from(quranProgress)
      .where(eq(quranProgress.userId, user.id))
      .limit(1);

    const bookmarks = await db
      .select()
      .from(quranBookmarks)
      .where(eq(quranBookmarks.userId, user.id));

    // 6. Fetch Streaks
    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      serverTime: Date.now(),
      data: {
        adhkar: checkedByDate,
        customDuas: userCustomDuas.map((d) => ({
          id: d.clientDuaId,
          title: d.title,
          arabic: d.arabic,
          transliteration: d.transliteration,
          translation: d.translation,
          repeat: d.repeatCount,
          category: d.category,
        })),
        salah: salahByDate,
        qada: qadaBalance || {
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0,
          witr: 0,
        },
        quran: {
          progress: progress || { surah: 1, ayah: 1, page: 1, juz: 1 },
          bookmarks: bookmarks.map((b) => ({
            surah: b.surah,
            ayah: b.ayah,
            note: b.note,
          })),
        },
        streak: streak
          ? {
              current: streak.currentStreak,
              best: streak.longestStreak,
              lastComplete: streak.lastCompletedDate,
            }
          : { current: 0, best: 0, lastComplete: null },
      },
    });
  } catch (err) {
    console.error('Sync GET error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve sync state' },
      { status: 500 }
    );
  }
}

// ── POST /api/v1/sync (Batched Mutation Ingestion) ────────────────────
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasDatabaseConfig) {
      return NextResponse.json(
        { error: 'Database is not yet configured' },
        { status: 503 }
      );
    }

    // Rate-limit sync: max 60 sync operations per minute per user
    const rateCheck = await rateLimiter.limit(`sync:${user.id}`, 60, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Sync rate limit exceeded. Backing off.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const mutations = body.mutations || {};

    // 1. Process Adhkār Completions
    if (Array.isArray(mutations.adhkar)) {
      for (const item of mutations.adhkar) {
        if (!item.date || !item.duaId) continue;
        if (item.completed) {
          await db
            .insert(adhkarCompletions)
            .values({
              userId: user.id,
              date: item.date,
              duaId: item.duaId,
              completedAt: new Date(item.timestamp || Date.now()),
              deviceId: body.deviceId || null,
            })
            .onConflictDoUpdate({
              target: [adhkarCompletions.userId, adhkarCompletions.date, adhkarCompletions.duaId],
              set: {
                completedAt: new Date(item.timestamp || Date.now()),
              },
            });
        } else {
          await db
            .delete(adhkarCompletions)
            .where(
              and(
                eq(adhkarCompletions.userId, user.id),
                eq(adhkarCompletions.date, item.date),
                eq(adhkarCompletions.duaId, item.duaId)
              )
            );
        }
      }
    }

    // 2. Process Ṣalāh Logs
    if (Array.isArray(mutations.salah)) {
      for (const log of mutations.salah) {
        if (!log.date || !log.prayer || !log.status) continue;
        await db
          .insert(salahLogs)
          .values({
            userId: user.id,
            date: log.date,
            prayer: log.prayer,
            status: log.status,
            isCongregation: Boolean(log.isCongregation),
            loggedAt: new Date(log.timestamp || Date.now()),
          })
          .onConflictDoUpdate({
            target: [salahLogs.userId, salahLogs.date, salahLogs.prayer],
            set: {
              status: log.status,
              isCongregation: Boolean(log.isCongregation),
              loggedAt: new Date(log.timestamp || Date.now()),
            },
          });
      }
    }

    // 3. Process Qadā Balances & History
    if (mutations.qada) {
      if (mutations.qada.balances) {
        const b = mutations.qada.balances;
        await db
          .insert(qadaBalances)
          .values({
            userId: user.id,
            fajr: b.fajr ?? 0,
            dhuhr: b.dhuhr ?? 0,
            asr: b.asr ?? 0,
            maghrib: b.maghrib ?? 0,
            isha: b.isha ?? 0,
            witr: b.witr ?? 0,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [qadaBalances.userId],
            set: {
              fajr: b.fajr ?? 0,
              dhuhr: b.dhuhr ?? 0,
              asr: b.asr ?? 0,
              maghrib: b.maghrib ?? 0,
              isha: b.isha ?? 0,
              witr: b.witr ?? 0,
              updatedAt: new Date(),
            },
          });
      }

      if (Array.isArray(mutations.qada.repayments)) {
        for (const rep of mutations.qada.repayments) {
          if (!rep.prayer) continue;
          await db.insert(qadaHistory).values({
            userId: user.id,
            prayer: rep.prayer,
            count: rep.count || 1,
            repaidAt: new Date(rep.timestamp || Date.now()),
          });
        }
      }
    }

    // 4. Process Qur’an Progress & Bookmarks
    if (mutations.quran) {
      if (mutations.quran.progress) {
        const p = mutations.quran.progress;
        await db
          .insert(quranProgress)
          .values({
            userId: user.id,
            surah: p.surah,
            ayah: p.ayah,
            page: p.page || 1,
            juz: p.juz || 1,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [quranProgress.userId],
            set: {
              surah: p.surah,
              ayah: p.ayah,
              page: p.page || 1,
              juz: p.juz || 1,
              updatedAt: new Date(),
            },
          });
      }

      if (Array.isArray(mutations.quran.bookmarks)) {
        for (const bm of mutations.quran.bookmarks) {
          if (!bm.surah || !bm.ayah) continue;
          if (bm.isDeleted) {
            await db
              .delete(quranBookmarks)
              .where(
                and(
                  eq(quranBookmarks.userId, user.id),
                  eq(quranBookmarks.surah, bm.surah),
                  eq(quranBookmarks.ayah, bm.ayah)
                )
              );
          } else {
            await db
              .insert(quranBookmarks)
              .values({
                userId: user.id,
                surah: bm.surah,
                ayah: bm.ayah,
                note: bm.note || null,
              })
              .onConflictDoUpdate({
                target: [quranBookmarks.userId, quranBookmarks.surah, quranBookmarks.ayah],
                set: { note: bm.note || null },
              });
          }
        }
      }
    }

    // 5. Process Tasbīḥ Sessions
    if (Array.isArray(mutations.tasbih)) {
      for (const item of mutations.tasbih) {
        if (!item.dhikrKey || typeof item.count !== 'number') continue;
        await db.insert(tasbihSessions).values({
          userId: user.id,
          dhikrKey: item.dhikrKey,
          count: item.count,
          target: item.target || 33,
          completedAt: new Date(item.timestamp || Date.now()),
        });
      }
    }

    // 6. Process Streak
    if (mutations.streak) {
      const s = mutations.streak;
      await db
        .insert(userStreaks)
        .values({
          userId: user.id,
          currentStreak: s.currentStreak || 0,
          longestStreak: s.longestStreak || 0,
          lastCompletedDate: s.lastCompletedDate || null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userStreaks.userId],
          set: {
            currentStreak: s.currentStreak || 0,
            longestStreak: s.longestStreak || 0,
            lastCompletedDate: s.lastCompletedDate || null,
            updatedAt: new Date(),
          },
        });
    }

    // 7. Process Custom Du‘ās
    if (Array.isArray(mutations.customDuas)) {
      for (const d of mutations.customDuas) {
        if (!d.clientDuaId || !d.title) continue;
        if (d.isDeleted) {
          await db
            .delete(customDuas)
            .where(
              and(eq(customDuas.userId, user.id), eq(customDuas.clientDuaId, d.clientDuaId))
            );
        } else {
          await db
            .insert(customDuas)
            .values({
              userId: user.id,
              clientDuaId: d.clientDuaId,
              title: d.title,
              arabic: d.arabic || null,
              transliteration: d.transliteration || null,
              translation: d.translation || null,
              repeatCount: d.repeatCount || 1,
              category: d.category || 'custom',
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [customDuas.userId, customDuas.clientDuaId],
              set: {
                title: d.title,
                arabic: d.arabic || null,
                transliteration: d.transliteration || null,
                translation: d.translation || null,
                repeatCount: d.repeatCount || 1,
                category: d.category || 'custom',
                updatedAt: new Date(),
              },
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: Date.now(),
    });
  } catch (err) {
    console.error('Sync POST ingestion error:', err);
    return NextResponse.json(
      { error: 'Internal server error processing batched sync' },
      { status: 500 }
    );
  }
}
