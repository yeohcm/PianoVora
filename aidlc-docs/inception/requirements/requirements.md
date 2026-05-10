# PianoVora — Requirements Document

**Version**: 1.0  
**Date**: 2026-05-09  
**Source PRD**: docs/PianoVora_PRD_v1.0.md  
**Status**: Approved

---

## Intent Analysis Summary

| Attribute | Detail |
|---|---|
| **User Request** | Implement PianoVora browser-based piano practice app as defined in PRD v1.0 |
| **Request Type** | New Project (Greenfield) |
| **Scope** | System-wide — full frontend application with audio pipeline, pitch detection engine, keyboard rendering, animation layer, and responsive UI |
| **Complexity** | Complex — multiple interdependent technical components, strict latency and accuracy NFRs, cross-browser audio API constraints, WCAG 2.1 AA accessibility target |

---

## Technology Stack Decisions

| Layer | Decision | Rationale |
|---|---|---|
| Language | TypeScript (strict mode) | Type safety for audio processing and canvas code; catches errors at compile time |
| Frontend Framework | React 18 + Vite | Fast HMR, component model suits keyboard UI |
| State Management | Zustand | Lightweight external store; minimal boilerplate for audio state, detected note, and theme |
| Pitch Detection | `pitchy` library (YIN/McLeod) | Battle-tested, browser-native, no WASM complexity for v1 |
| Keyboard Rendering | SVG keyboard + HTML Canvas overlay | SVG gives accessible DOM nodes per key; Canvas layer handles 60fps glow and sparkle effects |
| Styling | Tailwind CSS + CSS custom properties | Dark-theme development; neon palettes via CSS variables |
| Testing | Vitest + React Testing Library + Playwright | Native Vite integration; fast unit tests + browser e2e |
| PBT Framework | fast-check (Partial enforcement) | Integrates with Vitest; supports custom generators, shrinking, seed reproducibility |
| Deployment | Netlify | Static hosting; global CDN; zero-server cost |

---

## Functional Requirements

### FR-1: Audio Capture & Permissions

| ID | Requirement | Priority | Source |
|---|---|---|---|
| AC-01 | The app shall request microphone access via `getUserMedia()` on load. | Must Have | PRD |
| AC-02 | A clear permission prompt and explanation must appear before access is requested. | Must Have | PRD |
| AC-03 | If permission is denied, the app shall display a helpful error message with instructions to grant access. | Must Have | PRD |
| AC-04 | Audio capture shall run at a minimum sample rate of 44,100 Hz. | Must Have | PRD |
| AC-05 | The user shall be able to stop and restart audio capture from the UI via a prominent on/off toggle. | Must Have | PRD |

### FR-2: Pitch Detection Engine

| ID | Requirement | Priority | Source |
|---|---|---|---|
| PD-01 | The app shall detect the fundamental frequency of incoming audio in real time using the `pitchy` library. | Must Have | PRD + Q2 |
| PD-02 | Detection shall cover the full piano range: A0 (27.5 Hz) to C8 (4,186 Hz). | Must Have | PRD |
| PD-03 | Pitch detection shall execute entirely client-side with no server round-trip. | Must Have | PRD |
| PD-04 | Detection latency from audio input to visual output shall be under 100ms. | Must Have | PRD |
| PD-05 | The engine shall apply a noise gate to suppress ambient noise below a configurable threshold. | Must Have | PRD |
| PD-06 | Accuracy shall exceed 95% for clean single-note input in normal room conditions. | Must Have | PRD |
| PD-07 | The detected frequency shall be mapped to the nearest equal-temperament MIDI note (A4 = 440Hz reference). | Must Have | PRD |

### FR-3: On-Screen Piano Keyboard

| ID | Requirement | Priority | Source |
|---|---|---|---|
| KB-01 | The app shall render a full 88-key piano keyboard spanning A0 to C8 using SVG. | Must Have | PRD + Q3 |
| KB-02 | White and black keys shall be visually accurate in proportion and layout. | Must Have | PRD |
| KB-03 | Octave markers (C1–C8) shall be displayed below the corresponding C keys. | Must Have | PRD |
| KB-04 | The keyboard shall scroll horizontally on smaller screens; the active key shall remain centred in view. | Must Have | PRD |
| KB-05 | Keys shall be clickable/tappable so users can test visuals without audio input. | Must Have | PRD + Q5 |
| KB-06 | Keyboard rendered in SVG; sparkle/glow animations rendered on a Canvas overlay above the SVG layer. | Must Have | PRD + Q3 |

### FR-4: Neon Visual Feedback

| ID | Requirement | Priority | Source |
|---|---|---|---|
| VF-01 | When a note is detected, the corresponding SVG key shall immediately illuminate with a neon colour. | Must Have | PRD |
| VF-02 | The Canvas overlay shall render animated sparkle/glow effects at the detected key position. | Must Have | PRD + Q3 |
| VF-03 | White keys and black keys shall use distinct neon colour palettes per the active theme. | Must Have | PRD |
| VF-04 | The neon glow shall fade out smoothly within ~1 second after the note stops sounding. | Must Have | PRD |
| VF-05 | The detected note name and octave (e.g. G#4) shall appear as an overlay on the lit key. | Must Have | PRD |
| VF-06 | A colour theme selector shall offer exactly 3 neon palette options: **Cyber**, **Aurora**, **Sunset**. | Must Have | PRD + Q5 + Q9 |
| VF-07 | Animations shall target 60fps without frame drops on modern hardware; Canvas and SVG layers must synchronise. | Must Have | PRD |

### FR-5: User Interface & Experience

| ID | Requirement | Priority | Source |
|---|---|---|---|
| UI-01 | The interface shall use a dark theme (deep navy/black) to maximise neon visual contrast. | Must Have | PRD |
| UI-02 | A prominent on/off toggle shall control microphone listening. | Must Have | PRD |
| UI-03 | A real-time audio level meter shall indicate that the microphone is active and receiving signal. | Must Have | PRD |
| UI-04 | A sensitivity slider shall allow adjustment of the noise gate threshold. | Must Have | PRD + Q5 |
| UI-05 | The layout shall be responsive and usable on screens from **360px width** upward (full phone portrait support). The keyboard panel scrolls horizontally; controls stack vertically on narrow viewports. | Must Have | PRD + Q6 |
| UI-06 | An onboarding modal shall introduce key features on the user's first visit (persisted via localStorage). | Must Have | PRD + Q5 |
| UI-07 | The app shall display the note history (last 5 notes) in a sidebar or panel. | Must Have | PRD + Q5 |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement |
|---|---|
| NFR-P-01 | Page load under 2 seconds on a 10Mbps connection. |
| NFR-P-02 | Audio pipeline initialises within 500ms of microphone permission grant. |
| NFR-P-03 | End-to-end latency (key strike to neon highlight) under 100ms on Chrome desktop. |
| NFR-P-04 | Canvas animations sustain 60fps on a mid-range laptop (2020 or newer). |

### NFR-2: Security & Privacy

| ID | Requirement |
|---|---|
| NFR-S-01 | No audio data transmitted off-device at any time. All processing is client-side only. |
| NFR-S-02 | HTTPS required for all deployments (getUserMedia constraint). |
| NFR-S-03 | No microphone data stored or logged. Privacy policy to state audio is processed locally only. |

*Note: Security extension rules are disabled for this project (Q10: opted out).*

### NFR-3: Accessibility

| ID | Requirement |
|---|---|
| NFR-A-01 | WCAG 2.1 AA compliance verified via automated audit (axe or similar). |
| NFR-A-02 | All interactive elements (keys, toggle, slider, theme selector) shall have screen reader labels. |
| NFR-A-03 | Keyboard navigation support for all UI controls. |
| NFR-A-04 | Provide visual fallback descriptions for users with colour vision deficiencies. |

### NFR-4: Browser Compatibility

| Browser | Min Version | Status |
|---|---|---|
| Chrome | 90+ | Supported |
| Firefox | 90+ | Supported |
| Safari | 14.1+ | Supported (HTTPS only) |
| Edge (Chromium) | 90+ | Supported |
| Mobile Safari (iOS) | 14.5+ | Supported (HTTPS only) |
| Chrome Android | 90+ | Supported |

### NFR-5: Reliability

| ID | Requirement |
|---|---|
| NFR-R-01 | App shall remain functional if audio input drops transiently; auto-reconnect within 1 second. |
| NFR-R-02 | App degrades gracefully if microphone permission is denied (demo/manual mode available). |

### NFR-6: Maintainability & Testing

| ID | Requirement |
|---|---|
| NFR-M-01 | Code coverage greater than 70% (unit + component tests via Vitest + RTL). |
| NFR-M-02 | Modular audio and UI components with documented TypeScript interfaces. |
| NFR-M-03 | End-to-end tests via Playwright covering core user flows. |
| NFR-M-04 | Property-based tests (fast-check, partial mode) for pitch detection pure functions and frequency/MIDI round-trip conversions (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09 enforced). |

---

## Property-Based Testing Scope (Partial Enforcement)

PBT extension is enabled in **Partial** mode. Only the following rules are enforced as blocking constraints:

| Rule | Description | Applicable Areas in PianoVora |
|---|---|---|
| PBT-02 | Round-trip properties | Frequency → MIDI note number → frequency (round-trip within tolerance); MIDI → key index → MIDI |
| PBT-03 | Invariant properties | Pitch detection output always in valid piano range [27.5Hz, 4186Hz] or null; key index always in [0, 87] |
| PBT-07 | Generator quality | Domain generators for frequency values (constrained to piano range), MIDI note numbers (21–108), key indices (0–87) |
| PBT-08 | Shrinking and reproducibility | fast-check shrinking enabled; seed logged on failure; PBT included in CI |
| PBT-09 | Framework selection | fast-check documented in package.json and tech stack decisions |

---

## Scope Summary

### In Scope — v1.0 (All Must Have + All Should Have)

- Real-time microphone audio capture via Web Audio API
- Pitch detection using `pitchy` library (YIN/McLeod), client-side only
- Full 88-key SVG piano keyboard (A0–C8)
- Canvas overlay for neon sparkle/glow animations at 60fps
- Three confirmed neon themes: Cyber, Aurora, Sunset
- Note name overlay on detected key (e.g. G#4)
- Single-note recognition only
- Clickable/tappable keys for testing visuals without audio
- On/off microphone toggle
- Real-time audio level meter
- Sensitivity slider (noise gate threshold)
- Note history panel (last 5 notes)
- Onboarding modal on first visit
- Responsive layout from 360px (full phone portrait) to desktop
- Dark theme UI
- Microphone permission handling and error states
- Zero install, no login, browser-native

### Out of Scope — v1.0

- Polyphonic / chord recognition (deferred to v2)
- Sheet music display or score following
- MIDI device input (USB/Bluetooth)
- Practice session recording or history
- User accounts or cloud sync
- Gamification or scoring engine
- Native mobile application (iOS/Android)

---

## Launch Acceptance Criteria (from PRD Section 13)

1. Note detection accuracy on 50 standard piano notes achieves >95%.
2. End-to-end latency from key strike to neon highlight measured at <100ms on Chrome desktop.
3. Full 88-key keyboard renders correctly and is scrollable at 360px viewport width.
4. Neon sparkle animation sustains 60fps on a mid-range 2020+ laptop.
5. App passes WCAG 2.1 AA automated accessibility audit.
6. Privacy review confirms zero audio data leaves the device.
7. Successful testing on Chrome 110+, Firefox 110+, Safari 16+, Edge 110+.
8. User acceptance testing with 5 piano learners confirms intuitive use without instruction.

---

## Key Assumptions & Constraints

- HTTPS deployment is mandatory (getUserMedia constraint).
- Users play equal-temperament piano tuned to A4 = 440Hz.
- Device microphone positioned within 1–3 metres of the piano.
- No external audio ML API budget — all processing client-side.
- Safari Web Audio API partial support handled via targeted workarounds.
