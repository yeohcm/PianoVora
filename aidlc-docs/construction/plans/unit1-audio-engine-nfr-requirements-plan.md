# Unit 1: Audio Engine — NFR Requirements Plan

## NFRs Already Determined (No Questions Needed)

| NFR Category | Requirement | Source |
|---|---|---|
| Performance — init | Audio pipeline initialises within 500ms of permission grant | NFR-P-02 |
| Performance — latency | Unit 1 audio capture contributes <5ms to the 100ms end-to-end budget | Derived: AnalyserNode.getFloatTimeDomainData() at 60fps ≈ 2–4ms |
| Performance — frame rate | RMS loop runs at ~60fps (requestAnimationFrame) | Unit 1 design |
| Security | No audio data transmitted off-device | NFR-S-01 |
| Security | HTTPS required (getUserMedia constraint) | NFR-S-02 |
| Privacy | No microphone data stored or logged | NFR-S-03 |
| Reliability | Auto-reconnect within 1s (onstatechange + onended combination) | NFR-R-01 |
| Browser compat | Chrome 90+, Firefox 90+, Safari 14.1+, Edge 90+ | PRD Section 7.3 |
| Scalability | Client-side only — no server scaling concerns | Architecture |
| Tech stack | Web Audio API, Zustand, TypeScript, React 18 + Vite | Requirements |

---

## Open Questions

---

### Question 1
**getUserMedia Audio Constraints — Disable Browser Processing?**

Browsers apply processing to microphone input by default: echo cancellation, noise suppression, and automatic gain control (AGC). These features are designed for voice calls and can distort the waveform of musical instrument audio, potentially reducing pitch detection accuracy.

A) **Disable all browser audio processing** — use `{ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }`. Recommended for musical instrument capture; gives pitchy the cleanest raw waveform.
B) **Allow browser defaults** — use `{ audio: true }`. Simpler, but echo cancellation and AGC may alter the piano signal and reduce detection accuracy in some environments.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
**Client-Side Error Reporting**

When audio errors occur (permission denied, reconnect timeout, unexpected AudioContext errors), should they be reported anywhere beyond the in-app ErrorBanner UI?

A) **UI only** — errors are shown via ErrorBanner; no external reporting. Simplest; no third-party dependency.
B) **Console.error only** — errors are logged to the browser console for developer debugging; no external service.
C) **External error tracking** — integrate a service like Sentry for production error monitoring (captures stack traces, browser info, error frequency).
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## NFR Artifact Checklist (executed after answers)

- [x] Generate `aidlc-docs/construction/unit1-audio-engine/nfr-requirements/nfr-requirements.md`
  - [x] Performance NFRs with specific targets
  - [x] Reliability NFRs (reconnect, Safari quirks)
  - [x] Security and privacy NFRs
  - [x] Browser compatibility matrix for Unit 1
  - [x] Accessibility NFRs for audio controls
- [x] Generate `aidlc-docs/construction/unit1-audio-engine/nfr-requirements/tech-stack-decisions.md`
  - [x] Web Audio API configuration decisions
  - [x] getUserMedia constraint specification
  - [x] AudioContext latency hint
  - [x] Error reporting approach
  - [x] PBT framework note (N/A for Unit 1 — PBT applies to Unit 2)
