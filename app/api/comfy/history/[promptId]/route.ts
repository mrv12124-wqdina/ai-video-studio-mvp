import { NextRequest, NextResponse } from 'next/server';
import { getComfyBaseUrl } from '@/lib/comfy';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: { promptId: string } }) {
  const promptId = context.params.promptId;
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(promptId)) return NextResponse.json({ error: 'Invalid prompt id' }, { status: 400 });
  try {
    const response = await fetch(`${getComfyBaseUrl()}/history/${encodeURIComponent(promptId)}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: 'ComfyUI history request failed' }, { status: 502 });
    const entry = data[promptId];
    if (!entry) return NextResponse.json({ status: 'pending' });
    const outputs = Object.values(entry.outputs || {}).flatMap((node: any) => [
      ...(node.images || []).map((image: any) => ({ kind: 'image', ...image })),
      ...(node.gifs || []).map((video: any) => ({ kind: 'video', ...video }))
    ]);
    return NextResponse.json({ status: 'completed', outputs, statusInfo: entry.status || null });
  } catch (error) {
    return NextResponse.json({ error: 'Could not read ComfyUI task status', details: error instanceof Error ? error.message : String(error) }, { status: 503 });
  }
}
