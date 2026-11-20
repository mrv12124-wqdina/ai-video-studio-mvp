import { NextRequest, NextResponse } from 'next/server';
import { getComfyBaseUrl } from '@/lib/comfy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('filename') || '';
  const subfolder = request.nextUrl.searchParams.get('subfolder') || '';
  const type = request.nextUrl.searchParams.get('type') || 'output';
  const safePart = (part: string) => part.length <= 180 && !part.includes('..') && !/[\\\u0000-\u001f]/.test(part);
  if (!safePart(filename) || !safePart(subfolder) || !['output', 'temp'].includes(type)) return NextResponse.json({ error: 'Invalid output path' }, { status: 400 });
  const target = new URL(`${getComfyBaseUrl()}/view`);
  target.searchParams.set('filename', filename);
  target.searchParams.set('subfolder', subfolder);
  target.searchParams.set('type', type);
  try {
    const upstream = await fetch(target, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'ComfyUI output is not available' }, { status: 502 });
    return new NextResponse(upstream.body, { headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json({ error: 'Could not load generated output from ComfyUI' }, { status: 502 });
  }
}
