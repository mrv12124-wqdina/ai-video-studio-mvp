'use client';

import { useEffect, useRef, useState } from 'react';

type Job = { id: string; title: string; status: 'queued' | 'generating' | 'assembling' | 'completed' | 'failed'; progress: number; current: number; total: number; message: string; videoUrl?: string; subtitlesUrl?: string; error?: string };
const novel = `序言
我身边的极品美女们
暮春四月，春意阑珊

牡丹盛开，璀璨如锦

芍药争辉，益增繁华

春暖花开之际正是旅游出行踏青、放松心情的最佳时段，然而此时的江南省南州市的市民却享受不到这种乐趣，原因无他，整个南州市全面戒严，所有出市区的车辆都受到了极其严格的盘查，大大影响了出游的兴致。而同时间，数不清的警察站在大街小巷盘查每一个可疑的过往行人，尤其是那些怀中抱着孩子的妇女或是男子，更是受到了警察的注意。

同时间，一个个穿着黑色西服带着黑色墨镜的彪形大汉与便衣一同，人手一张照片，驱车行遍南州市的每个角落，不论是豪宅别墅抑或是低矮破败的简陋民房，都登门造访出示省委特别开具的特别许可证，搜寻一遍，他们行动间风风火火却也不失礼貌，只是一旦听到附近有婴儿啼哭的声音，便会勃然色变，箭也似的飞奔而去。

……

南州市北市郊有一家青云山庄，占地极广，这是一处宫殿式的建筑，画栋飞云、鳞次栉比，气势可谓恢宏壮观。山庄始建于明代，距今已有数百年历史，江南最大的丝绸家族方家世代居住于此，人称青云方家。

清朝末年，方家因为保护革命党人受到清廷走狗的残酷迫害，无奈之下背井离乡离开故土避难唐人街，其后青云山庄一度落入军阀与地方政要之手。

青云方家旅居海外也从未忘却自己是中国人是龙的子孙，在抗战时期率先响应陈嘉庚提出的“组织华侨千百万，复兴民族一条心”的口号，慷慨解囊支援祖国抗战活动，而建国后更是不遗余力的出资出物，为祖国的建设发展做出了卓越的贡献，方家的几代家主俱都多次受到国家领导人的亲切接见。

时至现在，方家已经是世界上最顶尖的巨富，此番方家的掌舵人也就是家主方天豪再次回到祖国，一来领着自己最疼爱的孙子方傲游故土拜祭祖先，二来就是以刚满两岁的方傲的名义捐献十亿美元在南州市的公益事业上、以加速故乡的发展，而这十亿美元，不存在利益往来纯是免费赠予。

如此大的手笔，不仅是南州市、江南省甚至是中央都极为重视，自方天豪回来之际，青云山庄便已经给他腾了出来，方便方天豪及其家人随从入住。虽说方天豪随身带了大量的保镖，可为了保证他的绝对安全，国家甚至出动了特别部队，由此可见国家对方天豪的重视。而南州市的政府官员更是趋之若鹜天天登门拜访这位著名爱国华侨，青云山庄冷清了几十年，终于再次传出欢歌笑语。

然而欢庆的气氛没能持续几天，青云山庄再次被一股子阴云笼罩着，每个人都战战兢兢的，政府车辆不时的驶入，更有大量警察穿梭往来，一个个都是神情肃然。

“砰！”山庄的主厅内传来震天价的巨响，其中夹杂着暴如雷霆的怒喝：“三天之内，孩子找不回来，你们统统都给我去死！”

说话之人是个约莫六十岁的男子，身穿古朴的唐装，鹰鼻黑发、怒目战须，神威凛然如天上巨神，高于常人的雄健体魄更像是千军万马中的不世神将。

这位威猛老者正是方天豪，享誉国际的著名爱国华侨，世界顶级富豪之一，青云方家的当代家主，此际的他宛如一尊亘古以来便存在的雕像一般，动也不动的盯着眼前的一众人，眼神凶厉的近乎狰狞。

大厅内人员极多，有一身黑衣的彪形大汉，有穿着仆役服装的男女，有医生护士，谁都不敢望着威猛如虎的方天豪，每个人都是噤若寒蝉、面色煞白，宛如末日即将来临一般。

方天豪颤抖着手拿起放在桌子上的一个相框，照片上是个婴儿，粉雕玉琢一般、极是可爱，粉嫩的小手指着方天豪，一张小嘴裂开笑得灿烂极了。

“我的好傲儿，爷爷好想你啊，两天了，你在哪里？”伸出手指轻轻摩挲着相片中婴儿的笑脸，方天豪面上刚硬的轮廓瞬间变得柔情一片，片刻后却是泪眼婆娑，男儿有泪不轻弹、只是未到伤心处，此际的方天豪再也不是那个叱咤商场睥睨天下的枭雄，而只是一个慈祥而又无计可施的爷爷。

“传我的命令…”老泪纵横的方天豪开口了，声音虚弱，“白道也好，黑道也罢，无论是谁，只要找到我的傲儿，我方天豪任他开条件，权势财富，便是他要我方家全部的财产，也由的他。”

心神疲惫两天两夜没有阖眼的方天豪再也支撑不住，眼前一黑在众人齐声惊呼声中晕了过去……`;

export default function FilmPage() {
  const [text, setText] = useState(novel);
  const [title, setTitle] = useState('我身边的极品美女们 · 序言');
  const [style, setStyle] = useState('电影感写实，江南暮春氛围，真实自然光影，稳健电影构图');
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  async function create() {
    setBusy(true); setError(''); setJob(null);
    try {
      const response = await fetch('/api/film', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ novel: text, title, style }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '无法创建视频任务。');
      setJob(data);
      timer.current = setInterval(async () => {
        try {
          const update = await fetch(`/api/film?id=${encodeURIComponent(data.id)}`, { cache: 'no-store' }).then((res) => res.json());
          setJob(update);
          if (update.status === 'completed' || update.status === 'failed') {
            if (timer.current) clearInterval(timer.current);
            setBusy(false);
          }
        } catch { /* retry next poll */ }
      }, 2000);
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); setBusy(false); }
  }

  return <main className="film-app">
    <header className="film-header"><div className="film-brand">◈ 小说成片工坊</div><div className="film-subtitle">小说 → ComfyUI 镜头 → 自动合成视频与字幕</div><div className="film-badge">本机生成 · 不上传小说</div></header>
    <div className="film-layout">
      <section className="film-editor">
        <div className="film-section-head"><span>01</span><div><h1>输入小说</h1><p>自动拆章节和镜头；本地 ComfyUI 逐镜生成，再自动合成一部视频。</p></div></div>
        <label className="film-label">作品名称<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="film-label">小说正文<textarea value={text} onChange={(e) => setText(e.target.value)} rows={18} /></label>
        <label className="film-label">统一视觉风格<input value={style} onChange={(e) => setStyle(e.target.value)} /></label>
        <button className="film-generate" disabled={busy || text.trim().length < 50} onClick={create}>{busy ? '制作中…' : '开始生成小说视频'}</button>
        <p className="film-note">程序会尝试复用 ComfyUI 最近成功的视频工作流。请保持 ComfyUI 和此页面运行。每个镜头都需单独推理，整章可能需要较长时间。生成结果为静音视频，并附带 SRT 字幕；旁白配音暂不包含。</p>
      </section>
      <section className="film-result">
        <div className="film-section-head"><span>02</span><div><h2>成片进度</h2><p>逐镜生成后自动拼接</p></div></div>
        {!job && !error && <div className="film-empty">小说已经载入。确认正文后，点击「开始生成小说视频」。</div>}
        {error && <div className="film-error">{error}</div>}
        {job && <div className="film-job"><div className="film-status">{job.status === 'completed' ? '成片已完成' : job.status === 'failed' ? '制作失败' : job.message}</div><div className="film-progress"><i style={{ width: `${job.progress}%` }} /></div><div className="film-progress-label">{job.total ? `${job.current} / ${job.total} 个镜头 · ` : ''}{job.progress}%</div><p>{job.message}</p>{job.status === 'failed' && <div className="film-error">{job.error}</div>}{job.status === 'completed' && job.videoUrl && <><video className="film-video" src={job.videoUrl} controls playsInline /><div className="film-downloads"><a href={job.videoUrl} download>下载成片 MP4</a><a href={job.subtitlesUrl} download>下载字幕 SRT</a></div></>}</div>}
        <div className="film-disclaimer">视频由本机 ComfyUI 已成功运行的工作流生成。ComfyUI 历史记录必须保留该视频任务，否则无法自动复用工作流。</div>
      </section>
    </div>
  </main>;
}
