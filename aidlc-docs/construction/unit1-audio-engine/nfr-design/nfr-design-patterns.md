# Unit 1: Audio Engine — NFR Design Patterns

---

## Resilience Patterns

### Pattern 1: Retry Pattern — Immediate Sequential
- **Applies to**: Audio dropout recovery (both `onstatechange` and `onended` paths)
- **Strategy**: Immediate sequential — each attempt fires as soon as the previous one resolves or fails, with no artificial delay between attempts
- **Max attempts**: 3 (tracked via `reconnectAttemptsRef`)
- **Window**: All attempts must complete within 1000ms of the dropout event (NFR-R-01)
- **Guard**: If `userIntentStoppedRef.current === true`, the retry sequence is skipped entirely — dropout is intentional
- **Reset**: `reconnectAttemptsRef` resets to 0 on any successful reconnect

```
Dropout detected
  → userIntentStopped? → yes → stop (no retry)
  → no → attempt 1 (immediate)
       → success → reconnected, reset counter
       → fail → attempt 2 (immediate)
              → success → reconnected, reset counter
              → fail → attempt 3 (immediate)
                     → success → reconnected, reset counter
                     → fail → circuit opens → error state
```

### Pattern 2: Circuit Breaker — Attempt Limit
- **Threshold**: 3 failed attempts
- **Open condition**: `reconnectAttemptsRef.current >= 3`
- **On open**: Write `permissionState = 'error'` and `isListening = false` to Zustand; ErrorBanner renders
- **Reset mechanism**: Only the user can reset — by clicking `MicToggle` to manually restart. There is no automatic circuit reset.
- **Rationale**: Prevents an infinite retry storm on persistent device failures (e.g., device unplugged). Forces user acknowledgement via ErrorBanner before any new capture attempt.

---

## Performance Patterns

### Pattern 3: RequestAnimationFrame Loop
- **Scheduling**: `requestAnimationFrame` (browser-native, ~60fps)
- **Frame handle**: Stored in `animationFrameRef` (`useRef<number>`) for cancellation
- **Cancellation**: `cancelAnimationFrame(animationFrameRef.current)` on user stop and on unmount
- **Tab backgrounding**: Browser naturally throttles `requestAnimationFrame` to ~1fps (or pauses it) when the tab is hidden. No explicit `visibilitychange` handling is added — the AudioContext and audio pipeline remain active; the display simply updates more slowly. On tab return, `requestAnimationFrame` resumes at 60fps automatically.

```
useEffect cleanup / stop():
  cancelAnimationFrame(animationFrameRef.current)
  animationFrameRef.current = 0
```

### Pattern 4: Float32Array Pre-allocation
- **Buffer**: `Float32Array(2048)` allocated once in a `useRef` and reused every frame
- **Passed to**: `analyserNode.getFloatTimeDomainData(bufferRef.current)` — mutates in place
- **Rationale**: Avoids allocating a new 8KB array at 60fps (~480KB/s of GC pressure), which would trigger frequent minor GC pauses visible as animation jank on low-end hardware

### Pattern 5: Exponential Moving Average (EMA) Smoothing
- **Formula**: `smoothed = α × rawRMS + (1 − α) × prevSmoothed`
- **α**: 0.3 (responsive but not jittery; source: BR-08)
- **Applied to**: `audioLevel` written to Zustand for `AudioLevelMeter` display
- **NOT applied to**: The raw `Float32Array` data exposed to Unit 2 — `pitchy` requires unsmoothed time-domain samples
- **State**: `prevSmoothedRef` (`useRef<number>`) — not in Zustand (no re-render needed)

### Pattern 6: Peak Hold
- **Hold window**: 500ms (source: `frontend-components.md`)
- **Decay rate**: 0.02 per frame after the hold window expires, toward current `audioLevel`
- **Implementation refs**:
  - `peakLevelRef: useRef<number>(0)` — current displayed peak value
  - `lastPeakTimeRef: useRef<number>(0)` — timestamp of last peak update
- **Logic per frame**:
  ```
  if smoothedLevel > peakLevelRef.current:
    peakLevelRef.current = smoothedLevel
    lastPeakTimeRef.current = performance.now()
  else if performance.now() - lastPeakTimeRef.current > 500:
    peakLevelRef.current = max(0, peakLevelRef.current - 0.02)
  ```

---

## Observer Pattern

### Pattern 7: AudioContext `onstatechange` Observer
- **Event source**: `AudioContext.onstatechange`
- **Observed states**: `'suspended'` and `'interrupted'` (the latter is Safari-specific)
- **Action**: Immediate `audioContext.resume()` call (no delay — this is the fast path for system-level interruptions like a phone call or Bluetooth device switch)
- **Registration**: Immediately after `AudioContext` creation
- **Cleanup**: Handler is removed by setting `audioContext.onstatechange = null` in stop/unmount

### Pattern 8: `MediaStreamTrack` `onended` Observer
- **Event source**: `stream.getAudioTracks()[0].onended`
- **Triggered by**: Physical device disconnect (cable pull, USB device removed)
- **Action**: 200ms stabilisation delay (NFR-R-02), then call `getUserMedia()` again and reconnect the audio graph
- **Rationale for 200ms**: Browser device enumeration can briefly report no devices immediately after disconnect; the delay allows re-enumeration to settle
- **Registration**: After each successful `getUserMedia()` call
- **Cleanup**: Handler is removed when the stream reference is replaced or on unmount

---

## State Machine Pattern

### Pattern 9: MicToggle Derived State Machine
- **Implementation**: No explicit state machine library — the 5 states are derived from two Zustand values: `permissionState` and `isListening`
- **State derivation**:

| State | `permissionState` | `isListening` | Label | Button |
|---|---|---|---|---|
| idle | `'prompt'` | `false` | "Allow Microphone" | enabled |
| requesting | `'prompt'` | `false` + in-flight | "Connecting..." | disabled |
| active | `'granted'` | `true` | "Stop" | enabled |
| stopped | `'granted'` | `false` | "Start" | enabled |
| error | `'denied'` or `'error'` | `false` | "Mic Unavailable" | disabled |

- **Note**: The `requesting` state is transient — tracked via a local `useState<boolean>` inside `MicToggle`, not in Zustand, as it does not need to be shared across components

### Pattern 10: AudioContext Suspend-Not-Close Lifecycle
- **On user stop**: `audioContext.suspend()` — preserves the audio graph (AnalyserNode connections remain intact)
- **On user resume**: `audioContext.resume()` — restarts processing without rebuilding the graph
- **On unmount**: `audioContext.close()` — full teardown, releases hardware resources
- **Rationale**: `suspend/resume` is ~0ms; `close/recreate` requires full DOM API initialisation. The suspend pattern delivers near-instant UX on the Start→Stop→Start cycle.

---

## Security Patterns

**N/A for Unit 1**

All security decisions for Unit 1 are configuration choices enforced at the API call boundary, not design patterns:
- `getUserMedia` audio constraints eliminate browser-side signal manipulation
- HTTPS is enforced by Netlify deployment configuration
- No data transmission means there is no network security surface to design for

No additional security patterns are required.
