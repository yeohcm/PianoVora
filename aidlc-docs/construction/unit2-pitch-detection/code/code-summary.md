# Unit 2: Pitch Detection — Code Summary

## Files Created

### `src/shared/pianoGeometry.ts`
Pure function module — zero React, zero Zustand, no side effects.

**Exports**: `frequencyToMidiNote`, `midiNoteToKeyIndex`, `keyIndexToNoteName`, `keyIndexToOctave`, `isBlackKey`, `getKeyGeometry`, `getAllKeyGeometry`

All functions apply defensive null returns for out-of-range inputs (Q2=B). A precomputed `WHITE_KEYS_BEFORE` array (IIFE, O(88)) makes `getKeyGeometry` O(1) with no per-call iteration.

Black key centering: centred on the boundary between its two flanking white keys per BR-15. No two adjacent black keys exist in the standard chromatic scale, so `keyIndex±1` are always white for any black key — no special-casing required.

---

### `src/store/pitchSlice.ts`
Zustand `StateCreator<PitchState>` slice, same pattern as `audioSlice.ts`.

**State**: `detectedNote: DetectedNote | null`, `noteHistory: DetectedNote[]` (max 5, most recent first)

**Setters**: `setDetectedNote`, `setNoteHistory`

---

### `src/store/appStore.ts` (modified)
`AppState` extended from `AudioState` to `AudioState & PitchState`. `createPitchSlice` composed alongside `createAudioSlice`.

---

### `src/features/pitch/usePitchDetector.ts`
Hook with all logic inline — no sub-components extracted. Returns `void`; all output goes through Zustand.

**Inline sub-components**:
- **Timestamp frame gate**: `performance.now()` with 33ms minimum — enforces ~30fps detection under variable rAF rates (Q1=B)
- **Null guard**: skips frame silently if `analyserRef.current` is null (NFR-R-01)
- **Debounce coordinator**: 3-frame `nullFrameCountRef` hold before emitting null (BR-07)
- **Note change emitter**: `prevKeyIndexRef` suppresses store writes for sustained notes (BR-04)

**Key implementation notes**:
- `pitchDetectorRef` typed as `ReturnType<typeof PitchDetector.forFloat32Array>` to avoid TypeScript 5.x `ArrayBufferLike` vs `ArrayBuffer` mismatch
- `bufferRef` is `Float32Array<ArrayBuffer>` — pre-allocated, mutated in-place, never reallocated (NFR-P-02)
- `cancelled` flag in the `useEffect` closure prevents the loop from rescheduling after cleanup
- Note history reads from `useAppStore.getState().noteHistory` at write time (not captured as closure) to always get latest state

---

## Files Created (Tests)

### `src/__tests__/shared/pianoGeometry.test.ts`
- 30 standard unit tests across all 7 functions
- **PBT (fast-check)**:
  - PBT-02 round-trip: `fc.float({ min: 27.5, max: 4186.0 })` → inverse within ±50 cents
  - PBT-03 invariant: `fc.integer({ min: 21, max: 108 })` → `midiNoteToKeyIndex` always in [0, 87]
  - PBT-03 geometry: `fc.float({ min: 100, max: 4000 })` → 88 rects, 52 white, 36 black, all positive dimensions
  - Null-return: arbitrary integers outside valid ranges → null, never throws
  - All fast-check assertions use `{ seed: 42, verbose: true }` (PBT-08, PBT-09)

### `src/__tests__/features/pitch/usePitchDetector.test.ts`
- Mocked: `pitchy` (`PitchDetector.forFloat32Array`), `requestAnimationFrame`, `cancelAnimationFrame`, `performance.now`
- Tests: loop start/stop, timestamp gate, null guard, valid detection (A4→MIDI 69), clarity filter, 3-frame debounce hold/release/reset, change detection, note history prepend and 5-entry cap

## Story Coverage

| Story | Status |
|---|---|
| FEAT-02: Pitch Detection (PD-01–PD-07) | Complete |
| FEAT-07: Note History Panel — data layer | Complete |
