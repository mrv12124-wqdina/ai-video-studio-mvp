'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

type Scene = { id: string; text: string; prompt: string; seconds: number };
type Chapter = { id: string; title: string; scenes: Scene[] };
type Character = { id: string; name: string; profile: string };
type Project = { name: string; novel: string; style: string; chapters: Chapter[]; characters: Character[]; ratio: '9:16' | '16:9' | '1:1' };
const STORAGE_KEY = 'novel-video-studio-project-v1';
const newId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const initial: Project = { name: '我的小说短片', novel: '', style: '电影感写实，真实自然的光影，镜头稳定，构图清晰', chapters: [], characters: [], ratio: '9:16' };

function splitScenes(text: string, limit = 70): Scene[] {
  const pieces = text.replace(/\r/g, '').split(/(?<=[。！？!?；])|\n+/).map((part) => part.trim()).filter(Boolean);
  const result: Scene[] = []; let current = '';
  for (const piece of pieces) {
    if (current && current.length + piece.length > limit) { result.push(makeScene(current)); current = ''; }
    if (piece.length > limit) {
      let rest = piece;
      while (rest.length > limit) { result.push(makeScene(rest.slice(0, limit))); rest = rest.slice(limit); }
      current = rest;
    } else current += piece;
  }
  if (current) result.push(makeScene(current));
  return result;
}
function makeScene(text: string): Scene { return { id: newId(), text, prompt: '', seconds: Math.max(3, Math.min(8, Math.ceil(text.length / 6))) }; }
function makeChapter(title: string, body: string): Chapter { return { id: newId(), title, scenes: splitScenes(body) }; }
function parseNovel(text: string, target = 900): Chapter[] {
  const headings = [...text.matchAll(/^\s*(第[\u4e00-\u9fa5\d]+[章节回部篇集])\s*[:：、]?\s*(.*)$/gm)];
  if (headings.length) return headings.map((match, index) => {
    const start = (match.index || 0) + match[0].length; const end = headings[index + 1]?.index ?? text.length;
    const title = `${match[1]}${match[2] ? `：${match[2]}` : ''}`.trim();
    return makeChapter(title, text.slice(start, end).trim());
  }).filter((chapter) => chapter.scenes.length);
  const paragraphs = text.split(/\n+/).map((s) => s.trim()).filter(Boolean); const chapters: Chapter[] = []; let current = '';
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > target) { chapters.push(makeChapter(`第${chapters.length + 1}集`, current)); current = ''; }
    current += (current ? '\n' : '') + paragraph;
  }
  if (current) chapters.push(makeChapter(`第${chapters.length + 1}集`, current));
  return chapters;
}
function safeLoad(value: string | null): Project | null {
  if (!value) return null;
  try { const parsed = JSON.parse(value); if (typeof parsed?.name === 'string' && Array.isArray(parsed.chapters)) return { ...initial, ...parsed }; } catch { /* ignore corrupt local save */ }
  return null;
}

export default function Home() {
  const [project, setProject] = useState<Project>(initial); const [ready, setReady] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0); const [sceneIndex, setSceneIndex] = useState(0); const [target, setTarget] = useState(900);
  const [notice, setNotice] = useState('项目只保存在当前浏览器。请定期导出 JSON 备份。'); const [playing, setPlaying] = useState(false);
  useEffect(() => { const stored = safeLoad(localStorage.getItem(STORAGE_KEY)); if (stored) setProject(stored); setReady(true); }, []);
  useEffect(() => { if (ready) { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); } }, [project, ready]);
  const currentChapter = project.chapters[chapterIndex]; const currentScene = currentChapter?.scenes[sceneIndex];
  const shotCount = useMemo(() => project.chapters.reduce((sum, chapter) => sum + chapter.scenes.length, 0), [project.chapters]);
  function update(patch: Partial<Project>) { setProject((old) => ({ ...old, ...patch })); }
  function analyze() {
    if (project.novel.trim().length < 20) { setNotice('请先粘贴至少 20 个字的小说正文。'); return; }
    const chapters = parseNovel(project.novel, target);
    if (!chapters.length) { setNotice('没有解析到正文，请检查文本格式。'); return; }
    update({ chapters }); setChapterIndex(0); setSceneIndex(0);
    setNotice(`拆分完成：${chapters.length} 集、${chapters.reduce((n, c) => n + c.scenes.length, 0)} 个镜头。人物不会自动猜测，请手动建立角色档案。`);
  }
  function updateChapter(index: number, patch: Partial<Chapter>) { setProject((old) => ({ ...old, chapters: old.chapters.map((chapter, i) => i === index ? { ...chapter, ...patch } : chapter) })); }
  function updateScene(ci: number, si: number, patch: Partial<Scene>) { setProject((old) => ({ ...old, chapters: old.chapters.map((chapter, i) => i === ci ? { ...chapter, scenes: chapter.scenes.map((scene, j) => j === si ? { ...scene, ...patch } : scene) } : chapter) })); }
  function addCharacter() { update({ characters: [...project.characters, { id: newId(), name: '', profile: '' }] }); }
  function updateCharacter(index: number, patch: Partial<Character>) { update({ characters: project.characters.map((character, i) => i === index ? { ...character, ...patch } : character) }); }
  function buildPrompt(scene: Scene) {
    const names = project.characters.filter((c) => c.name.trim()).map((c) => `${c.name}（${c.profile || '外观按角色设定保持一致'}）`).join('；');
    return `${project.style.trim()}。场景内容：${scene.text}。${names ? `角色设定：${names}。` : ''}无字幕、无水印。`;
  }
  function speak() {
    if (!currentScene || !('speechSynthesis' in window)) { setNotice('此浏览器不支持中文语音朗读。'); return; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(currentScene.text); utterance.lang = 'zh-CN'; utterance.rate = 0.92;
    utterance.onstart = () => setPlaying(true); utterance.onend = () => setPlaying(false); utterance.onerror = () => setPlaying(false); window.speechSynthesis.speak(utterance);
  }
  function stopSpeak() { window.speechSynthesis?.cancel(); setPlaying(false); }
  function exportProject() { const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${project.name || 'novel-project'}.json`; a.click(); URL.revokeObjectURL(url); setNotice('项目 JSON 已导出。'); }
  async function importProject(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; try { const imported = safeLoad(await file.text()); if (!imported) throw new Error('项目格式无效'); setProject(imported); setChapterIndex(0); setSceneIndex(0); setNotice('项目导入成功。'); } catch { setNotice('导入失败：请选择本工作台导出的有效 JSON 文件。'); } event.target.value = ''; }
  function addScene(ci: number) { const chapter = project.chapters[ci]; updateChapter(ci, { scenes: [...chapter.scenes, makeScene('新镜头：请编辑此处的剧情内容。')] }); }
  function removeScene(ci: number, si: number) { const chapter = project.chapters[ci]; updateChapter(ci, { scenes: chapter.scenes.filter((_, i) => i !== si) }); setSceneIndex(0); }

  return <main className="studio">
    <header className="studio-header"><div><div className="brand">◈ 小说短片制作工作台</div><div className="local-muted">本地项目流程 · 暂不依赖正在下载的模型</div></div><div className="header-actions"><a className="local-button" href="/comfy">ComfyUI 连接</a><button className="local-button" onClick={exportProject}>导出项目备份</button><label className="local-button file-button">导入项目<input type="file" accept=".json,application/json" onChange={importProject} /></label></div></header>
    <div className="studio-status">{notice}</div>
    <div className="studio-grid">
      <aside className="studio-column">
        <section className="local-panel"><div className="section-title"><span>01</span><div><h2>小说与项目</h2><small>文本留在本机浏览器，不会上传</small></div></div>
          <label>作品名称<input className="studio-input" value={project.name} onChange={(e) => update({ name: e.target.value })} /></label>
          <label>粘贴小说正文<textarea className="studio-textarea novel-input" value={project.novel} onChange={(e) => update({ novel: e.target.value })} placeholder="粘贴你拥有改编权的小说正文……" /></label>
          <div className="form-row"><label>无章节标题时每集字数<input type="number" min="300" max="3000" value={target} onChange={(e) => setTarget(Math.max(300, Number(e.target.value) || 900))} /></label><label>画幅<select value={project.ratio} onChange={(e) => update({ ratio: e.target.value as Project['ratio'] })}><option value="9:16">竖屏 9:16</option><option value="16:9">横屏 16:9</option><option value="1:1">方形 1:1</option></select></label></div>
          <button className="local-button primary full" onClick={analyze}>拆分章节与镜头</button>
          <p className="local-muted">规则按中文章节标题、标点和段落拆分，不会把普通词猜成人名。内容仍需人工校对。</p>
        </section>
        <section className="local-panel"><div className="section-title"><span>02</span><div><h2>角色档案</h2><small>手动确认，避免错误识别人名</small></div><button className="local-button" onClick={addCharacter}>＋ 添加角色</button></div>
          {!project.characters.length && <p className="local-muted">还没有角色。请手动添加，填写姓名和外观设定。</p>}
          {project.characters.map((character, i) => <div className="character-edit" key={character.id}><input placeholder="角色姓名" value={character.name} onChange={(e) => updateCharacter(i, { name: e.target.value })} /><textarea placeholder="外观/服装/年龄等一致性设定" value={character.profile} onChange={(e) => updateCharacter(i, { profile: e.target.value })} /><button className="text-danger" onClick={() => update({ characters: project.characters.filter((_, j) => j !== i) })}>删除</button></div>)}
        </section>
        <section className="local-panel"><div className="section-title"><span>03</span><div><h2>统一画面风格</h2><small>作为镜头提示词的基础</small></div></div><textarea className="studio-textarea" rows={3} value={project.style} onChange={(e) => update({ style: e.target.value })} /></section>
      </aside>
      <section className="studio-column">
        <section className="local-panel"><div className="section-title"><span>04</span><div><h2>分集和镜头</h2><small>{project.chapters.length} 集 · {shotCount} 镜头</small></div><button className="local-button" onClick={exportProject}>导出剧本 JSON</button></div>
          {!project.chapters.length && <div className="empty-workflow">粘贴小说并点击“拆分章节与镜头”后，分镜会显示在这里。</div>}
          {project.chapters.map((chapter, ci) => <article className="episode" key={chapter.id}><div className="episode-head"><input value={chapter.title} onChange={(e) => updateChapter(ci, { title: e.target.value })} aria-label="分集标题" /><span>{chapter.scenes.length} 镜头</span><button className="text-danger" onClick={() => { update({ chapters: project.chapters.filter((_, i) => i !== ci) }); setChapterIndex(0); setSceneIndex(0); }}>删除分集</button></div>
            {chapter.scenes.map((scene, si) => <div className={`scene-row ${chapterIndex === ci && sceneIndex === si ? 'selected' : ''}`} key={scene.id}><button className="scene-select" onClick={() => { setChapterIndex(ci); setSceneIndex(si); }}>{String(si + 1).padStart(2, '0')}</button><textarea value={scene.text} onChange={(e) => updateScene(ci, si, { text: e.target.value })} aria-label="镜头文本" /><div className="scene-actions"><label>秒<input type="number" min="2" max="30" value={scene.seconds} onChange={(e) => updateScene(ci, si, { seconds: Math.max(2, Number(e.target.value) || 3) })} /></label><button className="text-danger" onClick={() => removeScene(ci, si)}>删除</button></div><details className="prompt-details"><summary>镜头提示词</summary><textarea value={scene.prompt || buildPrompt(scene)} onChange={(e) => updateScene(ci, si, { prompt: e.target.value })} /><button className="local-button small" onClick={() => updateScene(ci, si, { prompt: buildPrompt(scene) })}>按当前剧情生成提示词</button></details></div>)}
            <button className="local-button small" onClick={() => addScene(ci)}>＋ 添加镜头</button>
          </article>)}
        </section>
        <section className="local-panel preview-panel"><div className="section-title"><span>05</span><div><h2>镜头预览与旁白</h2><small>现阶段为文字分镜预览，等待本地画面模型可用</small></div></div>
          <div className={`story-preview ratio-${project.ratio.replace(':','-')}`}><div className="preview-overlay"><span>{currentChapter?.title || project.name}</span><strong>{currentScene?.text || '选中一个镜头，查看剧情内容'}</strong><small>{currentScene?.prompt || '生成画面提示词后会显示在这里'}</small></div></div>
          <div className="preview-controls"><button className="local-button" disabled={!currentScene} onClick={() => { if (chapterIndex > 0 || sceneIndex > 0) { const ci = sceneIndex > 0 ? chapterIndex : chapterIndex - 1; const si = sceneIndex > 0 ? sceneIndex - 1 : Math.max(0, (project.chapters[ci]?.scenes.length || 1) - 1); setChapterIndex(ci); setSceneIndex(si); } }}>上一镜头</button><span>{currentChapter ? `${chapterIndex + 1}/${project.chapters.length} 集 · ${sceneIndex + 1}/${currentChapter.scenes.length} 镜头` : '暂无镜头'}</span><button className="local-button" disabled={!currentChapter || sceneIndex >= currentChapter.scenes.length - 1} onClick={() => setSceneIndex(sceneIndex + 1)}>下一镜头</button><button className="local-button primary" disabled={!currentScene} onClick={playing ? stopSpeak : speak}>{playing ? '停止旁白' : '试听中文旁白'}</button></div>
          <p className="local-muted">中文旁白使用浏览器系统语音，仅用于试听，不会导出为成片音轨。真实配音、视频生成和数据库尚未接通；模型下载完成后再继续接入验证。</p>
        </section>
      </section>
    </div>
  </main>;
}
