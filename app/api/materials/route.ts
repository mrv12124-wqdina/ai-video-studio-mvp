import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return NextResponse.json({ error: 'PEXELS_API_KEY is not configured', configured: false }, { status: 503 });

  const query = request.nextUrl.searchParams.get('q')?.trim();
  const type = request.nextUrl.searchParams.get('type') === 'photos' ? 'photos' : 'videos';
  const page = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1));
  if (!query) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  try {
    const response = await fetch(`https://api.pexels.com/${type}/search?query=${encodeURIComponent(query)}&per_page=12&page=${page}`, {
      headers: { Authorization: key },
      cache: 'no-store'
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: 'Pexels request failed', data }, { status: 502 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Pexels connection failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
