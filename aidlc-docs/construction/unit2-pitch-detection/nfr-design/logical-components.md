# Unit 2: Pitch Detection — Logical Components

---

## Overview

Unit 2 has no UI components — it is entirely hook + pure module. All logic lives in two files:
- `src/features/pitch/usePitchDetector.ts` — hook with inline sub-components
- `src/shared/pianoGeometry.ts` — pure function module

```
usePitchDetector.ts
  ├── Timestamp Frame Gate       (inline)
  ├── Null Guard                 (inline)
  ├── Debounce Coordinator       (inline)
  └── Note Change Emitter        (inline)

pianoGeometry.ts
  └── Pure Function Module       (separate file, zero dependencies)

pitchSlice.ts
  └── Zustand Slice              (extends appStore)
```

---

## Logical Component 1: usePitchDetector (Primary Orchestrator)

**File**: `src/features/pitch/usePitchDetector.ts`

**Public interface**:
```typescript
interface PitchDetectorOptions {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

export function usePitchDetector(options: PitchDetectorOptions): void
// Returns void — all output goes to Zustand pitchSlice
```

**Responsibilities**:
- Creates and owns the `PitchDetector` singleton from pitchy
- Manages the rAF loop lifecycle (start/stop based on `isListening`)
- Composes all inline sub-components (frame gate, null guard, debounce, emitter)
- Writes to `pitchSlice.detectedNote` and `pitchSlice.noteHistory`

**Refs owned**:
```typescript
const pitchDetectorRef     = useRef<PitchDetector<Float32Array<ArrayBuffer>> | null>(null);
const bufferRef            = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
const animationFrameRef    = useRef<number>(0);
const lastDetectionTimeRef = useRef<number>(0);   // timestamp gate
const prevKeyIndexRef      = useRef<number | null>(null);   // change detection
const nullFrameCountRef    = useRef<number>(0);   // debounce
```

**Lifecycle**:
```typescript
// On mount
pitchDetectorRef.current = PitchDetector.forFloat32Array(FFT_SIZE);

// useEffect watching isListening
if (isListening) {
  animationFrameRef.current = requestAnimationFrame(loop);
} else {
  cancelAnimationFrame(animationFrameRef.current);
  setDetectedNote(null);
  prevKeyIndexRef.current = null;
  nullFrameCountRef.current = 0;
}

// On unmount
cancelAnimationFrame(animationFrameRef.current);
setDetectedNote(null);
```

---

## Logical Component 2: Timestamp Frame Gate (inline)

**Location**: First check in the rAF loop body

**Role**: Enforces the 30fps detection rate by skipping pitchy when fewer than 33ms have elapsed since the last call.

```
const now = performance.now();
if (now - lastDetectionTimeRef.current < 33) {
  animationFrameRef.current = requestAnimationFrame(loop);
  return; // gated frame — no detection this tick
}
lastDetectionTimeRef.current = now; // update before pitchy call
```

**Why timestamp over toggle**: Handles irregular rAF intervals (tab restore, browser throttling) without accumulating timing drift. Toggle refs would produce 30fps only when rAF is exactly 60fps; timestamp gate maintains ≥33ms real time between detections regardless.

---

## Logical Component 3: Null Guard (inline)

**Location**: After timestamp gate, before pitchy call

**Role**: Prevents errors when `analyserRef.current` is null (Unit 1 not yet started or stopped).

```
if (!analyserRef.current) {
  animationFrameRef.current = requestAnimationFrame(loop);
  return; // no-op frame
}
```

---

## Logical Component 4: Debounce Coordinator (inline)

**Location**: In the branch where pitchy returns null or clarity < 0.90

**Role**: Implements the 3-frame hold before emitting note release (null).

```
// On invalid/null detection:
nullFrameCountRef.current += 1;
if (nullFrameCountRef.current >= 3) {
  if (prevKeyIndexRef.current !== null) {
    setDetectedNote(null);
    prevKeyIndexRef.current = null;
  }
  nullFrameCountRef.current = 0;
}

// On valid detection:
nullFrameCountRef.current = 0;
```

---

## Logical Component 5: Note Change Emitter (inline)

**Location**: After a valid pitchy result passes clarity + range checks

**Role**: Applies change detection (BR-04) and triggers Zustand writes only on actual note changes.

```
const midiNote = frequencyToMidiNote(frequency);   // null if out of range
if (midiNote === null) {
  // treat as null detection → debounce path
} else {
  const keyIndex = midiNoteToKeyIndex(midiNote)!;  // safe: midiNote is in-range
  if (keyIndex !== prevKeyIndexRef.current) {
    const note: DetectedNote = {
      midiNote,
      keyIndex,
      noteName: keyIndexToNoteName(keyIndex)!,
      octave:   keyIndexToOctave(keyIndex)!,
      frequency,
      clarity,
      timestamp: performance.now(),
    };
    prevKeyIndexRef.current = keyIndex;
    setDetectedNote(note);
    // prepend to history, trim to 5
    setNoteHistory([note, ...useAppStore.getState().noteHistory].slice(0, 5));
  }
  nullFrameCountRef.current = 0;
}
```

---

## Logical Component 6: pianoGeometry Module

**File**: `src/shared/pianoGeometry.ts`

**Role**: All pure, stateless piano geometry and MIDI mapping functions. No React, no Zustand, no side effects.

**Input contract (Q2=B — defensive)**: All functions return `null` for out-of-range inputs. No exceptions thrown.

**Exported functions**:

| Function | Input | Output | Null condition |
|---|---|---|---|
| `frequencyToMidiNote` | `frequency: number` | `number \| null` | frequency outside [27.5, 4186.0] |
| `midiNoteToKeyIndex` | `midiNote: number` | `number \| null` | midiNote outside [21, 108] |
| `keyIndexToNoteName` | `keyIndex: number` | `string \| null` | keyIndex outside [0, 87] |
| `keyIndexToOctave` | `keyIndex: number` | `number \| null` | keyIndex outside [0, 87] |
| `isBlackKey` | `keyIndex: number` | `boolean \| null` | keyIndex outside [0, 87] |
| `getKeyGeometry` | `keyIndex, totalWidth` | `KeyRect \| null` | keyIndex outside [0, 87] or totalWidth ≤ 0 |
| `getAllKeyGeometry` | `totalWidth` | `KeyRect[]` | returns [] if totalWidth ≤ 0 |

**PBT coverage**:
- Arbitrary integer inputs for key index / MIDI note functions → always returns null (not corrupted output)
- In-range inputs → output satisfies all PBT-03 invariants
- Round-trip: `frequencyToMidiNote` + inverse within ±0.5 cents for in-range frequencies (PBT-02)

---

## Logical Component 7: pitchSlice

**File**: `src/store/pitchSlice.ts`

**Role**: Zustand slice for pitch detection state. Composes into `appStore` alongside `audioSlice`.

```typescript
interface PitchState {
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

**appStore extension** (modifies existing stub):
```typescript
// appStore.ts after Unit 2
export type AppState = AudioState & PitchState;
export const useAppStore = create<AppState>()((...a) => ({
  ...createAudioSlice(...a),
  ...createPitchSlice(...a),
}));
```

---

## Component Interaction Summary

```
usePitchDetector (options: { analyserRef })
  reads:  isListening          ← audioSlice (via useAppStore)
  reads:  analyserRef.current  ← passed from useAudioEngine()
  reads:  context.sampleRate   ← from AnalyserNode.context
  writes: detectedNote         → pitchSlice (via setDetectedNote)
  writes: noteHistory          → pitchSlice (via setNoteHistory)

pianoGeometry.ts (pure)
  called by: usePitchDetector (frequencyToMidiNote, midiNoteToKeyIndex,
             keyIndexToNoteName, keyIndexToOctave)
  called by: Unit 3 PianoKeyboard + CanvasOverlay (getKeyGeometry, getAllKeyGeometry)

pitchSlice.detectedNote
  consumed by: Unit 3 PianoKeyboard (key highlighting)
               Unit 3 CanvasOverlay (sparkle position)
               Unit 3 useSparkleAnimation (animation trigger)

pitchSlice.noteHistory
  consumed by: Unit 4 NoteHistoryPanel
```
