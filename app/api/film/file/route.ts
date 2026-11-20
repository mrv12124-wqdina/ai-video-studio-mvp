import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { getFilmJob } from '@/app/api/film/route';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  const kind = request.nextUrl.searchParams.get('kind');
  if (!/^[a-f0-9-]{36}$/i.test(id) || !['video', 'subtitles'].includes(kind || '')) return NextResponse.json({ error: '无效文件请求。' }, { status: 400 });
  const job = getFilmJob(id);
  if (!job || job.status !== 'completed') return NextResponse.json({ error: '文件尚未准备好。' }, { status: 404 });
  const file = path.join(os.tmpdir(), 'novel-video-studio-films', id, kind === 'video' ? 'film.mp4' : 'subtitles.srt');
  try {
    const info = await stat(file);
    const range = request.headers.get('range');
    if (range && kind === 'video') {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (!match) return new NextResponse(null, { status: 416 });
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
      if (start > end || start >= info.size) return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
      const stream = createReadStream(file, { start, end });
      return new NextResponse(Readable.toWeb(stream) as ReadableStream, { status: 206, headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Accept-Ranges': 'bytes' } });
    }
    const stream = createReadStream(file);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, { headers: { 'Content-Type': kind === 'video' ? 'video/mp4' : 'application/x-subrip; charset=utf-8', 'Content-Length': String(info.size), 'Content-Disposition': `attachment; filename="${kind === 'video' ? 'novel-film.mp4' : 'subtitles.srt'}"`, 'Accept-Ranges': 'bytes' } });
  } catch { return NextResponse.json({ error: '视频文件已不可用，请重新制作。' }, { status: 404 }); }
}
