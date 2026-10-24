import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
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
        dailyDhikrGoal: user.dailyDhikrGoal,
        user_metadata: {
          full_name: user.displayName,
          avatar_url: user.avatarUrl,
        },
      },
    });
  } catch (err) {
    console.error('Auth verification error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
