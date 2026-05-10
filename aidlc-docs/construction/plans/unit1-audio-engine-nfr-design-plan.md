# Unit 1: Audio Engine — NFR Design Plan

## NFR Design Categories Assessment

| Category | Applicable | Rationale |
|---|---|---|
| Resilience Patterns | Yes | Reconnect retry logic has design options affecting UX and reliability |
| Scalability Patterns | N/A | Client-side only; no server, no scaling dimension |
| Performance Patterns | Yes | Tab backgrounding and frame-level buffer allocation need design decisions |
| Security Patterns | N/A | Fully determined: getUserMedia constraints, HTTPS, no data transmission |
| Logical Components | Yes | Reconnect coordinator encapsulation affects testability and code structure |

---

## Open Questions

---

### Question 1
**Resilience — Reconnect Retry Timing**

NFR-R-01 requires auto-reconnect within 1000ms with a maximum of 3 attempts (NFR-R-03). The timing between retry attempts within that window affects both reconnect speed and stability.

A) **Immediate sequential** — Each attempt fires as soon as the previous one fails or times out. No artificial delay between attempts. Fastest reconnect; all 3 attempts complete within the 1000ms window as quickly as possible.
B) **Fixed 300ms interval** — Attempts fire at 0ms, 300ms, 600ms from the dropout event. 3 attempts comfortably fit within the 1000ms window. Gives the audio device time to stabilise between attempts.
C) **Short exponential backoff** — Attempts fire at 0ms, 100ms, 400ms (doubling: 100ms → 200ms additional delay). Balances speed on the first attempt with patience on subsequent ones. Stays within the 1000ms window.
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
**Performance — Tab Backgrounding Behaviour**

When the user switches to another browser tab, `requestAnimationFrame` is throttled (to ~1fps) or paused entirely by the browser. This affects the RMS animation loop that drives `AudioLevelMeter`.

A) **Rely on browser throttling (no explicit handling)** — The RMS loop naturally pauses or slows when backgrounded. The AudioContext and audio pipeline remain active. On return to the tab, `requestAnimationFrame` resumes at 60fps automatically. Simplest implementation; no side effects.
B) **Explicit `visibilitychange` handling** — Listen for `document.visibilitychange`. On `hidden`, cancel the animation frame to save CPU; on `visible`, restart the RMS loop. Audio pipeline stays active in both states. More explicit; marginally reduces CPU when backgrounded.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
**Logical Components — Reconnect Coordinator Encapsulation**

The reconnect logic coordinates `onstatechange`, `onended`, retry counting, the 200ms stabilisation delay, and the `userIntentStopped` guard. This can be organised in two ways:

A) **Inline within `useAudioEngine`** — Reconnect logic lives directly inside the hook as local event handlers and refs. Single file, no additional abstractions. Simpler to read for a small hook; harder to unit-test the reconnect logic in isolation.
B) **Separate `useReconnectCoordinator` hook** — Reconnect logic extracted into its own hook that accepts callbacks (`onReconnect`, `onExhausted`). `useAudioEngine` composes it. Slightly more boilerplate; reconnect logic becomes independently testable with Vitest.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## NFR Design Artifact Checklist (executed after answers)

- [x] Generate `aidlc-docs/construction/unit1-audio-engine/nfr-design/nfr-design-patterns.md`
  - [x] Resilience patterns (retry pattern with chosen timing, circuit breaker via attempt limit)
  - [x] Performance patterns (rAF loop, EMA smoothing, Float32Array pre-allocation, tab backgrounding)
  - [x] Observer pattern (onstatechange + onended event listeners)
  - [x] State machine pattern (MicToggle states, AudioContext lifecycle)
  - [x] Security patterns (N/A — constraints and HTTPS cover security fully)
- [x] Generate `aidlc-docs/construction/unit1-audio-engine/nfr-design/logical-components.md`
  - [x] useAudioEngine (primary orchestrator)
  - [x] Reconnect coordinator (inline per Q3=A)
  - [x] RMS processor (animation frame loop, EMA, noise gate)
  - [x] AudioContext lifecycle manager (create, resume, suspend, cleanup)
  - [x] Permission state coordinator (getUserMedia, permissionState transitions)
