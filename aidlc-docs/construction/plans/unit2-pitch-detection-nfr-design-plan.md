# Unit 2: Pitch Detection — NFR Design Plan

## NFR Design Categories Assessment

| Category | Applicable | Rationale |
|---|---|---|
| Resilience Patterns | Yes | Null guard, debounce, and isListening guard need pattern formalisation |
| Scalability Patterns | N/A | Client-side only; no scaling dimension |
| Performance Patterns | Yes | 30fps gate implementation mechanism is an open design choice |
| Security Patterns | N/A | No new security surface beyond Unit 1; pure computation only |
| Logical Components | Yes | pianoGeometry module structure and usePitchDetector internal decomposition |

---

## Open Questions

---

### Question 1
**Performance — Frame Gate Mechanism**

The 30fps detection gate (NFR-P-03) runs pitchy on every 2nd rAF frame. Two implementation approaches are viable:

A) **Toggle ref** — `frameCountRef` increments each frame and pitchy runs when `frameCountRef.current % 2 === 0`. Simple; deterministic; unaffected by variable frame timing.
B) **Timestamp gate** — Record `lastDetectionTimeRef = performance.now()` after each pitchy call; skip if `now - lastDetectionTimeRef < 33`. More accurate under variable rAF rates (e.g., when tab returns from background at a different cadence); slightly more logic.
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2
**Logical Components — pianoGeometry Input Validation**

`pianoGeometry.ts` pure functions receive inputs derived from pitchy output (MIDI notes, key indices). Should the functions defensively validate their inputs, or trust the caller to pass valid values?

A) **Trust caller (no internal guards)** — Functions assume inputs are valid (in-range). Invalid inputs produce undefined/incorrect output. Caller (usePitchDetector) is responsible for range-checking before calling. Maximally pure; PBT tests with in-range generators only.
B) **Defensive internal guards** — Functions return `null` or throw for out-of-range inputs (e.g., `keyIndex < 0` or `keyIndex > 87`). Adds safety at the cost of null-checking at every call site. PBT can test with arbitrary integers.
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## NFR Design Artifact Checklist (executed after answers)

- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/nfr-design/nfr-design-patterns.md`
  - [x] Resilience: null guard pattern, debounce counter pattern, isListening guard
  - [x] Performance: frame gate pattern (per Q1), pre-allocated buffer pattern
  - [x] Functional purity pattern for pianoGeometry.ts
  - [x] Scalability/Security: N/A documented
- [x] Generate `aidlc-docs/construction/unit2-pitch-detection/nfr-design/logical-components.md`
  - [x] usePitchDetector (primary orchestrator)
  - [x] Frame gate (inline within usePitchDetector)
  - [x] Debounce coordinator (inline within usePitchDetector)
  - [x] pianoGeometry module (pure functions, input contract per Q2)
  - [x] pitchSlice (Zustand slice, appStore extension)
