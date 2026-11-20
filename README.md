# AI Video Studio MVP

一个用于体验视频创作界面的项目，包含 Next.js 网页版和无需安装依赖的单文件体验版。

## 最简单：直接打开单文件版

1. 打开仓库中的 [`ai-video-studio.html`](./ai-video-studio.html)。
2. 点击右上方的 **Download raw file** 下载到 Windows 电脑（也可点 Raw 后按 `Ctrl+S` 保存）。
3. 在下载文件上双击，用 Edge 或 Chrome 打开即可，无需安装 Git、Node.js 或 npm。

单文件版可以创建演示任务、查看模拟进度并播放示例视频。**它目前不会真正生成 AI 视频**；实际生成需要连接视频生成服务和配置 API 凭据。示例视频播放需要联网。

## 开发者运行网页版

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

当前网页版同样使用演示进度和示例视频。接入真实模型前，需要配置模型服务、服务端 API 凭据、任务队列和视频存储；不要把 API 密钥放进 HTML 文件。
