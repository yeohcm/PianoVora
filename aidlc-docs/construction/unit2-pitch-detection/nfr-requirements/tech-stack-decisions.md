# Unit 2: Pitch Detection — Tech Stack Decisions

---

## pitchy Library Configuration

### Decision: PitchDetector.forFloat32Array
```typescript
import { PitchDetector } from 'pitchy';

const detector = PitchDetector.forFloat32Array(FFT_SIZE);
// FFT_SIZE = 2048 — matches AnalyserNode.fftSize from Unit 1
```
- **Instantiation**: Once per `usePitchDetector` hook mount, stored in `pitchDetectorRef`
- **Rationale**: `forFloat32Array` creates a detector optimised for the McLeod pitch method with the given buffer size. Creating a new instance per frame would re-allocate internal scratch buffers each time.
- **API usage per frame**:
  ```typescript
  const [frequency, clarity] = detector.findPitch(
    bufferRef.current,
    analyserRef.current.context.sampleRate,
  );
  ```
- **No configuration options**: pitchy's McLeod algorithm does not expose tuning parameters; clarity threshold is applied by the caller (0.90, BR-01)

---

## Detection Sampling Rate

### Decision: Every 2nd Frame (30fps detection)
- **Implementation**: `frameCountRef` toggles each rAF callback; pitchy called only on even frames
  ```typescript
  frameCountRef.current = (frameCountRef.current + 1) % 2;
  if (frameCountRef.current !== 0) {
    animationFrameRef.current = requestAnimationFrame(loop);
    return;
  }
  // proceed with pitchy call
  ```
- **Detection latency**: Maximum additional latency from frame-gating = 16.7ms (one skipped frame); total max detection latency ≈ 35ms, well within 100ms budget
- **rAF loop**: Continues ticking at 60fps — skipped frames still reschedule the loop; Unit 3's animation can use a separate rAF if needed
- **Alternative rejected**: Every frame (60fps) — rejected because the ~30–60ms/second CPU saving from halving pitchy calls is worth the imperceptible 16ms additional detection latency

---

## Buffer Management

### Decision: Independent Float32Array per Hook
- **Unit 1 buffer**: `useAudioEngine` owns its own `Float32Array(2048)` for the RMS loop
- **Unit 2 buffer**: `usePitchDetector` owns a separate `Float32Array(2048)` for pitch detection
- **Rationale**: Both hooks call `getFloatTimeDomainData(buffer)` which overwrites the buffer in-place. Sharing a buffer would cause a race condition between the two rAF loops running in the same JS thread. Independent buffers eliminate this hazard.
- **Same AnalyserNode**: Both hooks read from the same `AnalyserNode` ref — this is safe because `getFloatTimeDomainData` reads the current state of the analyser's internal ring buffer without mutating it.

---

## pitchSlice — Zustand Extension

### Decision: Extend appStore with pitchSlice
- `src/store/pitchSlice.ts` exports `createPitchSlice: StateCreator<PitchState>`
- `src/store/appStore.ts` extended to compose `createAudioSlice + createPitchSlice`:
  ```typescript
  // appStore.ts after Unit 2
  export type AppState = AudioState & PitchState;
  export const useAppStore = create<AppState>()((...a) => ({
    ...createAudioSlice(...a),
    ...createPitchSlice(...a),
  }));
  ```
- **Pattern**: Same slice factory pattern as Unit 1; composable, no breaking changes to existing consumers

---

## Property-Based Testing — fast-check Configuration

### Decision: Random seed with failure logging
```typescript
import * as fc from 'fast-check';

// Example PBT test structure
fc.assert(
  fc.property(
    fc.float({ min: 27.5, max: 4186.0, noNaN: true }),
    (frequency) => {
      const midiNote = frequencyToMidiNote(frequency);
      return midiNote === null || (midiNote >= 21 && midiNote <= 108);
    },
  ),
  { numRuns: 1000, verbose: true }, // verbose: true prints seed on failure
);
```
- **Seed strategy**: Random seed per run (fast-check default); seed printed on failure via `verbose: true`
- **numRuns**: 1000 per property (fast-check default is 100; increased for better coverage of the piano frequency domain)
- **Shrinking**: Enabled by default in fast-check; no configuration needed
- **No global fixed seed**: Fixed seeds would prevent discovering new counterexamples across CI runs
- **CI integration**: fast-check tests are standard Vitest tests; `npm run test:run` covers them automatically

### Domain Generators
```typescript
// Piano frequency range
const pianoFrequency = fc.float({ min: 27.5, max: 4186.0, noNaN: true });

// Piano MIDI note range
const pianoMidiNote = fc.integer({ min: 21, max: 108 });

// Piano key index range
const pianoKeyIndex = fc.integer({ min: 0, max: 87 });

// Realistic SVG keyboard widths (pixels)
const keyboardWidth = fc.float({ min: 320, max: 4000, noNaN: true });
```

---

## Dependencies (Unit 2 — No New Runtime Dependencies)

| Package | Version | Purpose | Status |
|---|---|---|---|
| pitchy | ^4.0.7 | McLeod pitch detection algorithm | Already in package.json |
| fast-check | ^3.19.0 | Property-based testing for pianoGeometry.ts | Already in package.json |
| zustand | ^4.5.4 | pitchSlice state | Already in package.json |
| TypeScript | ^5.4.5 | Strict type safety | Already in package.json |

**No new npm dependencies introduced by Unit 2.** All packages were included in Unit 1's `package.json`.
