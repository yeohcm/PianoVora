# PianoVora — Requirements Document

**Version**: 1.1  
**Date**: 2026-06-23  
**Source PRD**: docs/PianoVora_PRD_v1.0.md + User Feature Request 2026-06-23  
**Status**: Approved

---

## Intent Analysis Summary

| Attribute | Detail |
|---|---|
| **User Request** | Add feature: when a key is pressed, play the sound accordingly. |
| **Request Type** | Feature Addition (Brownfield) |
| **Scope** | Keyboard UI & Audio Synthesis Integration — add mode toggle (Mic vs. Synth), construct oscillator-based monophonic synth player, wire keyboard triggers to sound output, and bypass mic capture in Synth mode. |
| **Complexity** | Moderate — requires modifying global Zustand store, updating layout controls, integrating Web Audio oscillator synthesis, and ensuring clean monophonic decay. |

---

## Technology Stack Decisions

| Layer | Decision | Rationale |
|---|---|---|
| Language | TypeScript (strict mode) | Type safety for audio processing and canvas code; catches errors at compile time |
| Frontend Framework | React 18 + Vite | Fast HMR, component model suits keyboard UI |
| State Management | Zustand | Lightweight external store; minimal boilerplate for audio state, detected note, theme, and mode |
| Pitch Detection | `pitchy` library (YIN/McLeod) | Battle-tested, browser-native, no WASM complexity |
| Keyboard Rendering | SVG keyboard + HTML Canvas overlay | SVG gives accessible DOM nodes per key; Canvas layer handles 60fps glow and sparkle effects |
| Audio Output | Web Audio API OscillatorNode | Zero external audio asset downloads; low-latency monophonic tone generation using sine/triangle waveforms |
| Styling | Tailwind CSS + CSS custom properties | Dark-theme development; neon palettes via CSS variables |
| Testing | Vitest + React Testing Library + Playwright | Native Vite integration; fast unit tests + browser e2e |
| Deployment | Netlify / GitHub Pages | Static hosting; global CDN |

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

### FR-6: Sound Playback & Synthesis

| ID | Requirement | Priority | Source |
|---|---|---|---|
| SP-01 | The app shall support playing note sound when virtual keys are clicked or keyboard-focused (via Enter/Space) on screen. | Must Have | Req-Q3 |
| SP-02 | The app shall feature a prominent toggle/switch button in the UI header to switch between two modes: **Mic Mode** and **Synth Mode**. | Must Have | Req-Clar-Q1 |
| SP-03 | In **Mic Mode**, the microphone capture and real-time pitch detection engine are active. Pressing virtual keys does NOT play sound (remains silent). | Must Have | Req-Clar-Q1 |
| SP-04 | In **Synth Mode**, the microphone audio capture is stopped and pitch detection is inactive. Clicking virtual keys triggers oscillator sound playback. | Must Have | Req-Clar-Q1 |
| SP-05 | Sound synthesis shall operate completely client-side utilizing Web Audio API oscillators (`OscillatorNode`). | Must Have | Req-Q4 |
| SP-06 | Tone generation shall be monophonic (only one note plays at a time; starting a new note cuts off the previous note with a smooth volume release envelope to prevent pops). | Must Have | Req-Q6 |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement |
|---|---|
| NFR-P-01 | Page load under 2 seconds on a 10Mbps connection. |
| NFR-P-02 | Audio pipeline initialises within 500ms of microphone permission grant. |
| NFR-P-03 | End-to-end latency (key strike to sound playback and neon highlight) under 100ms on Chrome desktop. |
| NFR-P-04 | Canvas animations sustain 60fps on a mid-range laptop (2020 or newer). |

### NFR-2: Security & Privacy

| ID | Requirement |
|---|---|
| NFR-S-01 | No audio data transmitted off-device at any time. All processing is client-side only. |
| NFR-S-02 | HTTPS required for all deployments (getUserMedia constraint). |
| NFR-S-03 | No microphone data stored or logged. Privacy policy to state audio is processed locally only. |

*Note: Security extension rules are disabled for this project.*

### NFR-3: Accessibility

| ID | Requirement |
|---|---|
| NFR-A-01 | WCAG 2.1 AA compliance verified via automated audit (axe or similar). |
| NFR-A-02 | All interactive elements (keys, toggle, slider, theme selector, mode switch) shall have screen reader labels. |
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
| NFR-R-02 | App degrades gracefully if microphone permission is denied (demo/manual mode available via Synth Mode). |

### NFR-6: Maintainability & Testing

| ID | Requirement |
|---|---|
| NFR-M-01 | Code coverage greater than 70% (unit + component tests via Vitest + RTL). |
| NFR-M-02 | Modular audio and UI components with documented TypeScript interfaces. |
| NFR-M-03 | End-to-end tests via Playwright covering core user flows. |

*Note: Property-based testing (PBT) extension is disabled for the sound playback feature scope.*

---

## Scope Summary

### In Scope — v1.1 (Sound Playback Feature Addition)
- Real-time Web Audio API monophonic synthesizer using oscillators.
- UI Mode Switch button (Mic Mode vs. Synth Mode).
- Automatic stop/suspend of microphone input and level meter when switching to Synth Mode.
- Keyboard triggers (mouse clicks, touch events, and keyboard space/enter) playing the target frequency sound in Synth Mode.
- Integration tests ensuring that switching modes correctly updates store state and stops/starts microphone hooks.
