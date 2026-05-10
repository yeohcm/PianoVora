# Unit 1: Audio Engine — Tech Stack Decisions

---

## Web Audio API Configuration

### Decision 1: AudioContext Latency Hint
- **Setting**: `new AudioContext({ latencyHint: 'interactive' })`
- **Rationale**: `'interactive'` requests the lowest available output latency from the browser scheduler. For a real-time pitch detection app, lower latency is preferable to power efficiency (`'playback'`). The trade-off (marginally higher CPU usage) is acceptable given the client-side-only, single-tab architecture.
- **Alternative considered**: `'balanced'` (browser default) — rejected; `'interactive'` better matches the real-time use case.

### Decision 2: AnalyserNode Configuration
- **fftSize**: `2048`
  - Yields 1024 frequency bins and 2048 time-domain samples per frame. Required by pitchy's McLeod pitch detection algorithm for accurate results across the piano frequency range (27.5 Hz – 4186 Hz).
- **smoothingTimeConstant**: `0` (disabled)
  - pitchy requires raw, unsmoothed time-domain data. Browser smoothing smears amplitude transients and reduces pitch detection accuracy, particularly for note onsets.
- **Source**: BR-07 (business-rules.md)

### Decision 3: Sample Rate
- **Requirement**: ≥ 44,100 Hz
- **Implementation**: No explicit `sampleRate` override — `AudioContext` negotiates with the audio hardware and uses the device's native rate. Hardware at 44,100 Hz or above satisfies the requirement.
- **Error case**: If `AudioContext.sampleRate < 44100` (rare, typically only on legacy or constrained hardware), transition to error state.

---

## getUserMedia Constraints

### Decision: Disable All Browser Audio Processing
```typescript
const constraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
  video: false,
};
```
- **Rationale**: Echo cancellation, noise suppression, and AGC are engineered for voice communication and actively distort musical instrument waveforms. AGC in particular compresses dynamics and alters amplitude relationships that the noise gate relies on. Disabling all three gives pitchy the cleanest possible raw piano signal.
- **Spec compliance**: The W3C Media Capture and Streams spec permits browsers to silently ignore constraints they do not support. If a constraint is ignored, audio capture continues — the app will not throw.
- **Alternative rejected**: `{ audio: true }` (browser defaults) — rejected because AGC and echo cancellation measurably reduce pitch detection accuracy for piano audio.

---

## Error Reporting

### Decision: UI Only (ErrorBanner + console.error)
- **Approach**: All audio errors (permission denied, reconnect exhaustion, unexpected `AudioContext` state transitions) are surfaced exclusively via the in-app `ErrorBanner` component. No external error tracking service is integrated.
- **Developer visibility**: `console.error` is called at all error boundaries as standard TypeScript/React practice for local debugging. This is not a separate reporting channel — no structured telemetry is sent.
- **Rationale**:
  - PianoVora V1 is a client-side-only application with no server component. External services (e.g., Sentry) require a third-party npm dependency, an API key managed in build config, and a privacy notice update (error payloads include browser fingerprint data).
  - Production error frequency monitoring is not a V1 requirement.
- **Alternative rejected**: Sentry — rejected due to dependency cost, privacy disclosure obligations, and absence of a V1 monitoring requirement.

---

## State Management

### Decision: Zustand audioSlice
**Zustand store shape (Unit 1 contribution)**:
```typescript
interface AudioState {
  isListening: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'error';
  audioLevel: number;          // 0.0–1.0, EMA-smoothed (α=0.3)
  noiseGateThreshold: number;  // 0.001–0.1, default 0.02
  setIsListening: (v: boolean) => void;
  setPermissionState: (v: PermissionState) => void;
  setAudioLevel: (v: number) => void;
  setNoiseGateThreshold: (v: number) => void;
}
```

**Internal hook refs (not in Zustand store)**:
```typescript
const audioContextRef   = useRef<AudioContext | null>(null);
const analyserRef       = useRef<AnalyserNode | null>(null);
const streamRef         = useRef<MediaStream | null>(null);
const animationFrameRef = useRef<number>(0);
const userIntentStoppedRef    = useRef<boolean>(false);
const reconnectAttemptsRef    = useRef<number>(0);
```
- **Rationale**: Browser API handles (AudioContext, AnalyserNode, MediaStream) and loop bookkeeping values are stored in refs, not Zustand. They change at 60fps but do not need to trigger React re-renders. Only values that legitimately drive UI updates (`isListening`, `permissionState`, `audioLevel`, `noiseGateThreshold`) live in the store.

---

## Property-Based Testing

### PBT Applicability for Unit 1: N/A
- **Status**: Not applicable
- **Rationale**: Unit 1 is browser API orchestration and React hook state management. There are no pure mathematical functions or domain mappings suitable for property-based testing.
- **PBT applies starting Unit 2**: `pianoGeometry.ts`, `frequencyToMidiNote()`, and `midiNoteToKeyIndex()` are the primary PBT targets (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09 per extension configuration).

---

## Dependencies

No new npm packages are introduced by Unit 1. All required capabilities are available through the browser's native Web Audio API and the existing stack.

| Package | Version | Purpose | Status |
|---|---|---|---|
| Web Audio API | Browser native | AudioContext, AnalyserNode, MediaStream | Browser built-in |
| React 18 | ^18.0.0 | `useRef`, `useEffect`, `useCallback` | Already in stack |
| Zustand | ^4.x | `audioSlice` state management | Already in stack |
| TypeScript | ^5.x | Strict type safety | Already in stack |
