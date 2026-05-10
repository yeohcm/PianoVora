# Unit 1: Audio Engine — Logical Components

---

## Overview

All Unit 1 logic is contained within a single hook file (`useAudioEngine.ts`). The logical components below are **conceptual sections** within that file — not separate files or classes. This matches the Q3=A decision (inline architecture).

```
useAudioEngine.ts
  ├── Permission State Coordinator
  ├── AudioContext Lifecycle Manager
  ├── RMS Processor
  └── Reconnect Coordinator (inline)
```

---

## Logical Component 1: useAudioEngine (Primary Orchestrator)

**File**: `src/features/audio/useAudioEngine.ts`

**Role**: Public interface of Unit 1. Composes all sub-logic, manages the hook lifecycle via `useEffect`, and exposes `start()` and `stop()` to consumers (`MicToggle`).

**Public interface**:
```typescript
interface AudioEngineResult {
  start: () => Promise<void>;
  stop: () => void;
}

export function useAudioEngine(): AudioEngineResult
```

**Responsibilities**:
- Reads `noiseGateThreshold` from `audioSlice` (written by `SensitivitySlider`)
- Writes `isListening`, `permissionState`, `audioLevel` to `audioSlice`
- Registers `useEffect` cleanup (cancel rAF loop, remove event listeners, close AudioContext)
- Coordinates startup and teardown sequence across all sub-components

**Refs managed**:
```typescript
const audioContextRef     = useRef<AudioContext | null>(null);
const analyserRef         = useRef<AnalyserNode | null>(null);
const streamRef           = useRef<MediaStream | null>(null);
const bufferRef           = useRef<Float32Array>(new Float32Array(2048));
const animationFrameRef   = useRef<number>(0);
const userIntentStoppedRef = useRef<boolean>(false);
const reconnectAttemptsRef = useRef<number>(0);
const prevSmoothedRef     = useRef<number>(0);
const peakLevelRef        = useRef<number>(0);
const lastPeakTimeRef     = useRef<number>(0);
```

---

## Logical Component 2: Permission State Coordinator

**Location**: Inline within `useAudioEngine.ts`

**Role**: Handles the `getUserMedia` call and maps browser error types to the `PermissionState` domain entity.

**Inputs**: Audio constraints object
**Outputs**: `MediaStream` (on success), or throws with mapped error type

**Key logic**:
```typescript
async function requestMicrophoneAccess(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  };
  // getUserMedia throws on denial or device error
  return await navigator.mediaDevices.getUserMedia(constraints);
}
```

**Error mapping**:
| Browser Error | `permissionState` | ErrorBanner message |
|---|---|---|
| `NotAllowedError` | `'denied'` | "Microphone permission denied" |
| `NotFoundError` | `'error'` | "No microphone found" |
| `OverconstrainedError` | `'error'` | "Microphone not supported" |
| Any other `DOMException` | `'error'` | "Microphone error" |

**Constraints**: Must be called within a user gesture handler (MicToggle click) to satisfy Safari's AudioContext activation requirement (NFR-R-04, BR-15).

---

## Logical Component 3: AudioContext Lifecycle Manager

**Location**: Inline within `useAudioEngine.ts`

**Role**: Creates, configures, suspends, resumes, and closes the Web Audio API graph.

**Graph structure**:
```
MediaStreamSourceNode → AnalyserNode → AudioContext.destination
                                           (silent — required for Safari graph activation)
```

**Configuration applied at creation**:
```typescript
const audioContext = new AudioContext({ latencyHint: 'interactive' });

const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;
analyserNode.smoothingTimeConstant = 0;   // raw data for pitchy

const source = audioContext.createMediaStreamSource(stream);
source.connect(analyserNode);
analyserNode.connect(audioContext.destination); // required for Safari
```

**Lifecycle operations**:

| Operation | API Call | When |
|---|---|---|
| Create | `new AudioContext(...)` | First `start()` call |
| Configure | `createAnalyser()`, `connect()` | Immediately after creation |
| Suspend | `audioContext.suspend()` | User clicks Stop |
| Resume | `audioContext.resume()` | User clicks Start again (or reconnect) |
| Close | `audioContext.close()` | Hook unmounts |

**Suspend-not-close invariant**: On user stop, the AudioContext is suspended (not closed). The audio graph remains intact. Resume on next Start is near-instant.

**Sample rate guard**:
```typescript
if (audioContext.sampleRate < 44100) {
  audioContext.close();
  setPermissionState('error');
  return;
}
```

---

## Logical Component 4: RMS Processor

**Location**: Inline within `useAudioEngine.ts`

**Role**: Drives the `requestAnimationFrame` loop; computes RMS amplitude, applies EMA smoothing, enforces the noise gate, and updates `audioLevel` in Zustand.

**Data flow per frame**:
```
requestAnimationFrame callback
  → getFloatTimeDomainData(bufferRef.current)   // fills 2048-sample Float32Array in-place
  → rawRMS = √(mean(sample²))                   // RMS over all 2048 samples
  → noiseGate: rawRMS < noiseGateThreshold?
      → yes: smoothedLevel = 0 (silence below gate)
      → no:  smoothedLevel = 0.3 × rawRMS + 0.7 × prevSmoothedRef.current
  → prevSmoothedRef.current = smoothedLevel
  → updatePeakHold(smoothedLevel)               // peak hold + 0.02/frame decay after 500ms
  → setAudioLevel(smoothedLevel)                // Zustand write (triggers AudioLevelMeter re-render)
  → animationFrameRef.current = requestAnimationFrame(loop)  // schedule next frame
```

**Key invariants**:
- `bufferRef.current` is never reallocated after initialisation
- `prevSmoothedRef` and `peakLevelRef` are refs — they do not trigger re-renders
- The Zustand `setAudioLevel` call is the only store write per frame
- The loop does NOT start if `isListening = false` and does NOT check permission state each frame

**RMS formula**:
```typescript
function computeRMS(buffer: Float32Array): number {
  let sumOfSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumOfSquares += buffer[i] * buffer[i];
  }
  return Math.sqrt(sumOfSquares / buffer.length);
}
```

**Analyser ref exposure**: `analyserRef` is stored as a hook-level ref. Unit 2 (`usePitchDetector`) receives the `AnalyserNode` reference directly — it calls `getFloatTimeDomainData` independently on the same node for pitch analysis. There is no data copying between units.

---

## Logical Component 5: Reconnect Coordinator

**Location**: Inline within `useAudioEngine.ts`

**Role**: Listens for audio dropout events from two sources and orchestrates the immediate-sequential retry sequence.

**Event sources and handlers**:

### onstatechange path (system interruption)
```
audioContext.onstatechange = () => {
  if (userIntentStoppedRef.current) return;
  if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') {
    attemptReconnect('resume');
  }
}
```

### onended path (hardware disconnect)
```
stream.getAudioTracks()[0].onended = () => {
  if (userIntentStoppedRef.current) return;
  setTimeout(() => attemptReconnect('getUserMedia'), 200); // 200ms stabilisation (NFR-R-02)
}
```

### Reconnect orchestrator (immediate sequential retry)
```
async function attemptReconnect(strategy: 'resume' | 'getUserMedia'): Promise<void> {
  if (reconnectAttemptsRef.current >= 3) {
    // Circuit open — error state
    setIsListening(false);
    setPermissionState('error');
    return;
  }

  reconnectAttemptsRef.current += 1;

  try {
    if (strategy === 'resume') {
      await audioContextRef.current!.resume();
      // resume succeeded — audio graph is live again
      reconnectAttemptsRef.current = 0;
    } else {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      // reconnect stream to existing audio graph
      const newSource = audioContextRef.current!.createMediaStreamSource(newStream);
      newSource.connect(analyserRef.current!);
      // re-register onended on new track
      newStream.getAudioTracks()[0].onended = onEndedHandler;
      reconnectAttemptsRef.current = 0;
    }
  } catch {
    // attempt failed — immediately retry (no delay between attempts)
    attemptReconnect(strategy);
  }
}
```

**Circuit breaker state**:
| `reconnectAttemptsRef` | State | Behaviour |
|---|---|---|
| 0–2 | CLOSED | Retry proceeds |
| 3 | OPEN | Error state written; no further retries |
| Reset to 0 | CLOSED | On successful reconnect |

**Registration and cleanup**:
- `onstatechange` registered immediately after AudioContext creation
- `onended` registered after each successful `getUserMedia` call
- Both handlers reference `userIntentStoppedRef` to avoid reconnect after intentional stop
- Both handlers are nulled in the `useEffect` cleanup function

---

## Component Interaction Summary

```
MicToggle (click)
  → useAudioEngine.start()
      → Permission State Coordinator: getUserMedia()
          → success: MediaStream
          → failure: setPermissionState('denied'|'error')
      → AudioContext Lifecycle Manager: create + configure graph
      → RMS Processor: start rAF loop
      → Reconnect Coordinator: register onstatechange + onended

MicToggle (click, while active)
  → useAudioEngine.stop()
      → userIntentStoppedRef = true
      → RMS Processor: cancelAnimationFrame
      → AudioContext Lifecycle Manager: audioContext.suspend()
      → setIsListening(false)

Dropout event
  → Reconnect Coordinator: immediate sequential retry (max 3)
      → success: audio resumes, reconnectAttemptsRef = 0
      → exhaustion: setPermissionState('error'), ErrorBanner renders

useEffect cleanup (unmount)
  → cancelAnimationFrame
  → onstatechange = null, onended = null
  → audioContext.close()
```
