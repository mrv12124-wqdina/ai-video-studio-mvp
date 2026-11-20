import { NextRequest, NextResponse } from 'next/server';
import { getComfyBaseUrl } from '@/lib/comfy';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, context: { params: { promptId: string } }) {
  const promptId = context.params.promptId;
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(promptId)) return NextResponse.json({ error: 'Invalid prompt id' }, { status: 400 });
  try {
    const response = await fetch(`${getComfyBaseUrl()}/history/${encodeURIComponent(promptId)}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: 'ComfyUI history request failed' }, { status: 502 });
    const entry = data[promptId];
    if (!entry) return NextResponse.json({ status: 'pending' });
    const status = entry.status || {};
    if (status.status_str === 'error') return NextResponse.json({ status: 'failed', message: 'ComfyUI workflow failed. Check its console for the node error.' });
    const outputs = Object.values(entry.outputs || {}).flatMap((node: any) => [
      ...(node.images || []).map((file: any) => ({ kind: 'image', ...file })),
      ...(node.gifs || []).map((file: any) => ({ kind: 'video', ...file })),
      ...(node.videos || []).map((file: any) => ({ kind: 'video', ...file }))
    ]);
    if (status.completed || outputs.length) return NextResponse.json({ status: 'completed', outputs, statusInfo: status });
    return NextResponse.json({ status: 'pending', statusInfo: status });
  } catch (error) {
    return NextResponse.json({ error: 'Could not read ComfyUI task status', details: error instanceof Error ? error.message : String(error) }, { status: 503 });
  }
}
