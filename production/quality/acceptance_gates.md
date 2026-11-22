# Production Quality Gates — No User Debugging

## Gate 0 — Source and episode integrity
- Confirm exact source file hash and chapter boundary.
- Confirm one chapter maps to one episode.
- Confirm no chapter is missing, duplicated, merged, split, or renumbered.
- If source chapter is missing (currently Chapter 59), flag it and do not fabricate it.

## Gate 1 — Pre-production lock
- Confirm Character Bible V1.0 reference files exist on the local production machine.
- Confirm every speaking character has an approved voice asset or an explicitly approved provider voice ID.
- Confirm location, wardrobe, props, timeline, and screen-direction bibles.
- Confirm the episode script is traceable to source passages.

## Gate 2 — Storyboard completeness
Every shot record must include:
- episode/scene/shot IDs and source passage references
- purpose, duration, shot size, lens/framing, camera height/angle/movement
- character IDs, visual reference IDs, positions, eyelines, wardrobe and props
- action start / action development / action end
- facial performance, emotional intention, subtext, dialogue and timing
- lighting, color, environment, ambience, Foley, score cue
- previous-shot outgoing state and next-shot incoming state
- English image prompt, video motion prompt, negative prompt, ComfyUI workflow profile

No placeholder shot, generic prompt, missing speaker, or unspecified transition may pass.

## Gate 3 — Local ComfyUI preflight
- Confirm ComfyUI API is reachable on loopback.
- Inspect installed checkpoints, LoRAs, VAEs, ControlNet/IPAdapter/PuLID models, video models, custom nodes, and output nodes.
- Verify workflow JSON is API-format and all node class types exist locally.
- Validate input image paths, model names, dimensions, frame counts, and VRAM requirements.
- RTX 4060 8GB / 16GB RAM is the confirmed hardware target; choose a memory-safe workflow and batch size.
- Do not invent installed models, nodes, model IDs, or successful outputs.

## Gate 4 — Picture generation and continuity
- Render shots with locked character reference assets.
- Check faces, age, body proportions, hair, wardrobe, props, spatial positions, screen direction, lighting, and action continuity.
- Regenerate or repair failed shots before assembly.
- No slideshow or still-image-only sequence may be labeled as finished video.

## Gate 5 — Audio completion
- Generate all dialogue from the character voice registry.
- Confirm each line has correct speaker, pronunciation, timing, emotional delivery, and no clipping.
- Generate/obtain episode-specific score, ambience, and Foley.
- Keep dialogue/music/ambience/Foley stems separate through edit.
- Mix to clear dialogue, controlled music ducking, no clipping, and consistent loudness.
- If a required audio provider/model is unavailable, mark the episode blocked; do not silently export a mute video as final.

## Gate 6 — Edit and export
- Match-cut actions where appropriate; respect 180-degree axis and eyelines.
- Check transitions, pacing, scene geography, audio continuity, and chapter-ending beat.
- Burn or mux the approved subtitle track as specified; also provide SRT.
- Export 1920×1080, 24 fps, H.264 MP4, AAC audio, unless a verified model/output constraint requires an explicitly documented alternate.
- Preserve source clips, generated audio, project timeline, workflow JSON, and logs.

## Gate 7 — Automated final verification
- File exists and is non-zero.
- ffprobe can read the MP4; duration, frame size, frame rate, video stream, and audio stream are valid.
- Audio stream is present and audible; verify dialogue, music, and SFX are not missing.
- Subtitle SRT parses and timecodes fit the episode duration.
- Play the beginning, middle, and end; inspect representative frames and audio.
- Run shot-by-shot continuity checklist.
- Create a QC report. Only then set status to FINAL.

## Stop conditions
Stop and report a concrete blocker rather than fabricating completion when:
- source chapter is missing
- locked reference assets are unavailable locally
- required model/node is missing
- no working video workflow exists
- voice IDs/audio model are not configured
- final render lacks a valid audio stream
- output fails media validation
