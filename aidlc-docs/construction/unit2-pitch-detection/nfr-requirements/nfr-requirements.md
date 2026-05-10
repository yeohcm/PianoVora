# Unit 2: Pitch Detection — NFR Requirements

---

## Performance

### NFR-P-01: End-to-End Detection Latency
- **Requirement**: Time from audio input (piano key strike) to note appearing in `pitchSlice.detectedNote` must be under 100ms
- **Target**: < 100ms
- **Source**: PD-04 (PRD); NFR-P-03
- **Budget breakdown**:
  - Unit 1 audio capture: ~2–4ms (rAF + getFloatTimeDomainData)
  - Unit 2 detection gate: 0ms (every 2nd frame — max additional wait 16ms)
  - pitchy.findPitch(): ~1–2ms
  - Zustand write + React re-render: ~1ms
  - Total max: ~35ms — well within 100ms budget

### NFR-P-02: pitchy CPU Cost
- **Requirement**: pitchy.findPitch() on a 2048-sample Float32Array must complete within the rAF frame budget without causing frame drops
- **Target**: < 5ms per call (measured characteristic: ~1–2ms)
- **Detection rate**: Every 2nd rAF frame (~30fps) — halves cumulative pitchy CPU to ~30–60ms/second
- **Source**: Q1 answer B

### NFR-P-03: Detection Sampling Rate
- **Requirement**: Pitch detection runs at ~30fps (every 2nd requestAnimationFrame callback)
- **Target**: 30fps detection; rAF loop still ticks at 60fps (for other uses such as Unit 3 animation)
- **Implementation**: `frameCountRef` toggles between 0 and 1 each rAF; pitchy is called only on even frames
- **Max detection latency from frame-gating**: ≤ 33ms (one skipped frame)
- **Source**: Q1 answer B

---

## Accuracy

### NFR-A-01: Single-Note Detection Accuracy
- **Requirement**: Pitch detection accuracy exceeds 95% for clean single-note piano input in normal room conditions
- **Target**: > 95% on 50 standard piano notes across the range
- **Source**: PD-06 (PRD); Launch Acceptance Criterion 1
- **Measurement**: Manual acceptance testing with a real piano — not automatable in unit tests
- **Contributing factors**: Clarity threshold 0.90, disabled browser audio processing (Unit 1), RMS noise gate (Unit 1), piano frequency range filter [27.5Hz–4186Hz]

### NFR-A-02: Piano Frequency Range Coverage
- **Requirement**: Detection covers the full 88-key piano range A0 (27.5Hz) to C8 (4186Hz)
- **Source**: PD-02 (PRD)
- **Out-of-range handling**: Frequencies outside this range are discarded (treated as null), not displayed as incorrect notes

---

## Reliability

### NFR-R-01: Null Guard on AnalyserNode
- **Requirement**: If `analyserRef.current` is null when the detection loop fires, the frame is silently skipped — no error thrown, no store write
- **Rationale**: `analyserRef` may be null briefly during Unit 1 start-up or after stop; `usePitchDetector` must not crash in this window

### NFR-R-02: Note Release Debounce
- **Requirement**: `detectedNote` is set to null only after 3 consecutive frames of null/below-threshold detection (~50ms)
- **Source**: Functional design Q3 answer B (BR-07)
- **Effect**: Prevents single-frame detection gaps from causing visual flicker in Unit 3

### NFR-R-03: isListening Guard
- **Requirement**: Pitch detection loop does not run when `audioSlice.isListening = false`; any non-null `detectedNote` is cleared immediately when listening stops
- **Source**: BR-03

### NFR-R-04: Sample Rate Accuracy
- **Requirement**: pitchy's `sampleRate` parameter must always reflect the AudioContext's actual sample rate — never hardcoded
- **Source**: BR-12; devices may run at 44,100Hz or 48,000Hz

---

## Security and Privacy

### NFR-S-01: No Pitch Data Transmitted
- **Requirement**: `detectedNote` (frequency, MIDI note, key index) is never transmitted to any server or external service
- **Source**: NFR-S-01 (inherited from Unit 1); PD-03

### NFR-S-02: Session-Only Pitch State
- **Requirement**: `pitchSlice.detectedNote` and `pitchSlice.noteHistory` exist in-memory only; cleared on page unload
- **Source**: NFR-S-03 (inherited); Zustand store is not persisted in Unit 2

---

## Browser Compatibility

### NFR-BC-01: pitchy Browser Support
- pitchy is a pure JavaScript/TypeScript library with no browser-specific APIs — runs identically on all supported browsers
- Relies only on `Float32Array` and `Math.log2` — both available in all ES2020+ environments

| Browser | Min Version | pitchy Compatibility | Notes |
|---|---|---|---|
| Chrome | 90+ | Full | Reference |
| Firefox | 90+ | Full | — |
| Safari | 14.1+ | Full | — |
| Edge | 90+ | Full | Chromium-based |

---

## Property-Based Testing (PBT)

### NFR-PBT-01: Round-Trip Property (PBT-02)
- **Target functions**: `frequencyToMidiNote` + inverse (`midiNoteToFrequency`, computed inline)
- **Property**: For any frequency `f` in [27.5, 4186.0], `midiNoteToFrequency(frequencyToMidiNote(f))` is within ±0.5 cents of `f`
- **Tool**: fast-check `fc.float({ min: 27.5, max: 4186.0 })`

### NFR-PBT-02: Invariant Properties (PBT-03)
- **Target**: `midiNoteToKeyIndex` — output always in [0, 87] for inputs [21, 108]
- **Target**: `getAllKeyGeometry(totalWidth)` — always returns exactly 88 rects, 52 white + 36 black
- **Target**: `getKeyGeometry` — all rects have `x >= 0`, `width > 0`, `height > 0`

### NFR-PBT-03: Domain Generators (PBT-07)
- **Frequency generator**: `fc.float({ min: 27.5, max: 4186.0 })` — constrained to piano range
- **MIDI generator**: `fc.integer({ min: 21, max: 108 })` — piano MIDI range
- **Key index generator**: `fc.integer({ min: 0, max: 87 })` — piano key range
- **Width generator**: `fc.float({ min: 100, max: 4000 })` — realistic SVG keyboard widths

### NFR-PBT-04: Shrinking and Reproducibility (PBT-08, PBT-09)
- **Shrinking**: fast-check automatic shrinking enabled (default); failing cases are minimised before reporting
- **Seed logging**: On any fast-check failure, the seed is printed to test output for exact reproduction
- **CI inclusion**: PBT tests run in `vitest run` (same as all unit tests); no separate CI step required
- **Framework documentation**: fast-check listed in `package.json` devDependencies and tech-stack-decisions.md
