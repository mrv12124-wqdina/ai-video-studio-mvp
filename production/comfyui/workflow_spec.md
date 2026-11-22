# Local ComfyUI Production Workflow Requirements

## Confirmed machine
- Windows 11 Pro
- Intel Core i5-12400F
- 16 GB RAM
- NVIDIA GeForce RTX 4060, 8 GB VRAM
- ComfyUI Standard installation

## Workflow families
1. Character reference / identity-preserving still image workflow.
2. Scene keyframe workflow using approved character references.
3. Video generation workflow with a verified video output node.
4. Optional face/detail repair and upscale workflow.
5. Audio workflow only if a real local audio model/node is installed and verified.
6. Separate post-production assembly via FFmpeg.

## Workflow acceptance
- Export API-format JSON from the actual local ComfyUI graph.
- Verify every class_type exists in the installed node registry.
- Verify every model file exists at the expected local path.
- Keep a known-good immutable workflow template; create per-shot copies with controlled input replacement.
- Character identity reference and scene reference must be explicit workflow inputs.
- Use stable seeds and recorded parameters for reproducibility; do not assume a seed alone guarantees identity.
- Respect 8 GB VRAM: use conservative resolution, frame count, batch size, precision, offload, and tiled decode as supported by the actual model.
- Do not claim native 2K/4K if the installed model only generates smaller frames; upscale and label honestly.
- Save source image, source video, workflow JSON, prompt, seed, model names, node versions, and logs alongside each shot.

## Required local audit before rendering
Copilot must inspect the actual local ComfyUI installation and report:
- ComfyUI version/commit
- Python and PyTorch versions
- CUDA runtime and GPU driver
- installed custom nodes
- available checkpoints/LoRAs/VAEs/ControlNet/IPAdapter/PuLID/video/audio models
- actual API workflow exported from the selected graph
- available disk space and output directory
- FFmpeg/ffprobe availability

Do not install or replace drivers, Python, PyTorch, CUDA, models, or custom nodes blindly. Preserve the working ComfyUI Standard installation.
