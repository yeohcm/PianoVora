# PianoVora — Services & Orchestration

**Version**: 1.0 | **Date**: 2026-05-09

---

## Service Layer Overview

PianoVora does not use a traditional service class layer. Instead, orchestration is achieved through:

1. **Zustand store slices** — single source of truth for all shared application state
2. **Custom React hooks** — encapsulate browser API calls and write results to the store
3. **`pianoGeometry.ts`** — pure stateless utility module (no class, no side effects)

This is consistent with the approved design (Q1: custom hooks, Q2: single store with slices).

---

## Zustand Store — Slice Definitions

### audioSlice

**Purpose**: Owns all state related to microphone capture and audio signal processing.

```typescript
// State
isListening: boolean           // true when AudioContext is running and capturing
permissionState: PermissionState  // 'prompt' | 'granted' | 'denied' | 'error'
audioLevel: number             // current RMS amplitude, 0–1, updated ~60fps
noiseGateThreshold: number     // user-configured threshold, default DEFAULT_NOISE_GATE

// Actions
setListening(value: boolean): void
setPermissionState(state: PermissionState): void
setAudioLevel(level: number): void
setNoiseGateThreshold(threshold: number): void
```

**Writers**: `useAudioEngine`  
**Readers**: `MicToggle`, `AudioLevelMeter`, `SensitivitySlider`, `ErrorBanner`, `usePitchDetector` (reads `isListening` to gate the detection loop)

---

### pitchSlice

**Purpose**: Owns all state related to pitch detection output and note history.

```typescript
// State
detectedNote: DetectedNote | null   // most recently detected note, null when silent
noteHistory: DetectedNote[]          // ordered list, newest first, max NOTE_HISTORY_MAX

// Actions
setDetectedNote(note: DetectedNote | null): void
addToHistory(note: DetectedNote): void
clearHistory(): void
```

**Writers**: `usePitchDetector`  
**Readers**: `PianoKeyboard`, `CanvasOverlay`, `NoteHistoryPanel`

---

### uiSlice

**Purpose**: Owns all state related to the user interface presentation layer.

```typescript
// State
theme: NeonTheme               // 'cyber' | 'aurora' | 'sunset', default 'cyber'
onboardingDismissed: boolean   // true after user dismisses the onboarding modal

// Actions
setTheme(theme: NeonTheme): void
dismissOnboarding(): void
```

**Initialisation**: `onboardingDismissed` is hydrated from `localStorage` on store creation.  
**Writers**: `ThemeSelector`, `OnboardingModal`  
**Readers**: `ThemeProvider`, `OnboardingModal`

---

## Hook Orchestration

### useAudioEngine (Unit 1)

**Orchestration flow:**
```
mount
  → requestPermission() — calls navigator.mediaDevices.getUserMedia
  → on grant: create AudioContext → create AnalyserNode (FFT_SIZE=2048) → connect stream
  → start RMS loop (requestAnimationFrame)
    → getFloatTimeDomainData(buffer)
    → compute RMS amplitude → store.setAudioLevel(rms)
  → expose analyserNode ref

user clicks MicToggle "stop"
  → stop() — suspends AudioContext, clears stream tracks
  → store.setListening(false)

user clicks MicToggle "start"
  → resume AudioContext (or create new if closed)
  → store.setListening(true)
```

---

### usePitchDetector (Unit 2)

**Orchestration flow:**
```
effect triggers when analyserNode ref is populated and isListening is true
  → create pitchy PitchDetector instance for Float32Array of FFT_SIZE
  → start detection loop (requestAnimationFrame, shared with audio level loop)
    → read store.noiseGateThreshold
    → if store.audioLevel < threshold → skip, set detectedNote(null)
    → getFloatTimeDomainData(buffer)
    → pitchDetector.findPitch(buffer, SAMPLE_RATE)
    → if clarity > CLARITY_THRESHOLD and frequency in [FREQ_MIN_HZ, FREQ_MAX_HZ]:
        → midiNote = frequencyToMidiNote(frequency)
        → keyIndex = midiNoteToKeyIndex(midiNote)
        → noteName = keyIndexToNoteName(keyIndex)
        → note = { frequency, midiNote, keyIndex, noteName, octave, timestamp }
        → store.setDetectedNote(note)
        → store.addToHistory(note)
    → else:
        → store.setDetectedNote(null)

effect cleanup when isListening becomes false
  → cancel animation frame
  → store.setDetectedNote(null)
```

---

### useSparkleAnimation (Unit 3)

**Orchestration flow:**
```
effect triggers when activeKeyIndex changes (not null)
  → read keyRect = getKeyGeometry(activeKeyIndex, totalKeyboardWidth)
  → spawn N particles at keyRect centre (x + width/2, y + height/2)
  → each particle has: position, velocity (random radial), opacity=1, colour (from CSS vars)
  → animation loop (requestAnimationFrame):
    → clear canvas
    → for each particle:
        → update position (velocity step)
        → decay opacity (linear over SPARKLE_FADE_MS)
        → draw glow (shadowBlur) + particle dot
    → remove fully faded particles
    → if particles remain → schedule next frame
    → else → stop loop

effect triggers when activeKeyIndex becomes null
  → immediately fade all remaining particles → clear canvas
```

---

## pianoGeometry.ts — Pure Utility (no state, no side effects)

**Role**: Shared calculation module. Not a service in the traditional sense — it is a stateless utility imported directly by components and hooks. No dependency on React or Zustand.

**Key invariants enforced:**
- Key index always in [0, 87]
- MIDI note always in [MIDI_NOTE_MIN, MIDI_NOTE_MAX] = [21, 108]
- Frequency always in [FREQ_MIN_HZ, FREQ_MAX_HZ] = [27.5, 4186.0]
- All geometry functions return deterministic results for the same input

**PBT applicability** (PBT-02 round-trip, PBT-03 invariants):
- `frequencyToMidiNote` + `midiNoteToKeyIndex` are testable as a composition
- `keyIndexToNoteName` output is verifiable against known note names
- `getAllKeyGeometry` output: 52 white keys + 36 black keys = 88 total (invariant)

---

## ThemeProvider — CSS Custom Property Service

**Role**: Acts as the bridge between the Zustand `uiSlice.theme` value and the CSS layer. On every theme change, it writes:

```
--neon-white-key:   <colour>
--neon-black-key:   <colour>
--glow-colour:      <colour>
--sparkle-colour-1: <colour>
--sparkle-colour-2: <colour>
--key-shadow:       <box-shadow>
```

Components (SVG fill, Canvas `shadowColor`, CSS `box-shadow`) read these variables — no theme logic lives in individual components.

**Theme palette table** (defined in Functional Design):

| Property | Cyber | Aurora | Sunset |
|---|---|---|---|
| `--neon-white-key` | Cyan | Green | Orange |
| `--neon-black-key` | Magenta | Purple | Pink |
| `--glow-colour` | Electric Blue | Teal | Amber |

Exact hex values defined during Functional Design (Unit 3).
