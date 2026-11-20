import { NextResponse } from 'next/server';

// This legacy demo endpoint used to report a hard-coded sample clip as if it were generated.
// Keep an explicit response so stale clients cannot mistake a placeholder for a real result.
export async function GET() {
  return NextResponse.json({
    error: 'This demo generation endpoint has been disabled. Use /comfy with a real, installed ComfyUI workflow.',
    configured: false
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    error: 'This demo generation endpoint has been disabled. No video is generated here. Use /comfy with a real, installed ComfyUI workflow.',
    configured: false
  }, { status: 410 });
}
