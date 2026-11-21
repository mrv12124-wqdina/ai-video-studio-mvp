'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PROLOGUE_NEGATIVE, PROLOGUE_SHOTS, PROLOGUE_STYLE, PROLOGUE_TITLE, type PrologueShot } from '@/lib/prologue';

type ShotState = { id: string; title: string; status: 'queued' | 'generating' | 'completed' | 'failed'; promptId?: string; error?: string };
type Job = {
  id: string; title: string; status: 'queued' | 'generating' | 'assembling' | 'completed' | 'failed';
  progress: number; total: number; current: number; message: string;
  videoUrl?: string; subtitlesUrl?: string; error?: string; shotStates: ShotState[];
};
type Connection = { connected: boolean; error?: string; devices?: Array<{ name?: string; vram_total?: number }> };

export default function PrologueDirectorPage() {
  const [shots, setShots] = useState<PrologueShot[]>(PROLOGUE_SHOTS);
  const [style, setStyle] = useState(PROLOGUE_STYLE);
  const [negative, setNegative] = useState(PROLOGUE_NEGATIVE);
  const [workflow, setWorkflow] = useState('');
  const [connection, setConnection] = useState<Connection>({ connected: false });
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = useMemo(() => shots.reduce((sum, shot) => sum + shot.seconds, 0), [shots]);

  useEffect(() => {
    try { setWorkflow(localStorage.getItem('comfy-api-workflow') || ''); } catch { /* optional browser storage */ }
    void fetch('/api/comfy/status', { cache: 'no-store' }).then((r) => r.json()).then(setConnection).catch(() => setConnection({ connected: false, error: '无法读取 ComfyUI 状态。' }));
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  function editShot(index: number, patch: Partial<PrologueShot>) {
    setShots((current) => current.map((shot, i) => i === index ? { ...shot, ...patch } : shot));
  }

  async function start() {
    setBusy(true); setError(''); setJob(null);
    try {
      let graph: unknown = undefined;
      if (workflow.trim()) {
        try { graph = JSON.parse(workflow); } catch { throw new Error('ComfyUI API 工作流 JSON 格式无效，请先在 /comfy 页面检查。'); }
      }
      const response = await fetch('/api/film', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: PROLOGUE_TITLE,
          style,
          negativePrompt: negative,
          shots: shots.map((shot) => ({ id: shot.id, title: shot.title, chapter: shot.chapter, text: shot.prompt, seconds: shot.seconds, transition: shot.transition, dialogue: shot.dialogue })),
          ...(graph ? { workflow: graph } : {})
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '创建制作任务失败。');
      setJob(data);
      timer.current = setInterval(async () => {
        try {
          const update = await fetch('/api/film?id=' + encodeURIComponent(data.id), { cache: 'no-store' }).then((r) => r.json());
          setJob(update);
          if (update.status === 'completed' || update.status === 'failed') {
            if (timer.current) clearInterval(timer.current);
            setBusy(false);
          }
        } catch { /* retry on next poll */ }
      }, 2000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setBusy(false);
    }
  }

  return <main className="director-shell">
    <header className="director-header">
      <a href="/film">← 小说成片工坊</a>
      <div><span className="director-kicker">DIRECTOR MODE / 25 SHOTS</span><h1>序言 · 电影级动漫分镜</h1><p>逐镜提交到本机 ComfyUI，保留每镜任务状态和原始视频输出。</p></div>
      <div className={connection.connected ? 'director-connection online' : 'director-connection'}>{connection.connected ? 'ComfyUI 已连接' : connection.error || 'ComfyUI 未连接'}</div>
    </header>

    <section className="director-toolbar">
      <div><b>{shots.length} 个镜头</b><span>{Math.round(totalSeconds / 60 * 10) / 10} 分钟目标时长</span><span>16:9 · 2D cinematic anime</span></div>
      <button className="director-start" disabled={busy || !connection.connected} onClick={start}>{busy ? '正在制作…' : '提交全部镜头到 ComfyUI'}</button>
    </section>

    {error && <section className="director-error">{error}</section>}
    {job && <section className="director-job">
      <div className="director-job-top"><div><b>{job.status === 'completed' ? '成片完成' : job.status === 'failed' ? '制作失败' : '制作进行中'}</b><p>{job.message}</p></div><strong>{job.progress}%</strong></div>
      <div className="director-progress"><i style={{ width: job.progress + '%' }} /></div>
      <div className="director-job-grid">{job.shotStates?.map((shot) => <div key={shot.id} className={'director-job-shot ' + shot.status}><b>{shot.id}</b><span>{shot.title}</span><small>{shot.status === 'completed' ? '完成' : shot.status === 'generating' ? '生成中' : shot.status === 'failed' ? '失败' : '排队'}</small>{shot.error && <p>{shot.error}</p>}</div>)}</div>
      {job.error && <div className="director-error">{job.error}</div>}
      {job.status === 'completed' && job.videoUrl && <div className="director-final"><video src={job.videoUrl} controls playsInline /><a href={job.videoUrl} download>下载成片 MP4</a><a href={job.subtitlesUrl} download>下载字幕 SRT</a></div>}
    </section>}

    <section className="director-style">
      <label>统一画面风格（英文）<textarea rows={3} value={style} onChange={(e) => setStyle(e.target.value)} /></label>
      <label>统一负面提示词<textarea rows={2} value={negative} onChange={(e) => setNegative(e.target.value)} /></label>
      <p>工作流来源：{workflow.trim() ? '已读取 /comfy 页面保存的 API 工作流' : '未找到已保存的视频 API 工作流，将尝试复用 ComfyUI 最近成功的视频任务'}。图片 SaveImage 工作流不能作为视频工作流。</p>
    </section>

    <section className="director-shots">
      {shots.map((shot, index) => {
        const state = job?.shotStates?.find((item) => item.id === shot.id);
        return <article className="director-shot" key={shot.id}>
          <div className="director-shot-head"><span>{shot.id}</span><div><h2>{shot.title}</h2><small>{shot.chapter}</small></div><label>时长 <input type="number" min={2} max={30} value={shot.seconds} onChange={(e) => editShot(index, { seconds: Math.max(2, Math.min(30, Number(e.target.value) || 2)) })} /> 秒</label><em className={state?.status || 'idle'}>{state?.status === 'completed' ? '已完成' : state?.status === 'generating' ? '生成中' : state?.status === 'failed' ? '失败' : state?.status === 'queued' ? '排队中' : '待生成'}</em></div>
          <label>English image / video prompt<textarea rows={4} value={shot.prompt} onChange={(e) => editShot(index, { prompt: e.target.value })} /></label>
          <label>Transition instruction<input value={shot.transition} onChange={(e) => editShot(index, { transition: e.target.value })} /></label>
          {shot.dialogue && <label>Dialogue<input value={shot.dialogue} onChange={(e) => editShot(index, { dialogue: e.target.value })} /></label>}
          {state?.promptId && <small>ComfyUI prompt ID: {state.promptId}</small>}
          {state?.error && <p className="director-error">{state.error}</p>}
        </article>;
      })}
    </section>
  </main>;
}
