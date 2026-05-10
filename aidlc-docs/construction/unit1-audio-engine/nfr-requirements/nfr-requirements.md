# Unit 1: Audio Engine — NFR Requirements

---

## Performance

### NFR-P-01: Audio Pipeline Initialisation
- **Requirement**: Audio pipeline (AudioContext + AnalyserNode + MediaStream connection) initialises within 500ms of microphone permission grant
- **Target**: ≤ 500ms
- **Source**: NFR-P-02 (PRD)
- **Measurement**: Time from permission grant callback to first `AnalyserNode.getFloatTimeDomainData()` call returning valid data

### NFR-P-02: Audio Capture Latency Contribution
- **Requirement**: Unit 1 audio capture contributes less than 5ms to the 100ms end-to-end pitch detection budget
- **Target**: < 5ms per frame
- **Source**: Derived — `AnalyserNode.getFloatTimeDomainData()` at 60fps measures 2–4ms in practice
- **Measurement**: Time from `requestAnimationFrame` callback entry to `getFloatTimeDomainData()` completion

### NFR-P-03: RMS Processing Frame Rate
- **Requirement**: RMS amplitude calculation loop runs at the browser's native animation frame rate (~60fps)
- **Target**: ~60fps (16.7ms per frame); must not drop below 30fps under normal load
- **Source**: Unit 1 design — `requestAnimationFrame` loop
- **Note**: Frame rate is governed by `requestAnimationFrame`; no explicit timer is set. Browser throttles to 30fps in background tabs — acceptable (user cannot see the meter when backgrounded)

---

## Reliability

### NFR-R-01: Auto-Reconnect Timeout
- **Requirement**: Audio input auto-reconnects within 1 second of dropout detection
- **Target**: ≤ 1000ms from dropout event to resumed audio capture
- **Source**: NFR-R-01 (PRD)
- **Scope**: Applies to both system interruption (`AudioContext.onstatechange` → suspended/interrupted) and hardware disconnect (`MediaStreamTrack.onended`)
- **Exception**: If `userIntentStopped = true`, no reconnect is attempted

### NFR-R-02: Hardware Disconnect Stabilisation Delay
- **Requirement**: On hardware disconnect (`onended` event), wait 200ms before requesting a new `getUserMedia` stream
- **Target**: 200ms stabilisation delay
- **Source**: BR-13 (business-rules.md) — prevents rapid `getUserMedia` cycling on transient device re-enumeration
- **Scope**: `onended` path only; `onstatechange` path uses immediate `audioContext.resume()`

### NFR-R-03: Reconnect Attempt Limit
- **Requirement**: Maximum 3 reconnect attempts per dropout event; on exhaustion, transition to error state
- **Target**: ≤ 3 attempts, then error state (`permissionState = 'error'`, `isListening = false`)
- **Source**: BR-11 (business-rules.md)

### NFR-R-04: Safari AudioContext Activation Constraint
- **Requirement**: `AudioContext` must be created or resumed within a user gesture handler; browser autoplay policy must not silently block audio capture
- **Target**: Zero failures due to autoplay policy
- **Source**: BR-15 (business-rules.md); Safari 14.1+ WebKit constraint
- **Implementation**: `MicToggle` click handler serves as the required user gesture; `AudioContext` is created/resumed inside the click callback

---

## Security

### NFR-S-01: No Off-Device Audio Transmission
- **Requirement**: No raw or processed microphone audio data is transmitted to any server or third-party service
- **Source**: NFR-S-01 (PRD)
- **Scope**: All audio processing (RMS, FFT, noise gate) occurs entirely in the browser; only derived values (note name, frequency) are used within the app

### NFR-S-02: HTTPS Required
- **Requirement**: The application must be served over HTTPS; `getUserMedia` is unavailable on non-secure origins (W3C Secure Contexts requirement)
- **Source**: NFR-S-02 (PRD)
- **Scope**: Netlify deployment satisfies this automatically; `localhost` is permitted during development (treated as a secure context by all supported browsers)

### NFR-S-03: No Microphone Data Persistence
- **Requirement**: No microphone audio data is stored, logged, or persisted in any form (localStorage, IndexedDB, server log, or console output)
- **Source**: NFR-S-03 (PRD)
- **Scope**: `audioLevel` (0.0–1.0 float) is held in Zustand in-memory only; not persisted across sessions; raw RMS values are never logged

---

## Privacy

### NFR-PV-01: Microphone Access Transparency
- **Requirement**: The browser's native permission dialog must be shown before any microphone access; no silent background capture
- **Source**: PRD AC-01; `getUserMedia` API contract
- **Implementation**: `getUserMedia` is never called before user interaction — modal-first flow on first visit ensures informed consent before the permission dialog appears

### NFR-PV-02: Session-Only Audio State
- **Requirement**: All audio state (`isListening`, `audioLevel`, `noiseGateThreshold`) exists in-memory only and is cleared on page unload
- **Source**: Architecture — Zustand store is not persisted
- **Scope**: No audio-related state is written to `localStorage`, `sessionStorage`, or cookies

---

## Browser Compatibility

### NFR-BC-01: Supported Browsers

| Browser | Minimum Version | Web Audio API | getUserMedia | AnalyserNode | Notes |
|---|---|---|---|---|---|
| Chrome | 90+ | Full | Full | Full | Reference implementation |
| Firefox | 90+ | Full | Full | Full | Requires HTTPS or localhost |
| Safari | 14.1+ | Partial | Full | Full | AudioContext user-gesture constraint (NFR-R-04); no AudioWorklet required |
| Edge | 90+ | Full | Full | Full | Chromium-based; behaviour identical to Chrome |

**Not supported**: Internet Explorer (no `getUserMedia`), Opera Mini (no Web Audio API).

### NFR-BC-02: Audio Constraint Compatibility
- **Requirement**: `getUserMedia` audio constraints (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`) must be applied without throwing in all supported browsers
- **Fallback**: If a browser silently ignores an unsupported constraint (permitted by the W3C Media Capture spec), audio capture continues; some browser processing may remain active but will not break the application

### NFR-BC-03: Minimum Sample Rate
- **Requirement**: Device audio hardware must support a minimum sample rate of 44,100 Hz
- **Source**: Functional design — required by pitchy for accurate frequency analysis
- **Error handling**: If `AudioContext.sampleRate < 44100`, transition to error state with an appropriate ErrorBanner message

---

## Accessibility

### NFR-A-01: MicToggle Keyboard Operability
- **Requirement**: `MicToggle` must be fully operable via keyboard (Tab to focus, Enter or Space to activate); must not trap keyboard focus
- **Source**: WCAG 2.1 SC 2.1.1 (Keyboard)
- **Implementation**: `<button>` element (inherently focusable and keyboard-activatable); `aria-label` reflects current state; `aria-pressed` reflects `isListening`

### NFR-A-02: AudioLevelMeter ARIA Semantics
- **Requirement**: `AudioLevelMeter` must expose meter semantics to assistive technology without generating excessive screen-reader announcements
- **Implementation**: `role="meter"`, `aria-valuenow` (0–100), `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Microphone level"`, `aria-live="off"`

### NFR-A-03: SensitivitySlider ARIA Semantics
- **Requirement**: `SensitivitySlider` must expose range semantics with a human-readable value description
- **Implementation**: `<input type="range">` with an explicit `<label>` association; `aria-valuetext` reports "Low sensitivity", "Medium sensitivity", or "High sensitivity" based on thirds of the range

### NFR-A-04: Error State Screen-Reader Announcement
- **Requirement**: When microphone permission is denied or audio error occurs, the `ErrorBanner` must be announced to screen readers immediately on appearance
- **Implementation**: `ErrorBanner` renders with `role="alert"` (implicit assertive live region); announced on mount without user action
