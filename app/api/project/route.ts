import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    videoProviderConfigured: Boolean(process.env.VIDEO_API_URL && process.env.VIDEO_API_KEY),
    pexelsConfigured: Boolean(process.env.PEXELS_API_KEY),
    voiceProviderConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    storageConfigured: Boolean(process.env.PUBLIC_VIDEO_BASE_URL)
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = String(body.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Novel text is required' }, { status: 400 });

  const chapterSize = Math.min(3000, Math.max(300, Number(body.chapterSize) || 900));
  const sceneSize = Math.min(180, Math.max(20, Number(body.sceneSize) || 55));
  const chapterMatches = [...text.matchAll(/^\s*(第.+?[章节回部篇集])\s*[:：]?\s*(.*)$/gm)];
  const chapters: Array<{ title: string; scenes: Array<{ caption: string; seconds: number }> }> = [];

  if (chapterMatches.length) {
    let cursor = 0;
    chapterMatches.forEach((match, index) => {
      if (index === 0 && match.index > 0) {
        const preface = text.slice(0, match.index).trim();
        if (preface) chapters.push(makeChapter('前言', preface, sceneSize));
      }
      const start = match.index || 0;
      const end = chapterMatches[index + 1]?.index ?? text.length;
      chapters.push(makeChapter((match[1] + (match[2] ? `：${match[2]}` : '')).trim(), text.slice(start + match[0].length, end).trim(), sceneSize));
      cursor = end;
    });
  } else {
    for (let i = 0; i < text.length; i += chapterSize) {
      chapters.push(makeChapter(`第${chapters.length + 1}集`, text.slice(i, i + chapterSize).trim(), sceneSize));
    }
  }

  const names = [...new Set((text.match(/[\u4e00-\u9fa5]{2,4}(?=[：，。！？说问喊道回望停走坐站笑哭点头叫])/g) || []).slice(0, 8))];
  const characters = names.map((name, index) => ({
    name,
    role: index === 0 ? '主角' : '角色',
    description: `${name}，保持脸型、发色、年龄、服装、身形、皮肤质感和镜头间光线风格一致。电影级真实表现，不使用夸张AI或卡通效果。`
  }));

  return NextResponse.json({ chapters, characters, project: body.project || '未命名小说短剧' });
}

function makeChapter(title: string, text: string, sceneSize: number) {
  const result: Array<{ caption: string; seconds: number }> = [];
  let current = '';
  const pieces = text.split(/(?<=[。！？!?；])|\n+/).map((item) => item.trim()).filter(Boolean);
  for (const piece of pieces) {
    if (current.length + piece.length > sceneSize && current) {
      result.push({ caption: current, seconds: Math.max(3, Math.min(9, current.length / 5)) });
      current = piece;
    } else {
      current += (current ? ' ' : '') + piece;
    }
  }
  if (current) result.push({ caption: current, seconds: Math.max(3, Math.min(9, current.length / 5)) });
  return { title, scenes: result };
}
