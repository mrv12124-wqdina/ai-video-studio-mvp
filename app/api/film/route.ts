import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { getComfyBaseUrl } from '@/lib/comfy';
import { PROLOGUE_NEGATIVE } from '@/lib/prologue';

export const runtime = 'nodejs';
export const maxDuration = 3600;

type Shot = { id: string; title: string; chapter: string; text: string; seconds: number; transition?: string; dialogue?: string };
type ShotProgress = { id: string; title: string; status: 'queued' | 'generating' | 'completed' | 'failed'; promptId?: string; filename?: string; subfolder?: string; type?: string; error?: string };
type FilmJob = {
  id: string; title: string; status: 'queued' | 'generating' | 'assembling' | 'completed' | 'failed';
  progress: number; total: number; current: number; message: string; videoUrl?: string; subtitlesUrl?: string; error?: string;
  shotStates: ShotProgress[];
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
    ...(node.videos || []), ...(node.gifs || []), ...(node.images || [])
  ]).filter((file: any) => typeof file?.filename === 'string' && /\\.(mp4|webm|mov|mkv|gif)$/i.test(file.filename));
}

function isApiWorkflow(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const nodes = Object.values(value as Record<string, any>);
  return nodes.length > 0 && nodes.every((node: any) => node && typeof node === 'object' && typeof node.class_type === 'string' && node.inputs && typeof node.inputs === 'object');
}

function apiGraph(entry: HistoryEntry): Record<string, any> | null {
  const prompt = entry.prompt;
  const candidate = Array.isArray(prompt) ? prompt[2] : prompt;
  return isApiWorkflow(candidate) ? candidate : null;
}

function isVideoWorkflowGraph(graph: Record<string, any>): boolean {
  return Object.values<any>(graph).some((node) => /(video|vhs|animatedwebp|animatedpng|gif)/i.test(String(node.class_type || '')));
}

async function findVideoWorkflow(base: string): Promise<Record<string, any>> {
  const response = await fetch(base + '/history?max_items=100', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('读取 ComfyUI 历史失败（HTTP ' + response.status + '）。');
  const history = await response.json() as Record<string, HistoryEntry>;
  const entries = Object.values(history).reverse();
  for (const entry of entries) {
    const graph = apiGraph(entry);
    if (graph && isVideoWorkflowGraph(graph) && videoOutputs(entry).length && entry.status?.status_str !== 'error') return graph;
  }
  throw new Error('没有找到可复用的视频工作流。请在 ComfyUI 中成功运行一次带 SaveVideo 或 VHS_VideoCombine 视频输出节点的工作流，或在本项目 /comfy 页面导入视频 API 工作流。图片 SaveImage 工作流不能生成视频。');
}

function linkedNodeIds(value: unknown): string[] {
  if (Array.isArray(value) && typeof value[0] === 'string') return [value[0]];
  return [];
}

function traceUpstream(graph: Record<string, any>, roots: Set<string>): Set<string> {
  const visited = new Set<string>();
  const queue = Array.from(roots);
  while (queue.length) {
    const id = queue.shift() as string;
    if (visited.has(id) || !graph[id]) continue;
    visited.add(id);
    for (const value of Object.values(graph[id].inputs || {})) {
      for (const linked of linkedNodeIds(value)) if (!visited.has(linked)) queue.push(linked);
    }
  }
  return visited;
}

function replacePromptInputs(graph: Record<string, any>, ids: Set<string>, prompt: string): number {
  let edited = 0;
  const promptKey = /^(text|prompt|positive_prompt|prompt_text|text_[a-z0-9_]+|prompt_[a-z0-9_]+)$/i;
  for (const id of ids) {
    const node = graph[id];
    if (!node?.inputs) continue;
    for (const key of Object.keys(node.inputs)) {
      if (promptKey.test(key) && typeof node.inputs[key] === 'string' && !/negative|uncond/i.test(key)) {
        node.inputs[key] = prompt;
        edited++;
      }
    }
  }
  return edited;
}

function prepareGraph(
  template: Record<string, any>,
  prompt: string,
  negativePrompt: string,
  seconds: number,
  jobId: string,
  shotId: string
): Record<string, any> {
  const graph = structuredClone(template);
  const positiveRoots = new Set<string>();
  const negativeRoots = new Set<string>();

  for (const node of Object.values<any>(graph)) {
    if (!/sampler/i.test(String(node.class_type || ''))) continue;
    for (const [key, value] of Object.entries(node.inputs || {})) {
      const ids = linkedNodeIds(value);
      if (key.toLowerCase().includes('positive')) ids.forEach((id) => positiveRoots.add(id));
      if (key.toLowerCase().includes('negative')) ids.forEach((id) => negativeRoots.add(id));
    }
  }

  const positivePath = traceUpstream(graph, positiveRoots);
  const negativePath = traceUpstream(graph, negativeRoots);
  let positiveEdited = replacePromptInputs(graph, positivePath, prompt);
  let negativeEdited = replacePromptInputs(graph, negativePath, negativePrompt);

  if (!positiveEdited) {
    const markerNodes = Object.keys(graph).filter((id) => Object.values(graph[id].inputs || {}).some((value) => typeof value === 'string' && value.includes('{{PROMPT}}')));
    positiveEdited = replacePromptInputs(graph, new Set(markerNodes), prompt);
  }
  if (!positiveEdited) {
    throw new Error('无法定位视频工作流的正向文本编码节点。请确认采样器的 positive 输入连接到 CLIP/Text Encode 节点，或使用 {{PROMPT}} 标记。');
  }

  if (!negativeEdited) {
    const markerNodes = Object.keys(graph).filter((id) => Object.values(graph[id].inputs || {}).some((value) => typeof value === 'string' && value.includes('{{NEGATIVE_PROMPT}}')));
    negativeEdited = replacePromptInputs(graph, new Set(markerNodes), negativePrompt);
  }

  const frameCount = Math.max(9, Math.round(seconds * 24) + 1);
  for (const [id, node] of Object.entries<any>(graph)) {
    const className = String(node.class_type || '');
    const isVideoNode = /(video|wan|hunyuan|ltx|svd|animated|vhs)/i.test(className);
    for (const key of Object.keys(node.inputs || {})) {
      const value = node.inputs[key];
      if (/seed/i.test(key) && typeof value === 'number') node.inputs[key] = Math.floor(Math.random() * 2 ** 32);
      if (typeof value === 'string') {
        node.inputs[key] = value
          .replace(/\{\{SEED\}\}/g, String(Math.floor(Math.random() * 2 ** 32)))
          .replace(/\{\{PROMPT\}\}/g, prompt)
          .replace(/\{\{NEGATIVE_PROMPT\}\}/g, negativePrompt);
      }
      if (isVideoNode && /^(length|num_frames|frames|frame_count|video_length)$/i.test(key) && typeof value === 'number') {
        node.inputs[key] = frameCount;
      }
      if (/(savevideo|videocombine|vhs_videocombine)/i.test(className) && key === 'filename_prefix' && typeof value === 'string') {
        node.inputs[key] = 'ai-video-studio/' + jobId + '/' + shotId;
      }
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

async function executeFilm(
  job: FilmJob,
  novel: string,
  style: string,
  negativePrompt: string,
  suppliedShots: Shot[],
  suppliedWorkflow?: Record<string, any>
) {
  const base = getComfyBaseUrl();
  const shots: Shot[] = suppliedShots.length ? suppliedShots : splitNovel(novel).flatMap((chapter) =>
    chapter.shots.map((shot, index) => ({
      id: 'N' + String(index + 1).padStart(2, '0'),
      title: 'Shot ' + String(index + 1),
      chapter: chapter.title,
      text: shot.text,
      seconds: shot.seconds
    }))
  );
  if (!shots.length) throw new Error('没有可生成的分镜。');
  if (shots.length > 120) throw new Error('本次有 ' + shots.length + ' 个镜头，超过单次安全上限 120。请分批制作。');

  job.total = shots.length;
  job.status = 'generating';
  job.message = '正在准备 ComfyUI 视频工作流…';
  const template = suppliedWorkflow || await findVideoWorkflow(base);
  if (!isApiWorkflow(template)) throw new Error('ComfyUI 工作流不是 API 格式 JSON。请在 ComfyUI 导出 API Format 工作流。');
  if (!isVideoWorkflowGraph(template)) throw new Error('当前工作流没有识别到视频输出节点。请使用 SaveVideo、VHS_VideoCombine 等视频工作流；SaveImage 只能输出图片。');

  const dir = path.join(workDir, job.id);
  await mkdir(dir, { recursive: true });
  const sceneFiles: string[] = [];
  const durations: number[] = [];
  const captions: string[] = [];

  for (let index = 0; index < shots.length; index++) {
    const shot = shots[index];
    const state = job.shotStates[index];
    job.current = index + 1;
    job.progress = Math.round(index / shots.length * 85);
    job.message = '正在生成 ' + shot.id + ' — ' + shot.title + '（' + (index + 1) + '/' + shots.length + '）…';
    state.status = 'generating';

    const cinematicPrompt = [
      style,
      shot.text,
      'Target clip duration: ' + shot.seconds + ' seconds. Cinematic 2D anime feature-film animation, natural character motion, controlled camera movement, no text or subtitles.',
      shot.transition ? 'Transition intent: ' + shot.transition : ''
    ].filter(Boolean).join('\n\n');
    const workflow = prepareGraph(template, cinematicPrompt, negativePrompt, shot.seconds, job.id, shot.id);
    let queuedResponse: Response;
    try {
      queuedResponse = await fetch(base + '/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
        cache: 'no-store',
        signal: AbortSignal.timeout(30000)
      });
    } catch (error) {
      throw new Error('向 ComfyUI 提交 ' + shot.id + ' 失败：' + (error instanceof Error ? error.message : String(error)));
    }
    const queued = await queuedResponse.json().catch(() => ({}));
    if (!queuedResponse.ok || !queued.prompt_id) {
      throw new Error(shot.id + ' 提交失败：' + JSON.stringify(queued).slice(0, 700));
    }
    state.promptId = queued.prompt_id;

    let output: ComfyFile | undefined;
    let completedWithoutVideo = false;
    for (let poll = 0; poll < 900; poll++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const historyResponse = await fetch(base + '/history/' + encodeURIComponent(queued.prompt_id), {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });
      if (!historyResponse.ok) continue;
      const history = await historyResponse.json();
      const entry = history[queued.prompt_id] as HistoryEntry | undefined;
      if (entry?.status?.status_str === 'error') {
        const details = JSON.stringify((entry.status as any).messages || entry.status).slice(0, 900);
        throw new Error(shot.id + ' 在 ComfyUI 执行失败：' + details);
      }
      output = entry && videoOutputs(entry)[0];
      if (output) break;
      if (entry?.status?.completed) {
        completedWithoutVideo = true;
        break;
      }
    }
    if (!output) {
      if (completedWithoutVideo) throw new Error(shot.id + ' 已执行结束，但没有返回 MP4/WebM/MOV/GIF 视频文件。请检查工作流末端是否使用 SaveVideo 或 VHS_VideoCombine。');
      throw new Error(shot.id + ' 等待 ComfyUI 超时（30分钟）。');
    }

    state.filename = output.filename;
    state.subfolder = output.subfolder || '';
    state.type = output.type || 'output';
    const view = new URL(base + '/view');
    view.searchParams.set('filename', output.filename);
    view.searchParams.set('subfolder', output.subfolder || '');
    view.searchParams.set('type', output.type || 'output');
    const videoResponse = await fetch(view, { cache: 'no-store', signal: AbortSignal.timeout(120000) });
    if (!videoResponse.ok) throw new Error('无法从 ComfyUI 下载输出文件：' + output.filename);

    const extension = path.extname(output.filename).toLowerCase() || '.mp4';
    const rawFile = path.join(dir, 'source-' + String(index + 1).padStart(3, '0') + extension);
    const clip = path.join(dir, 'shot-' + String(index + 1).padStart(3, '0') + '.mp4');
    await writeFile(rawFile, Buffer.from(await videoResponse.arrayBuffer()));
    await runFfmpeg([
      '-y', '-hide_banner', '-i', rawFile,
      '-vf', 'fps=24,scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1',
      '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', clip
    ]);
    sceneFiles.push(clip);
    durations.push(await durationOf(clip, shot.seconds));
    captions.push(shot.dialogue || shot.title || shot.id);
    state.status = 'completed';
    job.progress = Math.round((index + 1) / shots.length * 85);
  }

  job.status = 'assembling';
  job.progress = 88;
  job.message = '25镜头视频已生成，正在统一编码并合成成片…';
  const concatFile = path.join(dir, 'clips.txt');
  await writeFile(concatFile, sceneFiles.map((file) => "file '" + file.replace(/\\\\/g, '/').replace(/'/g, "'\\\\''") + "'").join('\n'));
  const finalFile = path.join(dir, 'film.mp4');
  await runFfmpeg([
    '-y', '-hide_banner', '-f', 'concat', '-safe', '0', '-i', concatFile,
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', finalFile
  ]);

  let elapsed = 0;
  const subtitle = captions.map((caption, index) => {
    const line = (index + 1) + '\n' + srtTime(elapsed) + ' --> ' + srtTime(elapsed + durations[index]) + '\n' + caption + '\n';
    elapsed += durations[index];
    return line;
  }).join('\n');
  await writeFile(path.join(dir, 'subtitles.srt'), '\ufeff' + subtitle, 'utf8');
  const info = await stat(finalFile);
  if (!info.size) throw new Error('合成视频文件为空。');

  job.status = 'completed';
  job.progress = 100;
  job.message = '完成：' + shots.length + ' 个镜头已生成并合成为 MP4。各镜头原始视频已保存在 ComfyUI 输出目录。';
  job.videoUrl = '/api/film/file?id=' + job.id + '&kind=video';
  job.subtitlesUrl = '/api/film/file?id=' + job.id + '&kind=subtitles';
}
export async function POST(request: NextRequest) {
  let body: { novel?: unknown; title?: unknown; style?: unknown; negativePrompt?: unknown; shots?: unknown; workflow?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: '请提交有效 JSON。' }, { status: 400 }); }

  const novel = typeof body.novel === 'string' ? body.novel.trim() : '';
  const rawShots = Array.isArray(body.shots) ? body.shots : [];
  if (!rawShots.length && novel.length < 50) {
    return NextResponse.json({ error: '请提供至少一个导演分镜，或粘贴至少 50 个字符的小说正文。' }, { status: 400 });
  }
  if (novel.length > 500_000) return NextResponse.json({ error: '小说超过 500,000 个字符，请分章节制作。' }, { status: 413 });
  if (rawShots.length > 120) return NextResponse.json({ error: '单次最多提交 120 个镜头。' }, { status: 413 });

  const shots: Shot[] = rawShots.map((value: any, index: number) => ({
    id: typeof value?.id === 'string' ? value.id.slice(0, 32) : 'S' + String(index + 1).padStart(2, '0'),
    title: typeof value?.title === 'string' ? value.title.slice(0, 160) : 'Shot ' + (index + 1),
    chapter: typeof value?.chapter === 'string' ? value.chapter.slice(0, 120) : 'Prologue',
    text: typeof value?.text === 'string' ? value.text.trim().slice(0, 12000) : typeof value?.prompt === 'string' ? value.prompt.trim().slice(0, 12000) : '',
    seconds: typeof value?.seconds === 'number' && Number.isFinite(value.seconds) ? Math.max(2, Math.min(30, Math.round(value.seconds))) : 5,
    transition: typeof value?.transition === 'string' ? value.transition.slice(0, 1000) : undefined,
    dialogue: typeof value?.dialogue === 'string' ? value.dialogue.slice(0, 1000) : undefined
  }));
  if (rawShots.length && shots.some((shot) => !shot.text)) {
    return NextResponse.json({ error: '每个镜头都必须包含英文画面提示词。' }, { status: 400 });
  }

  let workflow: Record<string, any> | undefined;
  if (body.workflow !== undefined && body.workflow !== null) {
    if (!isApiWorkflow(body.workflow)) return NextResponse.json({ error: '提供的工作流不是有效的 ComfyUI API 格式 JSON。' }, { status: 400 });
    if (!isVideoWorkflowGraph(body.workflow)) return NextResponse.json({ error: '导入的是图片工作流，不是视频工作流。请使用 SaveVideo 或 VHS_VideoCombine 视频输出节点。' }, { status: 400 });
    workflow = body.workflow;
  }

  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 100) : '小说短片';
  const style = typeof body.style === 'string' && body.style.trim() ? body.style.trim().slice(0, 2000) : 'Premium cinematic realistic 2D anime feature film, natural lighting, refined hand-drawn linework.';
  const negativePrompt = typeof body.negativePrompt === 'string' && body.negativePrompt.trim() ? body.negativePrompt.trim().slice(0, 4000) : PROLOGUE_NEGATIVE;
  const id = crypto.randomUUID();
  const shotStates: ShotProgress[] = shots.map((shot) => ({ id: shot.id, title: shot.title, status: 'queued' }));
  const job: FilmJob = {
    id, title, status: 'queued', progress: 0, current: 0,
    total: shots.length, message: '已创建导演分镜制作任务。', shotStates
  };
  jobs.set(id, job);
  void executeFilm(job, novel, style, negativePrompt, shots, workflow).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    const active = job.shotStates.find((shot) => shot.status === 'generating');
    if (active) { active.status = 'failed'; active.error = message; }
    job.status = 'failed';
    job.error = message;
    job.message = message;
  });
  return NextResponse.json(job, { status: 202 });
}export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const job = id ? jobs.get(id) : null;
  return job ? NextResponse.json(job) : NextResponse.json({ error: '找不到该制作任务。' }, { status: 404 });
}
