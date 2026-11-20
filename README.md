# 小说短片生产工作台

这个仓库提供小说自动改编、分集、分镜、人物档案、素材检索、配音和导出的生产型架构。浏览器工具可直接使用；真实云端画面生成、配音及素材检索需要你自己的账户和 API 密钥。

## 立即使用：无需安装的小说工作台

打开 [`novel-video-studio.html`](./novel-video-studio.html)，点击 **Download raw file**，保存后双击打开。

它可以：

- 导入完整小说并按章节、集数和镜头字数拆分
- 自动识别常见人物并生成角色档案
- 为抖音、外网、方形画幅生成分镜字幕画面
- 播放浏览器中文朗读或上传配乐
- 导出当前分集 WebM 和完整剧本 JSON
- 在浏览器中持续编辑和保存项目数据

## 云端生产模式

复制 `.env.example` 为 `.env.local`，只在部署平台或本机开发环境中填写密钥：

- `VIDEO_API_URL`：兼容的图片/视频生成服务端点
- `VIDEO_API_KEY`：视频生成密钥
- `PEXELS_API_KEY`：素材搜索密钥（可选）
- `ELEVENLABS_API_KEY` 和 `ELEVENLABS_VOICE_ID`：自然配音（可选）
- `PUBLIC_VIDEO_BASE_URL`：成片存储地址（可选）

密钥只允许放在服务端环境变量，不要放进 HTML、GitHub 或聊天内容。

接入的服务器路由：

- `POST /api/project`：小说拆章、分镜、人物识别
- `POST /api/video`：安全代理视频生成请求
- `GET /api/materials?q=关键词&type=videos`：搜索 Pexels 合法素材
- `POST /api/voice`：生成旁白音频
- `GET /api/project`：检查哪些云端能力已配置

### 开发者版

需要 Node.js 和 npm：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 发布前注意事项

- 只使用拥有改编权、配音权和素材授权的小说与素材。
- 配乐、人物形象和字体也应确认商业使用授权。
- 发布前检查平台关于 AI 标识、虚构人物、广告与隐私的规则。
- 人物一致性应采用参考图、角色 LoRA 或角色一致性模型，而不是依赖随机提示词。
- 导出成片前应进行人工字幕校对、敏感内容审查和画面连续性检查。
