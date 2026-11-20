# 小说短片工作台

## 本机 ComfyUI（新）

访问 `http://localhost:3000/comfy` 使用本机 ComfyUI。应用服务器与 ComfyUI 必须在同一台电脑运行；ComfyUI 默认地址是 `http://127.0.0.1:8188`。可通过本机 `.env.local` 的 `COMFYUI_URL` 设置另一个 loopback 端口。应用只允许 localhost/127.0.0.1/::1，拒绝公网地址，避免将本机生成服务暴露给任意网络请求。

1. 启动标准 ComfyUI，保持终端运行；先在浏览器打开 `http://127.0.0.1:8188` 确认可访问。
2. 在项目目录运行 `npm install`、`npm run dev`，访问 `http://localhost:3000/comfy`。
3. 在 ComfyUI 中将工作流导出为 **Save (API Format)** JSON。导入该 JSON 到本页。
4. 在工作流文本编码节点内，把正向提示词替换为 `{{PROMPT}}`，负向提示词设为 `{{NEGATIVE_PROMPT}}`，采样种子可用 `{{SEED}}`。
5. 提交生成。生成图像可在页面查看；工作流需要对应模型和自定义节点已安装。

“载入示例图片工作流”只是用于验证连接与图片生成，不是视频生成；请把 `YOUR_MODEL.safetensors` 改为你已下载的 checkpoint 名称。生成视频需要导入适用于你已安装的视频模型的 ComfyUI API 工作流。不同节点包/模型的工作流结构不同，应用不会假装自动安装模型或节点。

**安全：**不要将 ComfyUI 端口映射到公网，不要在防火墙开放给互联网。本代理只允许连接回环地址。模型应从官方或授权来源下载，并遵守其许可证。4060 8GB 可运行部分量化/低分辨率工作流，但速度、可用分辨率和时长依模型而异，无法保证电影级成片。

## 原型与云端服务

仓库中的 `novel-video-studio.html` 是纯浏览器分镜原型。它不提供真实生成式影像。云端路由如 `app/api/video`、`app/api/voice`、`app/api/materials` 需配置相应自有服务密钥；本地 ComfyUI 生图不需要这些 API 密钥。

开发环境：Node.js 和 npm。

```bash
npm install
npm run dev
```
