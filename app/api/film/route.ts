import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import ffmpegPath from 'ffmpeg-static';
import { getComfyBaseUrl } from '@/lib/comfy';

export const runtime = 'nodejs';
export const maxDuration = 3600;

type Shot = { text: string; seconds: number };
type FilmJob = {
  id: string; title: string; status: 'queued' | 'generating' | 'assembling' | 'completed' | 'failed';
  progress: number; total: number; current: number; message: string; videoUrl?: string; subtitlesUrl?: string; error?: string;
};
type ComfyFile = { filename: string; subfolder?: string; type?: string };
type HistoryEntry = { prompt?: unknown; outputs?: Record<string, any>; status?: { status_str?: string; completed?: boolean } };

const jobs = new Map<string, FilmJob>();
const workDir = path.join(os.tmpdir(), 'novel-video-studio-films');

export function getFilmJob(id: string) { return jobs.get(id); }

function splitNovel(text: string): Array<{ title: string; shots: Shot[] }> {
  const heading = /^\s*((?:第[\u4e00-\u9fa5\d]+[章节回部篇集]|序言|序章|楔子|后记|引子)[^\n]{0,50})\s*$/gm;
  const matches = [...text.matchAll(heading)];
  const sections: Array<{ title: string; body: string }> = [];
  if (matches.length) {
    if ((matches[0].index || 0) > 0) sections.push({ title: '前言', body: text.slice(0, matches[0].index).trim() });
    matches.forEach((match, i) => sections.push({ title: match[1].trim(), body: text.slice((match.index || 0) + match[0].length, matches[i + 1]?.index ?? text.length).trim() }));
  } else sections.push({ title: '正文', body: text });

  const result = sections.flatMap((section) => {
    const sentences = section.body.replace(/\r/g, '').split(/(?<=[。！？!?；])|\n+/).map((part) => part.trim()).filter(Boolean);
    const shots: Shot[] = [];
    let buffer = '';
    const flush = () => {
      if (!buffer) return;
      shots.push({ text: buffer, seconds: Math.max(3, Math.min(12, Math.ceil(buffer.length / 9))) });
      buffer = '';
    };
    for (const sentence of sentences) {
      let rest = sentence;
      while (rest.length > 240) {
        const cut = Math.max(rest.lastIndexOf('，', 220), rest.lastIndexOf('。', 220), rest.lastIndexOf('；', 220));
        const at = cut > 120 ? cut + 1 : 220;
        if (buffer) flush();
        buffer = rest.slice(0, at).trim(); flush(); rest = rest.slice(at).trim();
      }
      if (buffer && buffer.length + rest.length > 220) flush();
      buffer += rest;
    }
    flush();
    return shots.length ? [{ title: section.title, shots }] : [];
  });
  return result;
}

function videoOutputs(entry: HistoryEntry): ComfyFile[] {
  return Object.values(entry.outputs || {}).flatMap((node: any) => [
    ...(node.videos || []), ...(node.gifs || [])
  ]).filter((file: any) => typeof file?.filename === 'string' && /\.(mp4|webm|mov|mkv)$/i.test(file.filename));
}

function apiGraph(entry: HistoryEntry): Record<string, any> | null {
  const prompt = entry.prompt;
  const candidate = Array.isArray(prompt) ? prompt[2] : prompt;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const values = Object.values(candidate as Record<string, any>);
  return values.length && values.every((node) => node && typeof node === 'object' && typeof node.class_type === 'string' && node.inputs) ? candidate as Record<string, any> : null;
}

async function findVideoWorkflow(base: string): Promise<Record<string, any>> {
  const response = await fetch(`${base}/history?max_items=100`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`读取 ComfyUI 历史失败（HTTP ${response.status}）。`);
  const history = await response.json() as Record<string, HistoryEntry>;
  const entries = Object.values(history).reverse();
  for (const entry of entries) {
    const graph = apiGraph(entry);
    if (graph && videoOutputs(entry).length && entry.status?.status_str !== 'error') return graph;
  }
  throw new Error('没有从 ComfyUI 历史里找到可复用的视频工作流。请确认刚才成功的视频任务还在 ComfyUI 历史记录中，并且有 mp4/webm 输出。');
}

function prepareGraph(template: Record<string, any>, prompt: string): Record<string, any> {
  const graph = structuredClone(template);
  const positiveIds = new Set<string>();
  const negativeIds = new Set<string>();
  for (const [id, node] of Object.entries<any>(graph)) {
    const type = String(node.class_type).toLowerCase();
    if (!type.includes('sampler')) continue;
    for (const key of Object.keys(node.inputs || {})) {
      const link = node.inputs[key];
      if (Array.isArray(link) && typeof link[0] === 'string') {
        if (key.toLowerCase().includes('positive')) positiveIds.add(link[0]);
        if (key.toLowerCase().includes('negative')) negativeIds.add(link[0]);
      }
    }
  }
  let edited = 0;
  const candidateIds = positiveIds.size ? positiveIds : new Set(Object.keys(graph));
  for (const id of candidateIds) {
    if (negativeIds.has(id)) continue;
    const node = graph[id];
    if (!node?.inputs) continue;
    const type = String(node.class_type).toLowerCase();
    for (const key of Object.keys(node.inputs)) {
      if (!/^(text|prompt|positive_prompt|prompt_text)$/i.test(key) || typeof node.inputs[key] !== 'string') continue;
      node.inputs[key] = prompt;
      edited++;
    }
    if (!edited && !positiveIds.size && /text|encode|prompt|conditioning/.test(type)) {
      for (const key of Object.keys(node.inputs)) {
        if (/^(text|prompt|positive_prompt|prompt_text)$/i.test(key) && typeof node.inputs[key] === 'string') { node.inputs[key] = prompt; edited++; }
      }
    }
  }
  if (!edited) throw new Error('无法识别视频工作流的正向提示词节点；为避免重复生成错误内容，已停止。');
  for (const node of Object.values<any>(graph)) {
    for (const key of Object.keys(node.inputs || {})) {
      if (/seed/i.test(key) && typeof node.inputs[key] === 'number') node.inputs[key] = Math.floor(Math.random() * 2 ** 32);
      if (typeof node.inputs[key] === 'string') node.inputs[key] = node.inputs[key].replace(/\{\{SEED\}\}/g, String(Math.floor(Math.random() * 2 ** 32)));
    }
  }
  return graph;
}

function runFfmpeg(args: string[]): Promise<string> {
  const executable = ffmpegPath || 'ffmpeg';
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true });
    let output = '';
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.on('error', (error) => reject(new Error(`启动 FFmpeg 失败：${error.message}`)));
    child.on('close', (code) => code === 0 ? resolve(output) : reject(new Error(`FFmpeg 合成失败：${output.slice(-1200)}`)));
  });
}

async function durationOf(file: string, fallback: number): Promise<number> {
  try {
    const output = await runFfmpeg(['-hide_banner', '-i', file]);
    const match = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : fallback;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const match = message.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : fallback;
  }
}

function srtTime(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(ms / 3600000); const minutes = Math.floor((ms % 3600000) / 60000); const secs = Math.floor((ms % 60000) / 1000); const millis = ms % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

async function executeFilm(job: FilmJob, novel: string, style: string) {
  const base = getComfyBaseUrl();
  const chapters = splitNovel(novel);
  const shots = chapters.flatMap((chapter) => chapter.shots.map((shot) => ({ ...shot, chapter: chapter.title })));
  if (!shots.length) throw new Error('小说没有可生成的正文镜头。');
  if (shots.length > 120) throw new Error(`本次拆出了 ${shots.length} 个镜头，超过单次安全上限 120。请先按章节分批制作。`);
  job.total = shots.length; job.status = 'generating'; job.message = '正在读取 ComfyUI 最近成功的视频工作流…';
  const template = await findVideoWorkflow(base);
  const sceneFiles: string[] = [];
  const durations: number[] = [];
  const captions: string[] = [];
  await mkdir(path.join(workDir, job.id), { recursive: true });

  for (let index = 0; index < shots.length; index++) {
    const shot = shots[index];
    job.current = index + 1; job.progress = Math.round(index / shots.length * 85);
    job.message = `正在生成第 ${index + 1}/${shots.length} 个镜头（${shot.chapter}）…`;
    const cinematicPrompt = `${style}，中国现实主义电影镜头，画面连贯，符合原文情境。${shot.text}。镜头只呈现视觉场景，不要字幕、文字或水印。`;
    const workflow = prepareGraph(template, cinematicPrompt);
    const queuedResponse = await fetch(`${base}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow }), cache: 'no-store', signal: AbortSignal.timeout(30000) });
    const queued = await queuedResponse.json();
    if (!queuedResponse.ok || !queued.prompt_id) throw new Error(`第 ${index + 1} 个镜头提交失败：${JSON.stringify(queued).slice(0, 500)}`);

    let output: ComfyFile | undefined;
    for (let poll = 0; poll < 900; poll++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const historyResponse = await fetch(`${base}/history/${encodeURIComponent(queued.prompt_id)}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!historyResponse.ok) continue;
      const history = await historyResponse.json();
      const entry = history[queued.prompt_id] as HistoryEntry | undefined;
      if (entry?.status?.status_str === 'error') throw new Error(`第 ${index + 1} 个镜头生成失败。请查看 ComfyUI 控制台中的节点错误。`);
      output = entry && videoOutputs(entry)[0];
      if (output) break;
    }
    if (!output) throw new Error(`第 ${index + 1} 个镜头等待超时（30 分钟）。`);
    const view = new URL(`${base}/view`); view.searchParams.set('filename', output.filename); view.searchParams.set('subfolder', output.subfolder || ''); view.searchParams.set('type', output.type || 'output');
    const videoResponse = await fetch(view, { cache: 'no-store', signal: AbortSignal.timeout(120000) });
    if (!videoResponse.ok) throw new Error(`无法下载 ComfyUI 输出文件：${output.filename}`);
    const clip = path.join(workDir, job.id, `shot-${String(index + 1).padStart(4, '0')}.mp4`);
    await writeFile(clip, Buffer.from(await videoResponse.arrayBuffer()));
    sceneFiles.push(clip); captions.push(`${shot.chapter}\n${shot.text}`);
    durations.push(await durationOf(clip, shot.seconds));
  }

  job.status = 'assembling'; job.progress = 88; job.message = '所有镜头已生成，正在合成为一部视频并制作字幕…';
  const dir = path.join(workDir, job.id);
  const concatFile = path.join(dir, 'clips.txt');
  await writeFile(concatFile, sceneFiles.map((file) => `file '${file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const finalFile = path.join(dir, 'film.mp4');
  await runFfmpeg(['-y', '-hide_banner', '-f', 'concat', '-safe', '0', '-i', concatFile, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', finalFile]);
  let elapsed = 0;
  const subtitle = captions.map((caption, i) => `${i + 1}\n${srtTime(elapsed)} --> ${srtTime(elapsed + durations[i])}\n${caption}\n`).join('\n');
  const subtitleFile = path.join(dir, 'subtitles.srt');
  await writeFile(subtitleFile, '\ufeff' + subtitle, 'utf8');
  const info = await stat(finalFile);
  if (!info.size) throw new Error('合成视频文件为空。');
  job.status = 'completed'; job.progress = 100; job.message = `完成：${shots.length} 个镜头已合成视频，并生成字幕文件。`;
  job.videoUrl = `/api/film/file?id=${job.id}&kind=video`;
  job.subtitlesUrl = `/api/film/file?id=${job.id}&kind=subtitles`;
}

export async function POST(request: NextRequest) {
  let body: { novel?: unknown; title?: unknown; style?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: '请提交有效 JSON。' }, { status: 400 }); }
  const novel = typeof body.novel === 'string' ? body.novel.trim() : '';
  if (novel.length < 50) return NextResponse.json({ error: '请粘贴至少 50 个字符的小说正文。' }, { status: 400 });
  if (novel.length > 500_000) return NextResponse.json({ error: '小说超过 500,000 个字符，请分章节制作。' }, { status: 413 });
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 100) : '小说短片';
  const style = typeof body.style === 'string' && body.style.trim() ? body.style.trim().slice(0, 500) : '电影感写实，真实自然光影，稳定构图';
  const id = crypto.randomUUID();
  const job: FilmJob = { id, title, status: 'queued', progress: 0, current: 0, total: 0, message: '已创建制作任务。' };
  jobs.set(id, job);
  void executeFilm(job, novel, style).catch((error) => {
    job.status = 'failed'; job.error = error instanceof Error ? error.message : String(error); job.message = job.error;
    void rm(path.join(workDir, job.id), { recursive: true, force: true });
  });
  return NextResponse.json(job, { status: 202 });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const job = id ? jobs.get(id) : null;
  return job ? NextResponse.json(job) : NextResponse.json({ error: '找不到该制作任务。' }, { status: 404 });
}
