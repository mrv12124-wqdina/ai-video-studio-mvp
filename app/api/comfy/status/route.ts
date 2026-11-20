import { NextResponse } from 'next/server';
import { getComfyBaseUrl } from '@/lib/comfy';

export const runtime = 'nodejs';

export async function GET() {
  const base = getComfyBaseUrl();
  try {
    const response = await fetch(`${base}/system_stats`, { cache: 'no-store', signal: AbortSignal.timeout(2500) });
    if (!response.ok) return NextResponse.json({ connected: false, error: `ComfyUI returned HTTP ${response.status}` }, { status: 502 });
    const stats = await response.json();
    return NextResponse.json({ connected: true, baseUrl: base, system: stats.system || null, devices: stats.devices || [] });
  } catch {
    return NextResponse.json({ connected: false, baseUrl: base, error: 'Cannot reach ComfyUI. Start it on this PC and confirm its API is available at 127.0.0.1:8188.' }, { status: 503 });
  }
}
