# Unit 2: Pitch Detection — Domain Entities

---

## Entity 1: DetectedNote

**Description**: Represents a single detected piano note at a point in time. Immutable — once created, not mutated.

```typescript
interface DetectedNote {
  midiNote:   number;   // MIDI note number [21–108]
  keyIndex:   number;   // Piano key index [0–87]; 0 = A0, 87 = C8
  noteName:   string;   // Note name without octave, e.g. "C#", "A"
  octave:     number;   // Octave number [0–8]
  frequency:  number;   // Detected frequency in Hz, as returned by pitchy
  clarity:    number;   // pitchy clarity score [0.90–1.0] (always >= threshold)
  timestamp:  number;   // performance.now() at detection time, in ms
}
```

**Lifecycle**: Created in `usePitchDetector` when a valid new note is detected. Written to `pitchSlice.detectedNote`. Prepended to `pitchSlice.noteHistory`.

**Nullability**: `pitchSlice.detectedNote` is `DetectedNote | null`. Null means no note is currently detected (silence, below clarity, or audio stopped).

---

## Entity 2: PitchSliceState

**Description**: Zustand slice shape for Unit 2. Extends `AppState` from Unit 1.

```typescript
interface PitchState {
  detectedNote:  DetectedNote | null;
  noteHistory:   DetectedNote[];           // max 5 entries, most recent first

  setDetectedNote:  (note: DetectedNote | null) => void;
  setNoteHistory:   (history: DetectedNote[]) => void;
}
```

**Initial values**:
- `detectedNote`: `null`
- `noteHistory`: `[]`

**Invariants**:
- `noteHistory.length <= 5` at all times
- `noteHistory[0]` is always the most recently detected note (if history is non-empty)
- `noteHistory` contains only note-change events (no sustained duplicates)

---

## Entity 3: KeyRect

**Description**: Geometric description of a single piano key within the SVG keyboard viewport. Pure data — no React or DOM dependency.

```typescript
interface KeyRect {
  x:        number;   // Left edge in pixels (relative to keyboard SVG origin)
  y:        number;   // Top edge in pixels (always 0 for all keys)
  width:    number;   // Key width in pixels
  height:   number;   // Key height in pixels
  isBlack:  boolean;  // True if this is a black key
  keyIndex: number;   // Piano key index [0–87]
}
```

**White key dimensions**: `width = totalWidth / 52`; `height = width × 6.5`

**Black key dimensions**: `width = whiteKeyWidth × 0.60`; `height = whiteKeyHeight × 0.65`

**Coordinate system**: Origin (0, 0) is the top-left of the keyboard. SVG renders white keys first (z-index 0), black keys on top (z-index 1).

---

## Entity 4: pianoGeometry.ts — Pure Function Contracts

**Location**: `src/shared/pianoGeometry.ts`

**Module rules**: Zero imports from `src/features/` or `src/store/`. No React. No side effects. All functions are pure (deterministic, no mutation).

### 4a. frequencyToMidiNote

```typescript
function frequencyToMidiNote(frequency: number): number | null
```
- **Input**: Frequency in Hz (any float)
- **Output**: Nearest equal-temperament MIDI note [21–108], or `null` if outside piano range
- **Formula**: `Math.round(12 * Math.log2(frequency / 440) + 69)`; then check result in [21, 108]
- **PBT target**: Round-trip with `midiNoteToFrequency` within ±0.5 cents (PBT-02)

### 4b. midiNoteToKeyIndex

```typescript
function midiNoteToKeyIndex(midiNote: number): number | null
```
- **Input**: MIDI note number (any integer)
- **Output**: Key index [0–87], or `null` if outside [21, 108]
- **Formula**: `midiNote - 21`
- **PBT target**: Invariant output always in [0, 87] for valid inputs (PBT-03)

### 4c. keyIndexToNoteName

```typescript
function keyIndexToNoteName(keyIndex: number): string
```
- **Input**: Key index [0–87]
- **Output**: Note name string without octave: `'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'`
- **Formula**: `NOTE_NAMES[(keyIndex + 21) % 12]`

### 4d. keyIndexToOctave

```typescript
function keyIndexToOctave(keyIndex: number): number
```
- **Input**: Key index [0–87]
- **Output**: Octave number [0–8]
- **Formula**: `Math.floor((keyIndex + 21 - 12) / 12)`
- **Spot checks**: keyIndex=0 (A0) → 0; keyIndex=3 (C1) → 1; keyIndex=87 (C8) → 8

### 4e. isBlackKey

```typescript
function isBlackKey(keyIndex: number): boolean
```
- **Input**: Key index [0–87]
- **Output**: `true` if the key is a black key
- **Formula**: `BLACK_SEMITONES.has((keyIndex + 21) % 12)` where `BLACK_SEMITONES = new Set([1, 3, 6, 8, 10])`

### 4f. getKeyGeometry

```typescript
function getKeyGeometry(keyIndex: number, totalWidth: number): KeyRect
```
- **Input**: Key index [0–87]; total SVG keyboard width in pixels
- **Output**: `KeyRect` with pixel-accurate position and dimensions
- **Algorithm**: See BR-14 (white key count) and BR-15 (black key centering)
- **PBT target**: Invariant — all 88 returned rects have non-negative x, positive width/height (PBT-03)

### 4g. getAllKeyGeometry

```typescript
function getAllKeyGeometry(totalWidth: number): KeyRect[]
```
- **Input**: Total SVG keyboard width in pixels
- **Output**: Array of exactly 88 `KeyRect` objects (indices 0–87)
- **PBT target**: Invariant — returned array contains exactly 52 white key rects and 36 black key rects (PBT-03)

---

## Entity 5: usePitchDetector Internal Refs

These refs live inside `usePitchDetector` and do not appear in Zustand or props. They track loop bookkeeping without causing re-renders.

```typescript
const pitchDetectorRef  = useRef<PitchDetector<Float32Array> | null>(null);
// Singleton PitchDetector instance — created once on mount

const bufferRef         = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
// Pre-allocated read buffer — never reallocated (avoids GC at 60fps)

const animationFrameRef = useRef<number>(0);
// Current rAF handle for cancellation

const prevKeyIndexRef   = useRef<number | null>(null);
// Last emitted key index — used for change detection (BR-04)

const nullFrameCountRef = useRef<number>(0);
// Consecutive null/below-threshold frame count — drives 3-frame debounce (BR-07)
```

---

## Relationship Summary

```
usePitchDetector
  reads: analyserRef (from useAudioEngine, passed as prop)
  reads: isListening, noiseGateThreshold (from audioSlice via Zustand)
  writes: detectedNote, noteHistory (to pitchSlice via Zustand)

pitchSlice.detectedNote: DetectedNote | null
  consumed by: Unit 3 PianoKeyboard, CanvasOverlay, useSparkleAnimation

pitchSlice.noteHistory: DetectedNote[]
  consumed by: Unit 4 NoteHistoryPanel

pianoGeometry.ts (pure)
  consumed by: Unit 2 (MIDI → keyIndex conversion)
  consumed by: Unit 3 (key pixel positions for SVG + Canvas)
  tested by:   pianoGeometry.test.ts (PBT with fast-check)
```
