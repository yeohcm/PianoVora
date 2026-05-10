# PianoVora — Unit of Work Story Map

**Version**: 1.0 | **Date**: 2026-05-09

---

## Story-to-Unit Mapping

| Story ID | Story Name | Primary Unit | Secondary Unit |
|---|---|---|---|
| FEAT-01 | Audio Capture & Permissions | Unit 1: Audio Engine | Unit 4: UI Shell (permission UI, toggle, meter) |
| FEAT-02 | Pitch Detection | Unit 2: Pitch Detection | Unit 1 (provides audio buffer) |
| FEAT-03 | On-Screen Keyboard | Unit 3: Keyboard & Visual Feedback | — |
| FEAT-04 | Neon Visual Feedback | Unit 3: Keyboard & Visual Feedback | — |
| FEAT-05 | Colour Theme Selection | Unit 3: Keyboard & Visual Feedback | Unit 4 (ThemeSelector wired into layout) |
| FEAT-06 | Sensitivity Control | Unit 1: Audio Engine | Unit 4 (SensitivitySlider in layout) |
| FEAT-07 | Note History Panel | Unit 2: Pitch Detection (data) | Unit 4: UI Shell (NoteHistoryPanel component) |
| FEAT-08 | Onboarding Experience | Unit 4: UI Shell & Features | — |
| FEAT-09 | Error & Fallback Handling | Unit 1: Audio Engine (reconnect logic) | Unit 4: UI Shell (ErrorBanner, demo mode wiring) |
| FEAT-10 | Music Teacher Demonstration | Unit 3: Keyboard & Visual Feedback (clickable keys) | Unit 4 (onKeyClick handler in AppLayout) |

---

## PRD Requirement-to-Unit Mapping

### Audio Capture (AC) → Unit 1

| Req ID | Requirement | Unit |
|---|---|---|
| AC-01 | Request microphone via getUserMedia on load | Unit 1 |
| AC-02 | Permission explanation before access requested | Unit 1 + Unit 4 |
| AC-03 | Error message with instructions on denial | Unit 1 (state) + Unit 4 (ErrorBanner) |
| AC-04 | Sample rate minimum 44,100 Hz | Unit 1 |
| AC-05 | Stop and restart audio capture from UI | Unit 1 (hook) + Unit 4 (MicToggle in layout) |

### Pitch Detection (PD) → Unit 2

| Req ID | Requirement | Unit |
|---|---|---|
| PD-01 | Real-time fundamental frequency detection | Unit 2 |
| PD-02 | Full piano range A0–C8 coverage | Unit 2 |
| PD-03 | Client-side only, no server round-trip | Unit 2 |
| PD-04 | Detection latency < 100ms | Unit 2 |
| PD-05 | Noise gate below configurable threshold | Unit 1 (RMS check) + Unit 2 (gate check) |
| PD-06 | >95% accuracy for single-note input | Unit 2 |
| PD-07 | Frequency mapped to nearest MIDI note | Unit 2 (`pianoGeometry.ts`) |

### Keyboard (KB) → Unit 3

| Req ID | Requirement | Unit |
|---|---|---|
| KB-01 | Full 88-key keyboard A0–C8 | Unit 3 |
| KB-02 | Accurate white/black key proportions | Unit 3 (`pianoGeometry.ts`) |
| KB-03 | Octave markers C1–C8 | Unit 3 |
| KB-04 | Horizontal scroll; active key centred | Unit 3 |
| KB-05 | Clickable/tappable keys for demo mode | Unit 3 |
| KB-06 | SVG keyboard + Canvas overlay rendering | Unit 3 |

### Visual Feedback (VF) → Unit 3

| Req ID | Requirement | Unit |
|---|---|---|
| VF-01 | Key illuminates on note detection | Unit 3 |
| VF-02 | Animated sparkle/glow on Canvas overlay | Unit 3 |
| VF-03 | Distinct neon colours for white vs black keys | Unit 3 |
| VF-04 | Glow fades within ~1 second after note stops | Unit 3 |
| VF-05 | Note name + octave overlay on lit key | Unit 3 |
| VF-06 | Theme selector: Cyber, Aurora, Sunset | Unit 3 (ThemeProvider/ThemeSelector) |
| VF-07 | 60fps animation | Unit 3 |

### User Interface (UI) → Unit 4 (with Unit 1/3 sub-components)

| Req ID | Requirement | Unit |
|---|---|---|
| UI-01 | Dark theme, deep navy/black background | Unit 4 (AppLayout + Tailwind) |
| UI-02 | On/off microphone toggle | Unit 1 (MicToggle) + Unit 4 (layout placement) |
| UI-03 | Real-time audio level meter | Unit 1 (AudioLevelMeter) + Unit 4 (layout placement) |
| UI-04 | Sensitivity slider for noise gate | Unit 1 (SensitivitySlider) + Unit 4 (layout placement) |
| UI-05 | Responsive from 360px width | Unit 4 (AppLayout Tailwind breakpoints) |
| UI-06 | Onboarding modal on first visit | Unit 4 (OnboardingModal) |
| UI-07 | Note history panel (last 5 notes) | Unit 2 (data) + Unit 4 (NoteHistoryPanel UI) |

### NFR Requirements → All Units

| Req ID | Requirement | Unit |
|---|---|---|
| NFR-P-01 | Page load < 2s on 10Mbps | Unit 4 (Vite bundle optimisation) |
| NFR-P-02 | Audio pipeline init < 500ms | Unit 1 |
| NFR-P-03 | E2E latency < 100ms | Units 1 + 2 |
| NFR-P-04 | 60fps animation | Unit 3 |
| NFR-S-01 | No audio data off-device | Unit 1 |
| NFR-S-02 | HTTPS required | Unit 4 (Netlify config) |
| NFR-S-03 | No audio data stored or logged | Unit 1 |
| NFR-A-01 | WCAG 2.1 AA audit pass | Unit 4 (axe audit) |
| NFR-A-02 | Screen reader labels on all interactive elements | Units 3 + 4 |
| NFR-A-03 | Keyboard navigable | Units 3 + 4 |
| NFR-A-04 | Visual fallback for colour vision deficiencies | Unit 3 |
| NFR-R-01 | Auto-reconnect within 1s on audio drop | Unit 1 |
| NFR-R-02 | Graceful fallback if mic denied | Unit 1 + Unit 4 |
| NFR-M-01 | Code coverage > 70% | All units |
| NFR-M-02 | Modular components with documented TypeScript interfaces | All units |
| NFR-M-03 | Playwright e2e tests | Unit 4 (test suite) |
| NFR-M-04 | fast-check PBT for pitch detection pure functions | Unit 2 |

---

## Coverage Summary

| Metric | Count |
|---|---|
| Stories mapped | 10 / 10 |
| PRD requirements mapped | 42 / 42 |
| Units with stories | 4 / 4 |
| Stories with primary unit assignment | 10 / 10 |
| Stories spanning multiple units | 5 (FEAT-01, FEAT-05, FEAT-06, FEAT-07, FEAT-09) |
