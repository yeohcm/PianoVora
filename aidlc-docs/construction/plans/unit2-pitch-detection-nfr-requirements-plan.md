# Unit 2: Pitch Detection — NFR Requirements Plan

## NFRs Already Determined (No Questions Needed)

| NFR Category | Requirement | Source |
|---|---|---|
| Performance — latency | End-to-end detection latency < 100ms (key strike → note in store) | PD-04 |
| Performance — pitchy cost | pitchy.findPitch() on 2048 samples ≈ 1–2ms per call | Measured characteristic of pitchy library |
| Performance — frame rate | Detection loop driven by requestAnimationFrame (~60fps) | Unit 2 design |
| Accuracy | > 95% for clean single-note piano input in normal room conditions | PD-06 |
| Security | No audio or pitch data transmitted off-device | NFR-S-01 (inherited) |
| Privacy | No pitch data stored or logged beyond in-memory Zustand state | NFR-S-03 (inherited) |
| Reliability — null guard | If `analyserRef.current` is null, skip frame silently (no error thrown) | Defensive design |
| Reliability — sample rate | Read sampleRate from `analyserRef.current.context.sampleRate`; never hardcode | BR-12 |
| Browser compat | Chrome 90+, Firefox 90+, Safari 14.1+, Edge 90+ | PRD Section 7.3 (inherited) |
| Scalability | Client-side only — no server scaling concerns | Architecture |
| PBT | fast-check enforced for PBT-02, PBT-03, PBT-07, PBT-08, PBT-09 on pianoGeometry.ts pure functions | Requirements + Extension config |
| PBT seed | Random seed each run; seed logged to test output on failure (fast-check default); fixed seed not required | PBT-08 |

---

## Open Questions

---

### Question 1
**Pitch Detection Sampling Rate — Every Frame vs Throttled**

`usePitchDetector` currently runs pitchy every `requestAnimationFrame` callback (~60fps). pitchy on 2048 samples costs ~1–2ms per call. Throttling to every 2nd frame (~30fps) halves CPU usage while still delivering a new detection every ~33ms — well within the 100ms latency budget (PD-04).

A) **Every frame (60fps)** — pitchy runs on every rAF callback. Maximum responsiveness; note changes visible within ~16ms of occurring. Slightly higher CPU usage (~1–2ms × 60 = 60–120ms CPU per second).
B) **Every 2nd frame (30fps)** — pitchy runs on alternate rAF callbacks; rAF loop still fires at 60fps but detection is gated. Halves pitchy CPU cost; detection latency rises to max ~33ms (still well under 100ms). Effectively transparent to users.
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## NFR Artifact Checklist (executed after answers)

- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/nfr-requirements/nfr-requirements.md`
  - [x] Performance NFRs (latency, pitchy cost, detection rate)
  - [x] Accuracy NFR and measurement approach
  - [x] Reliability NFRs (null guard, sample rate, debounce)
  - [x] Security and privacy NFRs (inherited from Unit 1)
  - [x] Browser compatibility (inherited)
  - [x] PBT NFRs (pianoGeometry.ts targets, fast-check config)
- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/nfr-requirements/tech-stack-decisions.md`
  - [x] pitchy API usage and configuration
  - [x] Detection sampling rate decision (per Q1)
  - [x] PBT framework configuration (fast-check generators, seed logging)
  - [x] Buffer management (independent Float32Array from Unit 1)
  - [x] pitchSlice Zustand extension approach
