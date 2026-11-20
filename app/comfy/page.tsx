'use client';

import { ChangeEvent, useEffect, useState } from 'react';

type Output = { kind: string; filename: string; subfolder?: string; type?: string };
type Connection = { connected: boolean; error?: string; devices?: Array<{ name?: string; vram_total?: number }> };
const example = `{
  "3": {"class_type": "KSampler", "inputs": {"seed": "{{SEED}}", "steps": 20, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
  "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "YOUR_MODEL.safetensors"}},
  "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 512, "batch_size": 1}},
  "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "{{PROMPT}}", "clip": ["4", 1]}},
  "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "{{NEGATIVE_PROMPT}}", "clip": ["4", 1]}},
  "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
  "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "novel-studio", "images": ["8", 0]}}
}`;

export default function ComfyPage() {
  const [connection, setConnection] = useState<Connection>({ connected: false });
  const [workflow, setWorkflow] = useState('');
  const [prompt, setPrompt] = useState('电影感镜头，夜雨中的老街，霓虹倒映在湿润的石板路上，缓慢推镜，写实光影');
  const [negative, setNegative] = useState('低清晰度，畸形，文字，水印');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [outputs, setOutputs] = useState<Output[]>([]);

  async function check() {
    try {
      const response = await fetch('/api/comfy/status', { cache: 'no-store' });
      setConnection(await response.json());
    } catch { setConnection({ connected: false, error: '无法读取应用服务状态。' }); }
  }
  useEffect(() => {
    try {
      setWorkflow(localStorage.getItem('comfy-api-workflow') || '');
      const fromScene = new URLSearchParams(window.location.search).get('prompt');
      if (fromScene) setPrompt(fromScene);
    } catch { /* browser storage unavailable */ }
    void check();
  }, []);
  function updateWorkflow(value: string) {
    setWorkflow(value);
    try { localStorage.setItem('comfy-api-workflow', value); } catch { /* optional */ }
  }
  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) updateWorkflow(await file.text());
    event.target.value = '';
  }
  async function generate() {
    let graph: unknown;
    try { graph = JSON.parse(workflow); } catch { setMessage('工作流 JSON 格式无效。'); return; }
    setBusy(true); setMessage('正在向本机 ComfyUI 提交任务…'); setOutputs([]);
    try {
      const queuedResponse = await fetch('/api/comfy/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflow: graph, prompt, negativePrompt: negative }) });
      const queued = await queuedResponse.json();
      if (!queuedResponse.ok) throw new Error(queued.error || '提交失败');
      setMessage(`任务已提交：${queued.promptId}，等待本机生成…`);
      for (let i = 0; i < 240; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const response = await fetch(`/api/comfy/history/${encodeURIComponent(queued.promptId)}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || result.error) throw new Error(result.error || '读取生成任务失败');
        if (result.status === 'failed') throw new Error(result.message || 'ComfyUI 工作流执行失败，请检查 ComfyUI 控制台。');
        if (result.status === 'completed') {
          const generated = (result.outputs || []) as Output[];
          setOutputs(generated);
          setMessage(generated.length ? `生成完成：${generated.length} 个输出文件。` : '工作流已结束，但没有可显示的输出文件。请确认工作流包含保存图像或视频的输出节点。');
          return;
        }
      }
      setMessage('仍在生成中。ComfyUI 可以继续运行；请重新检查任务历史。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '生成失败'); }
    finally { setBusy(false); }
  }
  function outputUrl(output: Output) {
    return `/api/comfy/view?filename=${encodeURIComponent(output.filename)}&subfolder=${encodeURIComponent(output.subfolder || '')}&type=${encodeURIComponent(output.type || 'output')}`;
  }
  return <main className="local-shell">
    <header className="local-head"><a href="/">← 工作台</a><div><h1>本机 ComfyUI 连接</h1><p>工作流和生成任务在本机运行；无需视频生成 API 密钥。</p></div><button onClick={check} className="local-button">重新检测</button></header>
    <section className="local-panel"><h2>连接状态</h2><p className={connection.connected ? 'ok' : 'error'}>{connection.connected ? '已连接本机 ComfyUI' : connection.error || '检测中…'}</p><p className="local-muted">地址：127.0.0.1:8188 {connection.devices?.map((d, i) => <span key={i}> · {d.name || 'GPU'} {typeof d.vram_total === 'number' ? `(${Math.round(d.vram_total / 1024 / 1024)} MB VRAM)` : ''}</span>)}</p></section>
    <section className="local-panel"><h2>场景提示词</h2><label>正向提示词</label><textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} /><label>负向提示词</label><textarea rows={2} value={negative} onChange={(e) => setNegative(e.target.value)} /></section>
    <section className="local-panel"><h2>ComfyUI API 工作流</h2><p>在 ComfyUI 中使用“Save (API Format)”导出 JSON 并导入。请确认工作流使用已安装的模型和节点。把正向提示词设为 <code>{'{{PROMPT}}'}</code>，负向设为 <code>{'{{NEGATIVE_PROMPT}}'}</code>，随机种子设为 <code>{'{{SEED}}'}</code>。应用只替换这些文本标记，不会自动改造节点。</p><input type="file" accept=".json,application/json" onChange={loadFile} /><textarea className="workflow-json" aria-label="API workflow JSON" value={workflow} onChange={(e) => updateWorkflow(e.target.value)} placeholder="导入 ComfyUI API 格式工作流 JSON…" /><div className="local-actions"><button className="local-button" onClick={() => updateWorkflow(example)}>载入示例图片工作流</button><button className="local-button primary" disabled={busy || !connection.connected || !workflow.trim() || !prompt.trim()} onClick={generate}>{busy ? '生成中…' : '提交到本机生成'}</button></div><p className="local-muted">示例仅生成静态图片，不是视频。生成视频必须导入已安装视频模型和对应节点的 API 工作流。示例中的模型文件名需要改成你本机实际安装的文件名。</p></section>
    {message && <section className="local-panel"><h2>任务状态</h2><p>{message}</p>{outputs.map((output, i) => { const src = outputUrl(output); return <div key={`${output.filename}-${i}`} className="local-output">{output.kind === 'image' ? <a href={src} target="_blank" rel="noreferrer"><img src={src} alt={`ComfyUI output ${i + 1}`} /></a> : output.kind === 'video' ? <video src={src} controls playsInline /> : <a href={src} target="_blank" rel="noreferrer">下载 {output.filename}</a>}<small>{output.filename}</small><a className="local-button small" href={src} download={output.filename}>下载文件</a></div>; })}</section>}
    <section className="local-warning">安全提示：只连接本机 loopback ComfyUI。不要把 ComfyUI 的未认证端口公开到互联网。此页面不会下载模型或绕过服务限制。</section>
  </main>;
}
