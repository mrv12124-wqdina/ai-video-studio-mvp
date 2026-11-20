'use client';

import { FormEvent, useEffect, useState } from 'react';

type Ratio = '16:9' | '9:16' | '1:1';
type Job = {
  id: string;
  prompt: string;
  ratio: Ratio;
  duration: number;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  videoUrl?: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState('一只宇航员猫在月球上慢慢走过闪烁的星河');
  const [ratio, setRatio] = useState<Ratio>('16:9');
  const [duration, setDuration] = useState(5);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const response = await fetch('/api/jobs', { cache: 'no-store' });
    if (response.ok) setJobs((await response.json()).jobs);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 1000);
    return () => clearInterval(timer);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ratio, duration })
    });
    await refresh();
    setLoading(false);
  }

  return (
    <main>
      <header><div className="brand">◈ <span>AI Video Studio</span></div><div className="status"><i />系统就绪</div></header>
      <section className="shell">
        <div className="panel create">
          <div className="eyebrow">CREATE</div>
          <h1>创作新视频</h1>
          <form onSubmit={submit}>
            <label>描述你想生成的视频</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
            <div className="row">
              <div><label>画幅比例</label><div className="ratios">{(['16:9','9:16','1:1'] as Ratio[]).map((item) => <button type="button" className={ratio === item ? 'active' : ''} onClick={() => setRatio(item)} key={item}>{item}</button>)}</div></div>
              <div><label>时长：{duration} 秒</label><input className="range" type="range" min="1" max="60" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
            </div>
            <button className="generate" disabled={loading || !prompt.trim()}>{loading ? '正在提交…' : '✦ 开始生成'}</button>
          </form>
        </div>
        <div className="panel queue">
          <div className="queue-head"><div><div className="eyebrow">QUEUE</div><h2>生成任务</h2></div><span>{jobs.length} 个任务</span></div>
          <div className="jobs">
            {jobs.length === 0 && <div className="empty"><div>✦</div><p>还没有生成任务</p></div>}
            {jobs.map((job) => (
              <article className="job" key={job.id}>
                {job.status === 'completed' && job.videoUrl ? <video src={job.videoUrl} controls /> : <div className="placeholder"><span>{job.status === 'generating' ? `${job.progress}%` : '排队中'}</span></div>}
                <div className="job-info"><h3>{job.prompt}</h3><p>{job.ratio} · {job.duration}s</p>{job.status !== 'completed' && <div className="progress"><b style={{ width: `${job.progress}%` }} /></div>}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
