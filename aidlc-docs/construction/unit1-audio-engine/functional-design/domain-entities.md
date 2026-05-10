# Unit 1: Audio Engine — Domain Entities

---

## Entity: AudioEngineState

Represents the complete runtime state of the audio capture engine. Lives in `audioSlice` (Zustand).

| Field | Type | Description | Valid Values |
|---|---|---|---|
| `isListening` | `boolean` | True when AudioContext is running and RMS loop is active | `true` / `false` |
| `permissionState` | `PermissionState` | Current microphone permission status | See PermissionState below |
| `audioLevel` | `number` | Smoothed RMS amplitude (EMA α=0.3) for level meter display | `[0.0, 1.0]` |
| `noiseGateThreshold` | `number` | RMS amplitude below which pitch detection is suppressed | `[0.001, 0.1]`, default `0.02` |

---

## Value Type: PermissionState

Discriminated string union representing the microphone permission lifecycle.

```
'prompt'   — Initial state; getUserMedia not yet called
'granted'  — Permission granted; AudioContext running
'denied'   — User explicitly denied microphone access
'error'    — Unexpected error (device not found, reconnect timeout, etc.)
```

**Allowed transitions per session:**
```
prompt → granted → (listening or stopped)
prompt → denied  → (terminal; requires page reload)
prompt → error   → (terminal; requires page reload)
granted → error  → (reconnect failed; requires page reload or manual retry)
```

---

## Value Type: RMSLevel

A normalised amplitude measurement derived from the time-domain waveform buffer.

| Attribute | Value |
|---|---|
| Formula | `sqrt( Σ(xᵢ²) / N )` where N = `fftSize` (2048) |
| Range | `[0.0, 1.0]` for a normalised input signal |
| Practical range for piano at 1–3m | approximately `[0.01, 0.4]` |
| Typical ambient noise floor | approximately `[0.001, 0.01]` |

Two RMS values are maintained internally per frame:
- **rawRMS**: used by Unit 2 noise gate comparison against `noiseGateThreshold`
- **smoothedLevel** (`audioLevel`): EMA-smoothed rawRMS, written to `audioSlice` for the level meter

---

## Value Type: ReconnectAttempt (internal, not in store)

Ephemeral runtime value used within `useAudioEngine` to track an in-progress reconnect sequence. Never persisted to Zustand.

| Field | Type | Description |
|---|---|---|
| `startTime` | `number` | `performance.now()` when dropout was detected |
| `mechanism` | `'context-resume' \| 'stream-restart'` | Which reconnect path was triggered |
| `timeoutId` | `number` | `setTimeout` handle for the 1000ms deadline |

---

## Internal Hook State (not in Zustand store)

State managed internally within `useAudioEngine` via `useRef` (not `useState`, to avoid triggering re-renders):

| Field | Type | Purpose |
|---|---|---|
| `audioContextRef` | `React.RefObject<AudioContext \| null>` | AudioContext instance |
| `analyserNodeRef` | `React.RefObject<AnalyserNode \| null>` | Exposed to usePitchDetector |
| `streamRef` | `React.RefObject<MediaStream \| null>` | Current MediaStream |
| `animationFrameRef` | `React.RefObject<number>` | requestAnimationFrame ID for cancellation |
| `userIntentStoppedRef` | `React.RefObject<boolean>` | Distinguishes user stop from dropout |
| `prevSmoothedLevelRef` | `React.RefObject<number>` | Previous EMA value for next frame |

**Rationale for `useRef` over `useState`**: These are browser API handles and internal computation values. Storing them in React state would cause unnecessary re-renders on every frame (~60fps). The Zustand store (`audioSlice`) is used only for state that components need to render.
