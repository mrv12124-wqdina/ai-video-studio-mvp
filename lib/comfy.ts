const configured = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';

export function getComfyBaseUrl() {
  const url = new URL(configured);
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (!loopback || url.protocol !== 'http:') {
    throw new Error('COMFYUI_URL must be an HTTP loopback address (localhost/127.0.0.1/::1). Do not expose ComfyUI publicly.');
  }
  return url.origin;
}
