import { NextRequest, NextResponse } from 'next/server';
import { getComfyBaseUrl } from '@/lib/comfy';

export const runtime = 'nodejs';

function replaceMarkers(value: unknown, replacements: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return Object.entries(replacements).reduce((text, [marker, replacement]) => text.split(marker).join(replacement), value);
  }
  if (Array.isArray(value)) return value.map((item) => replaceMarkers(item, replacements));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceMarkers(item, replacements)]));
  }
  return value;
}

export async function POST(request: NextRequest) {
  let body: { workflow?: unknown; prompt?: unknown; negativePrompt?: unknown; seed?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request must be JSON' }, { status: 400 }); }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return NextResponse.json({ error: 'Enter a scene prompt first.' }, { status: 400 });
  if (!body.workflow || typeof body.workflow !== 'object' || Array.isArray(body.workflow)) {
    return NextResponse.json({ error: 'Import a ComfyUI API-format workflow JSON first.' }, { status: 400 });
  }

  const workflow = replaceMarkers(body.workflow, {
    '{{PROMPT}}': prompt,
    '{{NEGATIVE_PROMPT}}': typeof body.negativePrompt === 'string' ? body.negativePrompt : '',
    '{{SEED}}': String(Number.isSafeInteger(body.seed) ? body.seed : Math.floor(Math.random() * 2 ** 32))
  });
  const base = getComfyBaseUrl();
  try {
    const response = await fetch(`${base}/prompt`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }), cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: 'ComfyUI rejected this workflow. Check that it is an API-format graph and the required models/nodes are installed.', details: data }, { status: 502 });
    if (!data.prompt_id) return NextResponse.json({ error: 'ComfyUI did not return a prompt_id.', details: data }, { status: 502 });
    return NextResponse.json({ promptId: data.prompt_id, queueNumber: data.number ?? null });
  } catch (error) {
    return NextResponse.json({ error: 'Could not submit to local ComfyUI. Is ComfyUI running on this same PC?', details: error instanceof Error ? error.message : String(error) }, { status: 503 });
  }
}
