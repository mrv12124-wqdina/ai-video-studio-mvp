# Audio Production Specification

## Required deliverables per episode
1. Character dialogue stems (one file per line or per scene, speaker ID embedded in metadata).
2. Episode narration only where the source calls for narration; do not turn all prose into generic narration.
3. Original or properly licensed score stems.
4. Ambience and Foley stems.
5. Final stereo mix (AAC in MP4) plus separate WAV master where available.
6. Dialogue transcript and time-aligned SRT.

## Voice identity
- Use `production/audio/voice_registry.json` as the single source of truth.
- A character's base voice ID must not change between episodes.
- Use acting controls for emotion, pace, pauses, breath, and intensity without changing speaker identity.
- Store provider, model, speaker ID, settings, pronunciation dictionary version, and sample asset path for every generated take.
- Do not clone a real person's voice without explicit rights and consent. Use licensed synthetic voices or user-authorized voices.

## Music and sound
- Score must be episode-specific and follow dramatic beats; no single generic loop across the whole series.
- Music cues need start/end time, intensity, instrumentation, transition, and dialogue-ducking instructions.
- Ambience and Foley are separate from score and dialogue.
- All generated or sourced audio must have rights/provenance metadata.

## Current integration facts
- The current repository has an ElevenLabs endpoint that accepts one environment-configured voice ID. It is not yet a multi-character voice registry and it does not generate a full episode mix.
- No audio generation or music workflow is assumed to exist on the local ComfyUI installation until Copilot verifies the installed nodes/models and performs a real test.
- A silent MP4 must never be reported as a completed episode.
