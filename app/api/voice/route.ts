import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) return NextResponse.json({ error: 'ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID is not configured', configured: false }, { status: 503 });

  const body = await request.json();
  const text = String(body.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: body.model_id || 'eleven_multilingual_v2' })
    });
    if (!response.ok) {
      const data = await response.text();
      return NextResponse.json({ error: 'Voice provider rejected the request', status: response.status, data }, { status: 502 });
    }
    return new NextResponse(await response.arrayBuffer(), { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Voice provider connection failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
