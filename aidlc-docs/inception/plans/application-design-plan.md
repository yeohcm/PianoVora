# PianoVora — Application Design Plan

## Context
- **Requirements**: `aidlc-docs/inception/requirements/requirements.md`
- **Stories**: `aidlc-docs/inception/user-stories/stories.md`
- **Stack**: TypeScript + React 18 + Vite + Zustand + pitchy + SVG/Canvas + Tailwind + Vitest + fast-check + Netlify

---

## Design Questions

Please answer each question by filling in the letter after the `[Answer]:` tag.

---

### Question 1
**Service Layer Pattern**

Audio capture and pitch detection logic needs to live somewhere. The two common patterns for React + TypeScript:

A) **Custom React hooks** — `useAudioEngine()` and `usePitchDetector()` hooks encapsulate the browser API calls and state. Simpler, React-idiomatic, hooks are easily testable with RTL.
B) **Service classes + thin hooks** — `AudioEngineService` and `PitchDetectionService` are plain TypeScript classes instantiated once; hooks are thin wrappers that connect service output to Zustand. Service classes are independently unit-testable without React and easier to mock in fast-check property tests.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
**Zustand Store Structure**

A) **Single store with named slices** — one `useAppStore` with separate slice creators (`createAudioSlice`, `createPitchSlice`, `createUISlice`). One store, clear boundaries.
B) **Multiple independent stores** — separate `useAudioStore`, `usePitchStore`, `useUIStore`. Each domain fully isolated; components import only what they need.
C) **Single flat store** — one `useAppStore` with all state fields at the top level. Simpler for a small app.
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
**Canvas / SVG Key Position Coordination**

The Canvas overlay must draw sparkle effects at the exact pixel position of each SVG key. Three approaches:

A) **Shared geometry module** — a `pianoGeometry.ts` module calculates key positions (x, y, width, height) from a single source of truth. Both the SVG renderer and Canvas animator import from it. No DOM reads needed.
B) **DOM rect reading** — Canvas reads `getBoundingClientRect()` from SVG key DOM elements via React refs at animation time. Simple but creates a tight DOM dependency.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4
**Source Folder Structure**

A) **Feature-based** — `src/features/audio/`, `src/features/keyboard/`, `src/features/pitch/`, `src/features/ui/`. Each feature owns its components, hooks, services, and types.
B) **Layer-based** — `src/components/`, `src/hooks/`, `src/services/`, `src/store/`, `src/utils/`. Organised by technical role, not by feature.
C) **Hybrid** — Feature folders for the 4 units (`src/audio/`, `src/pitch/`, `src/keyboard/`, `src/ui/`) with a shared `src/shared/` for cross-cutting types and utilities.
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Design Artifact Checklist (executed after plan approval)

- [x] Generate `aidlc-docs/inception/application-design/components.md`
  - [x] AudioEngine component/service
  - [x] PitchDetector component/service
  - [x] PianoKeyboard (SVG layer)
  - [x] CanvasOverlay (animation layer)
  - [x] ThemeProvider
  - [x] NoteHistoryPanel
  - [x] SensitivitySlider
  - [x] OnboardingModal
  - [x] AudioLevelMeter
  - [x] MicToggle
  - [x] ErrorBanner
  - [x] App root / layout
- [x] Generate `aidlc-docs/inception/application-design/component-methods.md`
  - [x] Method signatures per component
  - [x] Input/output types
- [x] Generate `aidlc-docs/inception/application-design/services.md`
  - [x] Zustand store definition (slices and shape)
  - [x] Service/hook orchestration pattern
- [x] Generate `aidlc-docs/inception/application-design/component-dependency.md`
  - [x] Dependency matrix
  - [x] Data flow diagram (text)
- [x] Generate `aidlc-docs/inception/application-design/application-design.md` (consolidated)
