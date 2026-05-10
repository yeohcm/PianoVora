# Unit 2: Pitch Detection — Code Generation Plan

## Unit Context

**Stories implemented**:
- FEAT-02: Pitch Detection (primary — PD-01 through PD-07)
- FEAT-07: Note History Panel (data layer — `noteHistory` in pitchSlice)

**Dependencies**:
- Unit 1 must be complete (provides `analyserRef`, `isListening`, `audioSlice`)
- `src/shared/types.ts` — `DetectedNote`, `KeyRect` types already stubbed
- `src/store/appStore.ts` — Unit 1 stub, extended here to include `PitchState`

**Files being created**:

| File | Action |
|---|---|
| `src/shared/pianoGeometry.ts` | CREATE |
| `src/store/pitchSlice.ts` | CREATE |
| `src/store/appStore.ts` | MODIFY (extend AppState + compose pitchSlice) |
| `src/features/pitch/usePitchDetector.ts` | CREATE |
| `src/__tests__/shared/pianoGeometry.test.ts` | CREATE |
| `src/__tests__/features/pitch/usePitchDetector.test.ts` | CREATE |
| `aidlc-docs/construction/unit2-pitch-detection/code/code-summary.md` | CREATE |

---

## Steps

### Step 1: Create `src/shared/pianoGeometry.ts`

Pure function module — zero React, zero Zustand, no side effects.

Exports (all defensive — return `null` for out-of-range inputs):
- `frequencyToMidiNote(frequency: number): number | null` — formula: `Math.round(12 * Math.log2(frequency / 440) + 69)`, null if result outside [21, 108] or input outside [27.5, 4186.0]
- `midiNoteToKeyIndex(midiNote: number): number | null` — formula: `midiNote - 21`, null if midiNote outside [21, 108]
- `keyIndexToNoteName(keyIndex: number): string | null` — `NOTE_NAMES[(keyIndex + 21) % 12]`, null if keyIndex outside [0, 87]
- `keyIndexToOctave(keyIndex: number): number | null` — `Math.floor((keyIndex + 21 - 12) / 12)`, null if keyIndex outside [0, 87]
- `isBlackKey(keyIndex: number): boolean | null` — `BLACK_SEMITONES.has((keyIndex + 21) % 12)`, null if keyIndex outside [0, 87]
- `getKeyGeometry(keyIndex: number, totalWidth: number): KeyRect | null` — pixel geometry, null if keyIndex outside [0, 87] or totalWidth ≤ 0
- `getAllKeyGeometry(totalWidth: number): KeyRect[]` — array of 88 `KeyRect`, empty array if totalWidth ≤ 0

Constants (module-private):
- `NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']`
- `BLACK_SEMITONES = new Set([1, 3, 6, 8, 10])`
- `WHITE_SEMITONES = new Set([0, 2, 4, 5, 7, 9, 11])`

White key geometry:
- `whiteKeyWidth = totalWidth / 52`
- `whiteKeyHeight = whiteKeyWidth * 6.5`

Black key geometry:
- `blackKeyWidth = whiteKeyWidth * 0.60`
- `blackKeyHeight = whiteKeyHeight * 0.65`

Black key x-centering (BR-15): find left and right white neighbour positions, centre black key between them.

Story traceability: PD-07 (frequency → MIDI), KB-02 (accurate proportions via `getKeyGeometry`)

- [x] Step 1 complete

---

### Step 2: Create `src/store/pitchSlice.ts`

Zustand `StateCreator` slice — same pattern as `audioSlice.ts`.

```typescript
export interface PitchState {
  detectedNote:    DetectedNote | null;
  noteHistory:     DetectedNote[];
  setDetectedNote: (note: DetectedNote | null) => void;
  setNoteHistory:  (history: DetectedNote[]) => void;
}

export const createPitchSlice: StateCreator<PitchState> = (set) => ({
  detectedNote:    null,
  noteHistory:     [],
  setDetectedNote: (note) => set({ detectedNote: note }),
  setNoteHistory:  (history) => set({ noteHistory: history }),
});
```

Story traceability: FEAT-02 (detected note state), FEAT-07 (note history data)

- [x] Step 2 complete

---

### Step 3: Modify `src/store/appStore.ts`

Extend `AppState` to include `PitchState` and compose `createPitchSlice`.

```typescript
export type AppState = AudioState & PitchState;

export const useAppStore = create<AppState>()((...a) => ({
  ...createAudioSlice(...a),
  ...createPitchSlice(...a),
}));
```

- [x] Step 3 complete

---

### Step 4: Create `src/features/pitch/usePitchDetector.ts`

Hook with all inline sub-components. Returns `void` — all output via Zustand.

**Refs**:
```typescript
const pitchDetectorRef     = useRef<PitchDetector<Float32Array<ArrayBuffer>> | null>(null);
const bufferRef            = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
const animationFrameRef    = useRef<number>(0);
const lastDetectionTimeRef = useRef<number>(0);
const prevKeyIndexRef      = useRef<number | null>(null);
const nullFrameCountRef    = useRef<number>(0);
```

**Lifecycle**:
- On mount: create `PitchDetector.forFloat32Array(FFT_SIZE)` singleton
- `useEffect` on `isListening`: start/stop rAF loop; on false clear all state
- On unmount: cancel rAF, clear detectedNote

**rAF loop execution order**:
1. Timestamp gate (< 33ms → reschedule and return)
2. Null guard (`analyserRef.current === null` → reschedule and return)
3. `getFloatTimeDomainData(bufferRef.current)` — fills buffer
4. `findPitch(bufferRef.current, sampleRate)` — runs pitchy
5. Clarity + range check (BR-01, BR-02) — on fail → debounce path
6. `frequencyToMidiNote` + `midiNoteToKeyIndex` — convert to key index
7. Change detection vs `prevKeyIndexRef` (BR-04)
8. Build `DetectedNote`, write to `setDetectedNote`, prepend history `.slice(0, 5)`
9. Reschedule rAF

**Debounce path** (null/invalid frames):
- `nullFrameCountRef.current += 1`
- if ≥ 3: emit null, reset refs
- if < 3: hold (no write)

Story traceability: FEAT-02 (PD-01 through PD-07), FEAT-07 (history writes)

- [x] Step 4 complete

---

### Step 5: Create `src/__tests__/shared/pianoGeometry.test.ts`

Unit tests + PBT tests using `fast-check`.

**Standard unit tests**:
- `frequencyToMidiNote`: A4 (440Hz) → 69, A0 boundary (27.5Hz) → 21, C8 boundary (4186Hz) → 108, below-range (20Hz) → null, above-range (5000Hz) → null
- `midiNoteToKeyIndex`: 21 → 0, 108 → 87, 20 → null, 109 → null
- `keyIndexToNoteName`: 0 → 'A', 3 → 'C', 87 → 'C', out-of-range → null
- `keyIndexToOctave`: 0 → 0 (A0), 3 → 1 (C1), 87 → 8 (C8), out-of-range → null
- `isBlackKey`: known black keys (C#, D#, F#, G#, A#) → true, white keys → false, out-of-range → null
- `getKeyGeometry`: keyIndex 0 x=0, width>0, height>0; keyIndex -1 → null; totalWidth=0 → null
- `getAllKeyGeometry`: length=88, exactly 52 white + 36 black, totalWidth=0 → []

**PBT tests (fast-check)**:
- PBT-02 Round-trip: `fc.float({ min: 27.5, max: 4186.0 })` → `frequencyToMidiNote` returns non-null; inverse frequency from MIDI note within ±0.5 cents
- PBT-03 Invariants: `fc.integer({ min: 21, max: 108 })` → `midiNoteToKeyIndex` always in [0, 87]
- PBT-03 Geometry: `fc.float({ min: 100, max: 4000 })` → `getAllKeyGeometry` returns exactly 88 rects, 52 white, 36 black
- PBT-03 Geometry rects: all rects have `x >= 0`, `width > 0`, `height > 0`
- Arbitrary integer inputs → null (never throws, never returns corrupted value): `fc.integer()` outside [0, 87] for key functions
- PBT-08/09: `{ seed: 42, verbose: true }` on all fast-check tests

Story traceability: FEAT-02 (PD-07), FEAT-03/04 (KB-02 geometry), PBT-02, PBT-03, PBT-07, PBT-08, PBT-09

- [x] Step 5 complete

---

### Step 6: Create `src/__tests__/features/pitch/usePitchDetector.test.ts`

Unit tests for `usePitchDetector` hook using `@testing-library/react` and vitest mocks.

**Mock setup**:
- Mock `pitchy` module: `PitchDetector.forFloat32Array` returns mock with controllable `findPitch` return
- Mock `requestAnimationFrame` / `cancelAnimationFrame`
- Mock `performance.now` — advance time for timestamp gate tests
- Provide mock `AnalyserNode` with `getFloatTimeDomainData` (no-op), `context.sampleRate = 44100`

**Tests**:
- rAF loop starts when `isListening` becomes true
- rAF loop stops and `detectedNote` is cleared when `isListening` becomes false
- Timestamp gate: second rAF within < 33ms is skipped (no pitchy call)
- Null guard: null `analyserRef` skips frame silently
- Valid detection: pitchy returns [440, 0.95] → `detectedNote.midiNote === 69`
- Clarity below threshold (0.85): treated as null → no note emitted
- 3-frame debounce: 1 and 2 null frames hold last note; 3rd null frame emits null
- Change detection: same note repeated → only one store write
- Note history: new note prepended; history capped at 5
- Cleanup: `cancelAnimationFrame` called on unmount

- [x] Step 6 complete

---

### Step 7: Create `aidlc-docs/construction/unit2-pitch-detection/code/code-summary.md`

Markdown summary documenting all generated files, their responsibilities, and implementation notes.

- [x] Step 7 complete

---

## Story Coverage

| Story | PRD Reqs | Implemented by Steps |
|---|---|---|
| FEAT-02: Pitch Detection | PD-01, PD-02, PD-03, PD-04, PD-05, PD-06, PD-07 | Steps 1, 3, 4, 5, 6 |
| FEAT-07: Note History (data) | UI-07 | Steps 2, 4 |
