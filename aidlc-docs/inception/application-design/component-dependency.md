# PianoVora — Component Dependencies & Data Flow

**Version**: 1.0 | **Date**: 2026-05-09

---

## Dependency Matrix

| Component / Hook | Depends On | Writes To |
|---|---|---|
| `useAudioEngine` | Web Audio API (browser), Zustand `audioSlice` | `audioSlice` (isListening, permissionState, audioLevel) |
| `usePitchDetector` | `useAudioEngine` (analyserNode ref), `pitchy` lib, `pianoGeometry.ts`, Zustand `audioSlice` (reads isListening, noiseGateThreshold) | `pitchSlice` (detectedNote, noteHistory) |
| `useSparkleAnimation` | `pianoGeometry.ts`, Canvas API (browser), CSS custom properties | Canvas element (draws) |
| `PianoKeyboard` | `pianoGeometry.ts`, Zustand `pitchSlice` (reads detectedNote) | — (read-only from store; emits `onKeyClick` callback) |
| `CanvasOverlay` | `useSparkleAnimation` | Canvas element (draws) |
| `MicToggle` | `useAudioEngine` (start/stop), Zustand `audioSlice` (reads isListening) | Calls hook |
| `AudioLevelMeter` | Zustand `audioSlice` (reads audioLevel) | — |
| `SensitivitySlider` | Zustand `audioSlice` (reads/writes noiseGateThreshold) | `audioSlice` |
| `ThemeProvider` | Zustand `uiSlice` (reads theme) | `document.documentElement` CSS vars |
| `ThemeSelector` | Zustand `uiSlice` (reads/writes theme) | `uiSlice` |
| `NoteHistoryPanel` | Zustand `pitchSlice` (reads noteHistory) | — |
| `OnboardingModal` | Zustand `uiSlice` (reads/writes onboardingDismissed), localStorage | `uiSlice`, localStorage |
| `ErrorBanner` | Zustand `audioSlice` (reads permissionState) | — |
| `AppLayout` | All feature components (composes) | — |
| `pianoGeometry.ts` | None (pure utility) | — |
| `appStore.ts` (Zustand) | None | — |

---

## Data Flow Diagram

```
Browser APIs
  |
  | getUserMedia / Web Audio API
  v
useAudioEngine ---------> audioSlice (isListening, permissionState, audioLevel)
  |                           |
  | analyserNode ref          | reads noiseGateThreshold
  v                           |
usePitchDetector <-----------+
  |     ^
  |     | pitchy lib + pianoGeometry.ts
  |
  +---> pitchSlice (detectedNote, noteHistory)
              |
              |--- reads detectedNote ---> PianoKeyboard (SVG highlight)
              |--- reads detectedNote ---> CanvasOverlay --> useSparkleAnimation
              |--- reads noteHistory  ---> NoteHistoryPanel


audioSlice
  |--- reads isListening        ---> MicToggle (display state)
  |--- reads audioLevel         ---> AudioLevelMeter
  |--- reads/writes threshold   ---> SensitivitySlider
  |--- reads permissionState    ---> ErrorBanner


uiSlice
  |--- reads/writes theme       ---> ThemeSelector
  |--- reads theme              ---> ThemeProvider --> CSS vars --> all neon colours
  |--- reads/writes onboarding  ---> OnboardingModal


pianoGeometry.ts (pure, no Zustand)
  |--- imported by PianoKeyboard (SVG key positions)
  |--- imported by useSparkleAnimation (canvas key positions)
  |--- imported by usePitchDetector (freq/MIDI/keyIndex mapping)
```

---

## Communication Patterns

### Pattern 1: Hook → Store → Component (unidirectional data flow)
`useAudioEngine` and `usePitchDetector` write to Zustand. Components subscribe to specific store slices. No prop drilling. Components do not call hooks directly — they read state.

### Pattern 2: AnalyserNode Reference Passing
`useAudioEngine` exposes `analyserNode` as a `React.RefObject`. `usePitchDetector` receives this ref as a parameter. This avoids storing the `AnalyserNode` (a non-serialisable browser object) in Zustand.

### Pattern 3: Shared Geometry Module (no coupling between layers)
`PianoKeyboard` (SVG) and `useSparkleAnimation` (Canvas) both import `pianoGeometry.ts` directly. Neither component knows about the other. Position accuracy is guaranteed by the shared module — not by cross-component communication.

### Pattern 4: CSS Custom Properties (theme propagation)
`ThemeProvider` is the only component that touches CSS variables. All other components (SVG fills, Canvas shadowColor, CSS glow effects) read from the CSS variable layer. Theme changes propagate without any component re-renders beyond `ThemeProvider`.

### Pattern 5: Callback for Demo/Teacher Mode
`PianoKeyboard` emits `onKeyClick(keyIndex)` when a key is clicked. The parent (`AppLayout` or a wrapper) handles this by calling `store.setDetectedNote(...)` directly — triggering the same visual feedback path as an audio-detected note. This keeps `PianoKeyboard` unaware of whether input comes from audio or click.

---

## Unit-to-Component Mapping

| Unit | Components / Hooks |
|---|---|
| Unit 1: Audio Engine | `useAudioEngine`, `MicToggle`, `AudioLevelMeter`, `SensitivitySlider`, `audioSlice` |
| Unit 2: Pitch Detection | `usePitchDetector`, `pitchSlice`, `pianoGeometry.ts` (mapping functions) |
| Unit 3: Keyboard & Visual Feedback | `PianoKeyboard`, `CanvasOverlay`, `useSparkleAnimation`, `pianoGeometry.ts` (geometry functions), `ThemeProvider`, `ThemeSelector` |
| Unit 4: UI Shell & Features | `AppLayout`, `NoteHistoryPanel`, `OnboardingModal`, `ErrorBanner`, `uiSlice`, `appStore.ts` (store composition), Netlify config |

---

## Inter-Unit Dependencies

```
Unit 1 (Audio Engine)
  --> provides analyserNode ref to Unit 2
  --> writes audioSlice (read by Unit 4 components)

Unit 2 (Pitch Detection)
  --> depends on Unit 1's analyserNode ref
  --> writes pitchSlice (read by Unit 3 components)
  --> imports pianoGeometry.ts mapping functions

Unit 3 (Keyboard & Visual Feedback)
  --> depends on pitchSlice.detectedNote from Unit 2
  --> imports pianoGeometry.ts geometry functions
  --> reads CSS vars set by ThemeProvider (Unit 4)

Unit 4 (UI Shell & Features)
  --> reads audioSlice and pitchSlice from Units 1–2
  --> provides ThemeProvider (CSS vars consumed by Unit 3)
  --> composes all units into AppLayout
```

**Build order for Unit 3**: ThemeProvider (Unit 4) must be rendered above Unit 3 components in the React tree for CSS vars to be available. In practice, `ThemeProvider` wraps the entire app.
