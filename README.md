# AI Video Studio MVP

一个可本地运行的 AI 视频生成工作台，支持提示词、画幅比例、时长、任务队列和进度展示。

## 快速开始

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 当前版本说明

这是完整可运行的 Web MVP：

- 提交生成任务
- 排队和实时进度
- 完成后预览示例视频
- 支持横屏、竖屏和正方形比例
- 支持单次提交和批量重复提交

## 接入真实 AI 视频模型

当前 API 使用演示进度和演示视频。在生产环境中，可在 `app/api/jobs/route.ts` 的 `processJob` 函数中接入：

- OpenAI Sora 或兼容 API
- Runway
- Google Veo
- Minimax / Kling
- 自建 ComfyUI/Stable Video Diffusion 服务

接入时建议添加持久化队列（Redis、Postgres、BullMQ），对象存储（S3、R2）和视频合成工作节点。
