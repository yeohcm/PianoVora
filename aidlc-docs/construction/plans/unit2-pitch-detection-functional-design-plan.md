# Unit 2: Pitch Detection — Functional Design Plan

## Unit Context
- **Stories**: FEAT-02 (Pitch Detection), FEAT-07 (Note History — data layer)
- **PRD**: PD-01–PD-07, UI-07 (data)
- **Source files**: `src/shared/pianoGeometry.ts`, `src/shared/types.ts` (completed), `src/store/pitchSlice.ts`, `src/features/pitch/usePitchDetector.ts`
- **Dependencies**: Unit 1 `analyserRef`, `audioSlice.isListening`, `audioSlice.noiseGateThreshold`; `pitchy` npm package
- **Output for Unit 3**: `pitchSlice.detectedNote` (keyIndex, noteName) via Zustand

## Already Determined (No Questions Needed)

| Decision | Detail |
|---|---|
| Pitch detection library | `pitchy` (YIN/McLeod); `PitchDetector.forFloat32Array(FFT_SIZE)` |
| Input buffer | `Float32Array(2048)` — read from `analyserRef.current.getFloatTimeDomainData()` |
| MIDI reference | A4 = 440Hz; MIDI note number of A4 = 69 |
| Piano range | A0 = 27.5Hz (MIDI 21) to C8 = 4186Hz (MIDI 108) |
| Key geometry | `getKeyGeometry(keyIndex, totalWidth)` — 52 white keys span totalWidth; black keys 60% width, 65% height, centred over gaps |
| Piano key count | 88 keys (indices 0–87; key 0 = A0, key 87 = C8) |
| Note history size | 5 most recent unique notes (UI-07) |
| `isBlackKey` | Black keys at semitones 1, 3, 6, 8, 10 within each octave |
| `keyIndexToNoteName` | Note names: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (12-TET) |
| Noise gate integration | Skip pitchy entirely when `audioSlice.isListening = false` or no audio signal |
| PBT scope | `pianoGeometry.ts` pure functions targeted for fast-check tests (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09) |

---

## Open Questions

---

### Question 1
**pitchy Clarity Threshold**

`pitchy` returns `[frequency, clarity]` where clarity is a 0–1 confidence score. Below a threshold, the detection is unreliable and should be discarded.

A higher threshold reduces false detections (noise mistaken for a note) but may miss soft notes. Since PianoVora disables all browser audio processing (clean raw signal, no AGC), a higher threshold is appropriate.

A) **0.95** — High confidence only. Virtually eliminates false detections on clean signals; may miss the very first transient frame of a note onset. Recommended for clean microphone capture.
B) **0.90** — Medium-high confidence. Good balance between responsiveness and false-detection rejection in slightly noisy environments.
C) **0.85** — Lower confidence. More responsive but accepts weaker detections; risks showing incorrect notes during ambient noise if the noise gate is set low.
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2
**Sustained Note Handling — Store Update Strategy**

When the same note is held continuously, `usePitchDetector` runs ~60 times per second and detects the same note each frame. Should it update the Zustand `pitchSlice` every frame, or only when the note changes?

A) **Update on change only** — Write to `pitchSlice.detectedNote` only when the detected `keyIndex` differs from the previously detected `keyIndex`. Eliminates 60fps store writes for sustained notes; Unit 3 components re-render only on actual note changes. Requires a `prevKeyIndexRef` to track the last emission.
B) **Update every frame** — Always write to `pitchSlice.detectedNote` with a fresh timestamp. Simpler logic; allows Unit 3 to use the timestamp to determine note recency and drive fade-out timing. Higher store update frequency (60fps) even for sustained notes.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
**Note Release Debounce**

A single missed detection frame (pitchy returns null or clarity below threshold) can cause a one-frame gap in a sustained note, making the visual glow flicker. A debounce window holds the last detected note for N frames before emitting `null` (note released).

A) **Immediate (0 frames debounce)** — Note is released the first frame pitchy returns null/low-clarity. Maximally responsive to note release; may cause single-frame flicker on noisy input.
B) **Short debounce (3 frames / ~50ms)** — Hold the last note for 3 consecutive null frames before emitting null. Prevents flicker on transient detection gaps; adds up to ~50ms of "tail" to the displayed note. Recommended for balance.
C) **Extended debounce (6 frames / ~100ms)** — Holds for ~100ms. Eliminates all flicker on typical microphone input; matches the 100ms end-to-end latency budget, so note release is at the boundary of noticeable delay.
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Functional Design Artifact Checklist (executed after answers)

- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/functional-design/business-logic-model.md`
  - [x] Pitch detection pipeline flow (analyserRef → pitchy → frequency → MIDI → keyIndex → store)
  - [x] Note change detection flow (per Q2 answer)
  - [x] Note release / null emission flow (per Q3 debounce answer)
  - [x] Note history update flow
  - [x] pianoGeometry pure function data flows
- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/functional-design/business-rules.md`
  - [x] Clarity threshold rule (per Q1 answer)
  - [x] Piano range filter rule (27.5Hz–4186Hz; out-of-range → null)
  - [x] Noise gate integration rule (skip detection when not listening)
  - [x] Note history rules (max 5, deduplication/change tracking)
  - [x] MIDI mapping rules (A4=440Hz, equal temperament formula)
  - [x] Black key identification rules (semitone pattern)
- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/functional-design/domain-entities.md`
  - [x] `DetectedNote` entity (complete definition)
  - [x] `PitchSliceState` entity
  - [x] `pianoGeometry.ts` pure function signatures and contracts
  - [x] Internal hook refs for usePitchDetector
- [x] Note: No `frontend-components.md` — Unit 2 has no UI components (hook only)
