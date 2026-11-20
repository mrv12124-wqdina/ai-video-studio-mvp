import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const key = process.env.VIDEO_API_KEY;
  const url = process.env.VIDEO_API_URL;
  if (!key || !url) {
    return NextResponse.json({ error: 'VIDEO_API_URL and VIDEO_API_KEY are not configured', configured: false }, { status: 503 });
  }

  const body = await request.json();
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

  const headerName = process.env.VIDEO_API_KEY_HEADER || 'Authorization';
  const prefix = process.env.VIDEO_API_KEY_PREFIX ?? 'Bearer ';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [headerName]: `${prefix}${key}` },
      body: JSON.stringify({
        prompt,
        aspect_ratio: body.aspect_ratio || '16:9',
        duration: Math.min(20, Math.max(1, Number(body.duration) || 5)),
        reference_images: body.reference_images || []
      }),
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: 'Video provider rejected the request', status: response.status, data }, { status: 502 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Video provider connection failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
