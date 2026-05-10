# PianoVora — Component Definitions

**Version**: 1.0 | **Date**: 2026-05-09  
**Pattern**: Feature-based folders | Custom React hooks | Single Zustand store with slices | Shared geometry module

---

## Folder Structure

```
src/
  features/
    audio/          # Unit 1 — Audio Engine
    pitch/          # Unit 2 — Pitch Detection
    keyboard/       # Unit 3 — Piano Keyboard & Visual Feedback
    ui/             # Unit 4 — UI Shell & Features
  shared/           # Cross-cutting types, utilities, geometry
  store/            # Zustand store (single store, 3 slices)
  App.tsx
  main.tsx
```

---

## AUDIO FEATURES (`src/features/audio/`)

### useAudioEngine (Hook)
**Responsibility**: Manages the complete microphone capture lifecycle — permission request, AudioContext creation, AnalyserNode setup, noise gate (RMS), stop/restart, and audio level reporting. Writes to `audioSlice`. Exposes the `AnalyserNode` ref for downstream consumers.

**Key capabilities:**
- Requests getUserMedia with `{ audio: true }`
- Creates and manages `AudioContext`, `AnalyserNode`, `MediaStreamSourceNode`
- Computes RMS amplitude each animation frame; applies noise gate threshold
- Writes `isListening`, `permissionState`, `audioLevel`, `noiseGateThreshold` to store
- Provides `analyserNode` ref for `usePitchDetector`

### MicToggle (Component)
**Responsibility**: On/off button that calls `useAudioEngine` start/stop and reflects current listening state from `audioSlice`.

### AudioLevelMeter (Component)
**Responsibility**: Visual bar that reads `audioSlice.audioLevel` (0–1) and displays real-time signal strength to confirm microphone is active.

### SensitivitySlider (Component)
**Responsibility**: Range input that reads and writes `audioSlice.noiseGateThreshold`. Updates store in real time; `useAudioEngine` picks up the new threshold on the next RMS check cycle.

---

## PITCH FEATURES (`src/features/pitch/`)

### usePitchDetector (Hook)
**Responsibility**: Reads the float time-domain waveform buffer from the `AnalyserNode` on each animation frame, runs `pitchy`'s `PitchDetector`, converts the detected frequency to a MIDI note number and key index via `pianoGeometry`, and writes the result to `pitchSlice`. Skips detection when audio level is below noise gate.

**Key capabilities:**
- Imports `pitchy` `PitchDetector.forFloat32Array()`
- Calls `analyserNode.getFloatTimeDomainData(buffer)` per frame
- Maps frequency → MIDI note → key index using `pianoGeometry.ts`
- Writes `detectedNote` and appends to `noteHistory` (max 5) in `pitchSlice`
- Stops detection loop when `isListening` is false

---

## KEYBOARD FEATURES (`src/features/keyboard/`)

### PianoKeyboard (Component)
**Responsibility**: Renders the full 88-key SVG keyboard. Reads `pitchSlice.detectedNote` to apply the active neon colour class to the detected key. Supports horizontal scroll; scrolls programmatically to keep the active key centred. Emits `onKeyClick(keyIndex)` for demo/teacher mode.

**Key capabilities:**
- Uses `pianoGeometry.ts` to derive key positions and dimensions
- Renders 52 white keys and 36 black keys as SVG `<rect>` elements
- Octave markers (C1–C8) as SVG text below corresponding C keys
- `aria-label` per key for screen reader accessibility
- Scrollable container; active key scroll-into-centre on detection change

### CanvasOverlay (Component)
**Responsibility**: Absolutely-positioned `<canvas>` layered over the SVG keyboard. Hosts the sparkle/glow animation. Receives `activeKeyIndex` from parent (read from Zustand) and delegates animation to `useSparkleAnimation`.

### useSparkleAnimation (Hook)
**Responsibility**: Manages the `requestAnimationFrame` animation loop. On a new detected key, spawns sparkle particles at the key's canvas coordinates (from `pianoGeometry.ts`), applies glow bloom via shadow blur, and decays particle opacity over ~1 second. Targets 60fps.

**Key capabilities:**
- Reads key rect from `pianoGeometry.getKeyGeometry(keyIndex)`
- Maintains a particle array with position, velocity, opacity, and colour (from active theme CSS vars)
- Clears canvas each frame and redraws live particles
- Reads theme colours from CSS custom properties at spawn time

### pianoGeometry.ts (Utility Module — shared)
**Responsibility**: Single source of truth for all piano key geometry. Pure, stateless functions. Used by both `PianoKeyboard` (SVG) and `useSparkleAnimation` (Canvas) to guarantee pixel-accurate alignment.

**Key capabilities:**
- Derives x, y, width, height for all 88 keys based on a configurable total keyboard width
- Determines whether a key index is white or black
- Maps MIDI note number (21–108) → key index (0–87)
- Maps frequency (Hz) → nearest MIDI note → key index
- Derives note name + octave string from key index (e.g. "G#4")

---

## UI FEATURES (`src/features/ui/`)

### AppLayout (Component)
**Responsibility**: Root layout wrapper. Applies dark theme background, arranges the header, keyboard section, and controls panel. Responsive from 360px (stacked) to desktop (side-by-side controls).

### ThemeProvider (Component)
**Responsibility**: Reads `uiSlice.theme` and applies the corresponding CSS custom properties (e.g. `--neon-white-key`, `--neon-black-key`, `--glow-colour`) to the document root. Theme changes propagate automatically via CSS cascade.

### ThemeSelector (Component)
**Responsibility**: Button group or dropdown offering Cyber / Aurora / Sunset. Writes selected theme to `uiSlice.theme`.

### NoteHistoryPanel (Component)
**Responsibility**: Reads `pitchSlice.noteHistory` (up to 5 entries) and renders a scrollable list of note name + octave chips. Displays empty state when history is empty.

### OnboardingModal (Component)
**Responsibility**: Renders a modal overlay on first visit. Checks `uiSlice.onboardingDismissed` (backed by localStorage). Presents a brief feature introduction (mic, keyboard, neon feedback, themes). Writes dismissal flag to store and localStorage on close.

### ErrorBanner (Component)
**Responsibility**: Reads `audioSlice.permissionState`. When state is `'denied'` or `'error'`, renders a dismissible banner with a human-friendly error message and browser-specific instructions for granting microphone access.

---

## SHARED (`src/shared/`)

### types.ts
**Responsibility**: Shared TypeScript types used across features.

Key types:
- `DetectedNote` — `{ frequency: number; midiNote: number; keyIndex: number; noteName: string; octave: number; timestamp: number }`
- `NeonTheme` — `'cyber' | 'aurora' | 'sunset'`
- `PermissionState` — `'prompt' | 'granted' | 'denied' | 'error'`
- `KeyRect` — `{ x: number; y: number; width: number; height: number; isBlack: boolean }`

### constants.ts
**Responsibility**: App-wide constants (piano range A0=21 to C8=108 in MIDI, A4=440Hz reference, default noise gate threshold, FFT size, max note history length).

---

## STORE (`src/store/`)

### appStore.ts
**Responsibility**: Single Zustand store composed of three named slices. Exported as `useAppStore`. Each slice is created by a `create*Slice` factory function.

**Slices:**
- `audioSlice` — isListening, permissionState, audioLevel, noiseGateThreshold
- `pitchSlice` — detectedNote, noteHistory
- `uiSlice` — theme, onboardingDismissed
