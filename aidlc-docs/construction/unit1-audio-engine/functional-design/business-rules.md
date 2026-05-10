# Unit 1: Audio Engine — Business Rules

---

## Permission Rules

**BR-01 — Modal-first on first visit**
On the first visit (localStorage flag absent or `onboardingDismissed = false`), microphone permission must NOT be requested until the user dismisses the onboarding modal. On all subsequent visits, `requestPermission()` is called immediately on hook mount.

**BR-02 — Demo mode always available**
Regardless of permission state (`'denied'`, `'error'`), the SVG piano keyboard must remain clickable and all neon visual feedback must function. The audio pipeline failure must never disable the demo/teacher mode.

**BR-03 — AudioContext created only after permission granted**
`AudioContext` must not be instantiated before `getUserMedia` resolves successfully. Creating it before permission can cause browser permission prompts to behave unexpectedly on Safari.

**BR-04 — Stop uses suspend, not close**
`AudioContext.suspend()` must be used for user-initiated stop. `AudioContext.close()` is reserved for component unmount only. This preserves the existing stream and AnalyserNode connection for fast resume.

---

## Noise Gate Rules

**BR-05 — Threshold range**
`noiseGateThreshold` must be constrained to the range `[0.001, 0.1]`.
- Below `0.001`: may detect ambient hum as signal
- Above `0.1`: may suppress soft piano notes played with low velocity
- Default: `0.02` (~-34 dBFS for a normalised signal)

**BR-06 — Threshold validated on write**
When `setNoiseGateThreshold()` is called, values outside `[0.001, 0.1]` must be clamped to the nearest boundary. Invalid values are never stored.

---

## RMS Calculation Rules

**BR-07 — Raw AnalyserNode data**
`AnalyserNode.smoothingTimeConstant` must be set to `0`. The pitchy pitch detector (Unit 2) requires unsmoothed time-domain data. Smoothing is applied only to the level meter output.

**BR-08 — Exponential moving average for audioLevel**
The raw RMS value computed each frame must be smoothed before writing to `audioSlice.audioLevel`:
```
smoothedLevel = 0.3 * rawRMS + 0.7 * previousSmoothedLevel
```
`α = 0.3` provides visual stability without lagging behind real signal changes.

**BR-09 — audioLevel is not used as the pitch detection gate**
`audioSlice.audioLevel` (smoothed) is for display only. The raw RMS value computed per frame is compared directly against `noiseGateThreshold` for the pitch detection gate in Unit 2.

---

## Reconnect Rules

**BR-10 — Reconnect only when user-intentional listening**
Auto-reconnect logic must check an internal `userIntentStopped` flag. If `true`, all dropout events (`onstatechange`, `onended`) are silently ignored. This prevents spurious reconnect attempts after the user stops.

**BR-11 — Reconnect window is 1000ms**
From the moment dropout is detected (`onstatechange` fires or `onended` fires), the reconnect sequence has at most 1000ms to restore audio. If not restored within 1000ms, set `permissionState = 'error'` and surface the ErrorBanner.

**BR-12 — Hardware disconnect includes 200ms stabilisation delay**
On `MediaStreamTrack.onended`, wait 200ms before calling `getUserMedia` again. Some devices briefly report `ended` during mode switches (e.g. Bluetooth codec renegotiation) and recover on their own.

**BR-13 — Reconnect reuses existing AnalyserNode**
On hardware disconnect reconnect, the existing `AnalyserNode` and its connection to `AudioContext` are preserved. Only the `MediaStreamSourceNode` is replaced with a new one from the new stream.

---

## Error State Rules

**BR-14 — permissionState transitions are one-way per session**
`permissionState` follows this allowed transition graph:
```
'prompt' → 'granted' → (normal operation)
'prompt' → 'denied'  → (no further transitions; user must reload)
'prompt' → 'error'   → (no further transitions; user must reload)
'granted' → 'error'  → (reconnect failed; user must reload or retry)
```
There is no automatic recovery from `'denied'` without a page reload.

**BR-15 — Safari AudioContext resume after user gesture**
On Safari (iOS/macOS), `AudioContext` can only be created or resumed in response to a user gesture. The MicToggle click serves as this gesture. The `useAudioEngine` hook must handle the case where `AudioContext.state === 'suspended'` immediately after creation and call `.resume()` within the same gesture handler.
