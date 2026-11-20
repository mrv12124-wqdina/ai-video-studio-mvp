import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    videoProviderConfigured: Boolean(process.env.VIDEO_API_URL && process.env.VIDEO_API_KEY),
    pexelsConfigured: Boolean(process.env.PEXELS_API_KEY),
    voiceProviderConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    storageConfigured: Boolean(process.env.PUBLIC_VIDEO_BASE_URL),
    localComfyUI: process.env.COMFYUI_URL || 'http://127.0.0.1:8188'
  });
}

export async function POST(request: NextRequest) {
  let body: { text?: unknown; project?: unknown; chapterSize?: unknown; sceneSize?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request must be JSON' }, { status: 400 }); }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'Novel text is required' }, { status: 400 });
  if (text.length > 500_000) return NextResponse.json({ error: 'Novel text is too large (maximum 500,000 characters)' }, { status: 413 });

  const chapterSize = clamp(body.chapterSize, 900, 300, 3000);
  const sceneSize = clamp(body.sceneSize, 55, 20, 180);
  const matches = [...text.matchAll(/^\s*(第[\u4e00-\u9fa5\d]+[章节回部篇集])\s*[:：、]?\s*(.*)$/gm)];
  const chapters: Array<{ title: string; scenes: Array<{ caption: string; seconds: number }> }> = [];

  if (matches.length) {
    if ((matches[0].index || 0) > 0) {
      const preface = text.slice(0, matches[0].index).trim();
      if (preface) chapters.push(makeChapter('前言', preface, sceneSize));
    }
    matches.forEach((match, index) => {
      const start = (match.index || 0) + match[0].length;
      const end = matches[index + 1]?.index ?? text.length;
      const title = `${match[1]}${match[2] ? `：${match[2]}` : ''}`.trim();
      const chapter = makeChapter(title, text.slice(start, end).trim(), sceneSize);
      if (chapter.scenes.length) chapters.push(chapter);
    });
  } else {
    const paragraphs = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
    let current = '';
    for (const paragraph of paragraphs) {
      if (current && current.length + paragraph.length > chapterSize) {
        chapters.push(makeChapter(`第${chapters.length + 1}集`, current, sceneSize));
        current = '';
      }
      current += (current ? '\n' : '') + paragraph;
    }
    if (current) chapters.push(makeChapter(`第${chapters.length + 1}集`, current, sceneSize));
  }

  return NextResponse.json({
    chapters,
    // Deliberately do not infer people from character-adjacent words. Add people manually or use a verified LLM later.
    characters: [],
    characterDetection: 'disabled_until_verified',
    project: typeof body.project === 'string' && body.project.trim() ? body.project.trim().slice(0, 100) : '未命名小说短剧'
  });
}

function clamp(value: unknown, fallback: number, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function makeChapter(title: string, text: string, sceneSize: number) {
  const pieces = text.split(/(?<=[。！？!?；])|\n+/).map((item) => item.trim()).filter(Boolean);
  const scenes: Array<{ caption: string; seconds: number }> = [];
  let current = '';
  const flush = () => {
    if (!current) return;
    scenes.push({ caption: current, seconds: Math.max(3, Math.min(9, Math.ceil(current.length / 5))) });
    current = '';
  };
  for (const piece of pieces) {
    let remaining = piece;
    if (remaining.length > sceneSize) {
      flush();
      while (remaining.length > sceneSize) {
        const cut = remaining.lastIndexOf('，', sceneSize);
        const splitAt = cut > sceneSize * 0.6 ? cut + 1 : sceneSize;
        const caption = remaining.slice(0, splitAt).trim();
        scenes.push({ caption, seconds: Math.max(3, Math.min(9, Math.ceil(caption.length / 5))) });
        remaining = remaining.slice(splitAt).trim();
      }
    }
    if (current && current.length + remaining.length > sceneSize) flush();
    current += remaining;
  }
  flush();
  return { title, scenes };
}
