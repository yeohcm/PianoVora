# Unit 4: UI Shell & Features — Functional Design Plan

## Unit Context

**Purpose**: Compose all units into the final responsive application. Dark-theme layout, note history panel, onboarding modal, error states, localStorage persistence, Netlify deployment configuration.

**Stories**: FEAT-01 (permission UI), FEAT-05 (ThemeSelector wired), FEAT-06 (Sensitivity Control in layout), FEAT-07 (Note History UI), FEAT-08 (Onboarding), FEAT-09 (Error & Fallback UI)

**PRD Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, NFR-A-01, NFR-A-02, NFR-A-03, NFR-R-02

**Components to design**:
- `src/main.tsx` — React entry point
- `src/App.tsx` — root component (ThemeProvider wrapper)
- `src/features/ui/AppLayout.tsx` — responsive dark-theme layout
- `src/features/ui/NoteHistoryPanel.tsx` — last 5 notes display
- `src/features/ui/OnboardingModal.tsx` — first-visit intro modal
- `src/features/ui/ErrorBanner.tsx` — permission denied / error state
- `src/store/uiSlice.ts` — complete onboardingDismissed (scaffolded in Unit 3)
- `netlify.toml` + `public/_redirects` — SPA deployment

**Dependencies on prior units**:
- Unit 1: `MicToggle`, `AudioLevelMeter`, `SensitivitySlider`, `audioSlice` (isListening, permissionState, audioLevel, noiseGateThreshold)
- Unit 2: `pitchSlice.noteHistory`
- Unit 3: `PianoKeyboard`, `ThemeProvider`, `ThemeSelector`, `uiSlice.theme`

---

## Functional Design Steps

- [x] Analyse unit definition and story map
- [x] Identify design questions
- [x] Collect answers
- [x] Generate business-logic-model.md
- [x] Generate business-rules.md
- [x] Generate domain-entities.md
- [x] Generate frontend-components.md

---

## Open Questions

---

### Question 1
**UI-05 — AppLayout visual structure**

The layout must work from 360px upward (UI-05). On larger screens, how should the components be arranged?

A) **Single column, top-down** — Row 1: header (logo + MicToggle + AudioLevelMeter + SensitivitySlider + ThemeSelector). Row 2: PianoKeyboard (full width). Row 3: NoteHistoryPanel (below keyboard). Everything stacks vertically; no sidebar. Simple and mobile-first.

B) **Main + right sidebar** — PianoKeyboard spans the main content area; a right sidebar (visible on wide screens, hidden on mobile) contains MicToggle, AudioLevelMeter, SensitivitySlider, ThemeSelector, and NoteHistoryPanel. Mobile collapses sidebar below the keyboard.

C) **Header + split bottom row** — Header row (logo, MicToggle, AudioLevelMeter, ThemeSelector). PianoKeyboard (full width). Bottom row split: SensitivitySlider left, NoteHistoryPanel right.

[Answer]: A

---

### Question 2
**UI-06 — Onboarding modal content and structure**

The modal appears on first visit (localStorage) and explains key features (AC-02 permission context included). What form should it take?

A) **Minimal intro** — Title "Welcome to PianoVora", 3–4 brief bullet points describing: microphone detection, click keys for demo mode, colour themes, note history panel. Single "Got it" dismiss button. No steps, no navigation.

B) **Permission-first** — Modal leads with the microphone permission explanation (AC-02 requirement), then lists other features. Two buttons: "Allow Microphone" (closes modal and triggers mic permission request) and "Use Demo Mode" (closes modal, no mic).

C) **Step-by-step walkthrough** — Multi-step modal (3 steps) with Next/Back navigation: (1) What is PianoVora, (2) How to use it, (3) Pick a theme. Progress indicator. "Get Started" on final step.

[Answer]: A

---

### Question 3
**UI-03/AC-03 — ErrorBanner scope and interaction**

When `permissionState === 'denied'` or `'error'`, what should the ErrorBanner do?

A) **Non-blocking top banner** — A fixed banner below the header explains the error (permission denied / device error) with a "How to grant access" instruction. The rest of the UI (keyboard in demo mode, controls) remains fully visible and usable below the banner.

B) **Centred informational overlay** — A modal-like overlay (semi-transparent dark backdrop) with the error message and a "Use Demo Mode" button. Clicking "Use Demo Mode" dismisses the overlay; the keyboard becomes usable in teacher-click-only mode.

C) **Inline MicToggle state** — No separate ErrorBanner component; the MicToggle button changes appearance and tooltip text to indicate the error. A small `<p>` below the toggle shows the error message.

[Answer]: A

---

### Question 4
**UI-07 — NoteHistoryPanel display fields**

For each of the last 5 detected notes shown in the history panel, what data should be displayed?

A) **Note name + octave only** — Large readable label, e.g. "G#4". Clean, minimal. No frequency, no timestamp.

B) **Note name + octave + frequency** — Primary: "G#4", secondary: "415.3 Hz". Adds educational value for learners mapping notes to frequencies.

C) **Note name + octave + sequential index** — Primary: "G#4", secondary: "#3" (3rd most recent). Makes the 5-slot ordering explicit.

[Answer]: A

---
