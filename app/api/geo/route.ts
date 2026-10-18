import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const countryHeader =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-country-code') ||
    '';

  const country = countryHeader.trim().toUpperCase();
  const isIndia = country === 'IN';

  return NextResponse.json(
    {
      country,
      isIndia,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    }
  );
}
