import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type JobStatus = 'queued' | 'generating' | 'completed' | 'failed';

export type VideoJob = {
  id: string;
  prompt: string;
  ratio: '16:9' | '9:16' | '1:1';
  duration: number;
  status: JobStatus;
  progress: number;
  createdAt: string;
  videoUrl?: string;
};

const jobs = new Map<string, VideoJob>();

export function getJobs() {
  return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJob(id: string) {
  return jobs.get(id);
}

export function createJob(input: { prompt: string; ratio: VideoJob['ratio']; duration: number }) {
  const id = crypto.randomUUID();
  const job: VideoJob = {
    id,
    prompt: input.prompt.trim(),
    ratio: input.ratio,
    duration: input.duration,
    status: 'queued',
    progress: 0,
    createdAt: new Date().toISOString()
  };
  jobs.set(id, job);
  processJob(job);
  return job;
}

async function processJob(job: VideoJob) {
  job.status = 'generating';
  for (let progress = 10; progress <= 100; progress += 10) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    job.progress = progress;
  }
  job.status = 'completed';
  job.videoUrl = `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.prompt || typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  const job = createJob({
    prompt: body.prompt,
    ratio: body.ratio === '9:16' || body.ratio === '1:1' ? body.ratio : '16:9',
    duration: Math.min(60, Math.max(1, Number(body.duration) || 5))
  });
  return NextResponse.json(job, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ jobs: getJobs() });
}
