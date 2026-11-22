# 《我身边的极品美女们》系列短剧制作圣经

Version: 1.0.0  
Status: Production baseline  
Source: `我身边的极品美女们.txt` (SHA-256: `5a37d29c6695966ebf6a7a1af6be901685a08c6770d4196c0726504a6f2bf5af`)

## 1. Episode unit — non-negotiable

- The prologue/序言 is **EP00**.
- Every numbered source chapter is exactly one episode: Chapter 1 = EP01, Chapter 2 = EP02, and so on.
- Never merge two source chapters into one episode.
- Never split one source chapter across multiple episodes.
- A chapter may contain as many scenes and shots as its dramatic content requires. Do not force a fixed shot count or runtime.
- Each episode is rendered and delivered as its own complete MP4 with its own dialogue, music, sound effects, subtitles, and edit timeline.
- Episodes may share global character, voice, location, wardrobe, and visual assets, but their narrative boundaries remain independent.
- Do not pull a scene, line, reveal, or event from the next chapter into the current episode merely to create a cliffhanger. Preserve the source chapter's own ending.

## 2. Source audit

The supplied source contains:
- 1 prologue (EP00)
- 66 numbered chapters present: Chapters 1–58 and 60–67
- Chapter 59 is absent from the supplied file
- 67 source sections are currently available, therefore 67 current episode units including EP00
- When the missing Chapter 59 source is supplied, the complete sequence will contain 68 episodes including EP00

**Chapter 59 must remain a visible gap.** Do not invent its title, text, scenes, dialogue, or episode. Do not renumber Chapter 60 as Chapter 59. The production dashboard must show EP59 as `SOURCE_MISSING` / blocked and continue to preserve the original EP60–EP67 numbering.

## 3. Source fidelity

- The uploaded novel is the canonical source for plot, chronology, character relationships, dialogue, and chapter boundaries.
- Distinguish source facts from adaptation choices in all planning artifacts.
- Do not silently fill gaps or reconcile contradictions.
- Preserve the source's reveal order. In particular, unresolved identity and family-history clues must remain unresolved until the source reveals them.
- Any compression for runtime must preserve every causal beat, character decision, and chapter-ending beat. Do not delete material simply to fit a target duration.

## 4. Character identity continuity

- The approved Character Bible V1.0 is the immutable identity baseline for each approved character.
- Every character has one permanent character ID and one visual identity reference set.
- Facial structure, eye shape, nose, mouth, age version, body proportions, hair identity, and signature features are locked.
- Wardrobe may change only when justified by the source's scene, time, occupation, or continuity.
- Expressions, emotion, pose, lighting, and camera angle may vary; identity must not.
- New characters receive a unique identity and voice profile before entering production.
- If the approved reference image files are not physically available to the local ComfyUI machine, production must stop at asset preflight rather than silently substitute a newly invented face.

## 5. Voice identity continuity

- One character ID maps to one approved voice identity.
- Emotion may alter delivery, pitch contour, intensity, tempo, breath, and pauses; it must not cause a different base voice.
- Dialogue must be generated from the locked voice registry and line-level acting direction.
- Maintain pronunciation notes, names, recurring terms, language, and speaking habits.
- Never mark an episode final if any required spoken line is missing, assigned to the wrong speaker, clipped, or replaced by a generic narrator.
- Keep dialogue, music, ambience, and Foley on separate stems until final mix.

## 6. Visual language

- Live-action-adjacent semi-realistic cinematic drama; not overt anime, not plastic AI beauty imagery.
- Natural human anatomy, stable facial identity, believable skin and hair detail, physically plausible lighting and motion.
- Subtle organic film grain, restrained grade, realistic materials, motivated camera movement, coherent screen direction and eyelines.
- 16:9 master composition. Final delivery target: 1920×1080, 24 fps, H.264 MP4; higher-resolution masters only when the installed model/workflow genuinely supports them.
- Do not describe an upscaled 1080p source as native 4K.

## 7. Episode package

Each episode must have its own:
- source chapter extract and source-range record
- story breakdown and scene list
- complete shot list and storyboard/keyframes
- per-shot English image/video prompts and negative prompts
- character/wardrobe/prop/space continuity records
- dialogue script with speaker and performance direction
- voice files and pronunciation notes
- music cue sheet, ambience and Foley cue sheet
- subtitle SRT
- edit timeline and transition plan
- ComfyUI API workflow and generation logs
- final mixed MP4 and QC report

## 8. Release rule

A job is not a finished episode because ComfyUI rendered video clips. It is final only after picture edit, dialogue, score, ambience/Foley, subtitles, audio mix, encode, playback validation, and continuity review all pass. A silent montage or a folder of disconnected clips is not an accepted deliverable.
