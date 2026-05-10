# Unit 2: Pitch Detection — NFR Design Patterns

---

## Resilience Patterns

### Pattern 1: Null Guard — AnalyserNode Availability
- **Applies to**: Every rAF callback in `usePitchDetector`
- **Guard condition**: `analyserRef.current === null`
- **Action on null**: Silently skip the frame — no pitchy call, no store write, reschedule next rAF
- **Rationale**: `analyserRef` may be null during the window between hook mount and Unit 1's `start()` completing, or briefly after `stop()` is called

```
rAF fires
  → analyserRef.current === null?
      yes → reschedule rAF, return (no-op frame)
      no  → proceed with detection
```

### Pattern 2: Debounce Counter — Note Release Hold
- **Applies to**: Frames where pitchy returns null or clarity < 0.90
- **State**: `nullFrameCountRef` (integer, starts at 0)
- **Threshold**: 3 consecutive null frames before emitting `detectedNote = null`
- **Reset**: Counter resets to 0 on any valid detection

```
Null/below-threshold frame:
  nullFrameCountRef.current += 1
  if < 3: hold last note (no store write)
  if >= 3: emit null, reset counter

Valid detection frame:
  nullFrameCountRef.current = 0
  proceed to change detection
```

### Pattern 3: isListening Guard — Loop Lifecycle
- **Applies to**: Zustand subscription within `usePitchDetector`
- **Trigger**: `audioSlice.isListening` transitions to `false`
- **Action**: `cancelAnimationFrame`, write `detectedNote = null`, reset all refs
- **Trigger on `true`**: Restart rAF loop
- **Implementation**: `useEffect` watching `isListening` from Zustand

---

## Performance Patterns

### Pattern 4: Timestamp Gate — 30fps Detection
- **Applies to**: Every rAF callback
- **State**: `lastDetectionTimeRef` stores `performance.now()` of last pitchy call
- **Gate condition**: `performance.now() - lastDetectionTimeRef.current < 33`
- **Action on gated frame**: Skip pitchy, reschedule rAF — no-op for detection, transparent to animation
- **On detection**: Update `lastDetectionTimeRef.current = performance.now()`

```
rAF fires
  now = performance.now()
  now - lastDetectionTimeRef.current < 33?
    yes → reschedule, return (gated frame)
    no  → run pitchy, update lastDetectionTimeRef
```

- **Advantage over toggle ref**: Handles variable rAF intervals gracefully (tab returning from background, browser throttling); always waits at least 33ms real time between detections regardless of frame rate irregularities

### Pattern 5: Pre-allocated Buffer
- **Applies to**: `getFloatTimeDomainData` call each detected frame
- **Buffer**: `Float32Array<ArrayBuffer>(FFT_SIZE)` allocated once in `useRef` at hook mount
- **Usage**: Mutated in-place by `analyserRef.current.getFloatTimeDomainData(bufferRef.current)` — never reallocated
- **Independence from Unit 1**: Unit 2 owns a separate buffer from Unit 1's RMS buffer — no shared state between hooks

---

## Functional Purity Pattern

### Pattern 6: Defensive Pure Functions — pianoGeometry.ts
- **Applies to**: All exported functions in `src/shared/pianoGeometry.ts`
- **Input validation strategy (Q2=B)**: Each function validates its inputs and returns `null` for out-of-range values rather than throwing
- **No exceptions**: `throw` is never used inside pianoGeometry — null return signals invalid input
- **PBT benefit**: Defensive returns allow fast-check to use arbitrary integer generators (not just domain-constrained ones) and verify that invalid inputs always produce null rather than corrupted output

```
// Example contract
function midiNoteToKeyIndex(midiNote: number): number | null {
  if (midiNote < 21 || midiNote > 108) return null;
  return midiNote - 21;
}

function keyIndexToNoteName(keyIndex: number): string | null {
  if (keyIndex < 0 || keyIndex > 87) return null;
  return NOTE_NAMES[(keyIndex + 21) % 12];
}
```

- **Caller responsibility**: `usePitchDetector` pre-validates MIDI range before calling geometry functions, so null returns from geometry functions in the detection path represent a logic error — they can be treated as defensive catches, not expected values

---

## Scalability Patterns

**N/A for Unit 2** — Client-side only, no server, no scaling dimension.

---

## Security Patterns

**N/A for Unit 2** — No new security surface. Pure computation: frequency → MIDI → key index → Zustand. No network calls, no storage, no user input parsing.
