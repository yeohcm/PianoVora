# Unit 1: Audio Engine — Functional Design Plan

## Unit Context
- **Stories**: FEAT-01 (Audio Capture & Permissions), FEAT-09 (Error & Fallback — audio layer)
- **PRD**: AC-01–AC-05, UI-02, UI-03, UI-04, NFR-R-01, NFR-S-01
- **Components**: `useAudioEngine`, `MicToggle`, `AudioLevelMeter`, `SensitivitySlider`, `audioSlice`

## Already Determined (No Questions Needed)

| Decision | Detail |
|---|---|
| getUserMedia constraint | `{ audio: true }`, no video |
| FFT size | 2048 samples |
| Minimum sample rate | 44,100 Hz |
| Noise gate method | RMS amplitude check per animation frame |
| Default threshold | 0.02 (roughly -34 dBFS) |
| AnalyserNode output | Float32 time-domain data for pitchy |
| Stop/restart | Suspend/resume AudioContext (not destroy/recreate) |
| Permission state values | `'prompt' \| 'granted' \| 'denied' \| 'error'` |
| Auto-reconnect target | Within 1 second (NFR-R-01) |

---

## Design Questions

---

### Question 1
**Permission Request Timing Relative to Onboarding Modal**

PRD AC-01 says the app shall request microphone access "on load". PRD UI-06 says the onboarding modal appears "on first visit". These can conflict — requesting permission immediately interrupts the modal.

A) **Modal first, then permission** — Onboarding modal appears first; microphone permission is requested when the user dismisses the modal ("Get Started"). Gives context before the browser dialog. Applies only on first visit; on subsequent visits, permission is requested immediately on load.
B) **Permission first, then modal** — Browser permission dialog appears immediately on load; after it resolves (granted or denied), the onboarding modal appears on first visit.
C) **Permission deferred to first toggle** — Permission is never requested automatically. The user must click the MicToggle to trigger the permission request. Onboarding modal appears on first visit regardless.
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
**Audio Level Meter Scale**

The meter must visualise microphone signal strength to confirm the mic is active (UI-03).

A) **Linear (0–100%)** — Simple percentage of the RMS amplitude range. Easy to implement; displays consistently but doesn't reflect how humans perceive loudness.
B) **Logarithmic (dBFS)** — Converts RMS to decibels (e.g. -60 dBFS to 0 dBFS). More accurate for audio; normal piano playing sits around -20 to -10 dBFS. More complex to render.
C) **Normalised visual bar (no numeric scale)** — A smooth animated bar that scales proportionally to recent peak levels without showing a numeric value. Common in consumer audio apps.
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 3
**Audio Dropout Detection and Reconnect Mechanism**

NFR-R-01 requires auto-reconnect within 1 second if audio input drops. The Web Audio API does not emit a single "audio dropped" event — dropout must be detected.

A) **AudioContext `onstatechange`** — Listen for `AudioContext.state` changing to `'suspended'` or `'interrupted'`. Attempt `audioContext.resume()` immediately. Simple; catches system-level interruptions (phone call, Bluetooth switch).
B) **MediaStreamTrack `onended` event** — Listen for the mic track's `ended` event, which fires when the physical device disconnects. On `ended`, request a new getUserMedia stream and reconnect. Better for hardware disconnects.
C) **Combination of A + B** — Handle both system interruptions (via onstatechange) and hardware disconnects (via onended). Most robust; covers all dropout scenarios.
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Functional Design Artifact Checklist (executed after questions answered)

- [x] Generate `aidlc-docs/construction/unit1-audio-engine/functional-design/business-logic-model.md`
  - [x] Audio capture pipeline flow (permission → context → analyser → RMS → noise gate → expose ref)
  - [x] Stop/restart lifecycle
  - [x] Auto-reconnect flow
- [x] Generate `aidlc-docs/construction/unit1-audio-engine/functional-design/business-rules.md`
  - [x] Permission request rules
  - [x] Noise gate threshold rules (min/max range, default, validation)
  - [x] Reconnect timing rules
  - [x] Error state rules
- [x] Generate `aidlc-docs/construction/unit1-audio-engine/functional-design/domain-entities.md`
  - [x] `AudioState` entity
  - [x] `PermissionResult` entity
  - [x] `RMSLevel` value type
- [x] Generate `aidlc-docs/construction/unit1-audio-engine/functional-design/frontend-components.md`
  - [x] `MicToggle` state machine (idle → requesting → listening → stopped)
  - [x] `AudioLevelMeter` display logic
  - [x] `SensitivitySlider` interaction rules
