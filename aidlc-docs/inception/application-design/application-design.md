# PianoVora — Application Design (Consolidated)

**Version**: 1.0 | **Date**: 2026-05-09  
**Status**: Complete

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Service layer | Custom React hooks | React-idiomatic; hooks are testable with RTL; no class instantiation boilerplate |
| State management | Single Zustand store, 3 named slices | One store, clear domain boundaries; avoids prop drilling |
| Canvas/SVG coordination | Shared `pianoGeometry.ts` module | Single source of truth; no DOM reads; enables PBT on pure geometry functions |
| Folder structure | Feature-based (`src/features/*`) | Each unit owns its components, hooks, types; clear boundary per unit of work |

---

## Architecture Overview

```
App
  ThemeProvider (CSS vars from uiSlice.theme)
    AppLayout (dark theme, responsive 360px+)
      OnboardingModal    (uiSlice)
      ErrorBanner        (audioSlice.permissionState)
      Header
        MicToggle        (useAudioEngine)
        AudioLevelMeter  (audioSlice.audioLevel)
        SensitivitySlider (audioSlice.noiseGateThreshold)
        ThemeSelector    (uiSlice.theme)
      KeyboardSection
        PianoKeyboard    (SVG, pitchSlice.detectedNote, pianoGeometry)
        CanvasOverlay    (Canvas, pitchSlice.detectedNote, pianoGeometry, CSS vars)
      Sidebar
        NoteHistoryPanel (pitchSlice.noteHistory)
```

---

## Component Catalogue

### Audio (Unit 1)
| Name | Type | Responsibility |
|---|---|---|
| `useAudioEngine` | Hook | getUserMedia, AudioContext, AnalyserNode, noise gate RMS, stop/restart |
| `MicToggle` | Component | On/off button; reads `isListening` |
| `AudioLevelMeter` | Component | Real-time bar; reads `audioLevel` |
| `SensitivitySlider` | Component | Noise gate slider; reads/writes `noiseGateThreshold` |

### Pitch Detection (Unit 2)
| Name | Type | Responsibility |
|---|---|---|
| `usePitchDetector` | Hook | pitchy integration, freq-to-MIDI mapping, writes `detectedNote` + `noteHistory` |
| `pianoGeometry.ts` | Utility | Pure frequency/MIDI/key-index/note-name mapping functions |

### Keyboard & Visual Feedback (Unit 3)
| Name | Type | Responsibility |
|---|---|---|
| `PianoKeyboard` | Component | 88-key SVG renderer; active key highlight; scroll centring; click events |
| `CanvasOverlay` | Component | Canvas positioned over SVG; delegates to `useSparkleAnimation` |
| `useSparkleAnimation` | Hook | requestAnimationFrame loop; particle system; glow effects |
| `pianoGeometry.ts` | Utility | Pure key rect geometry functions (shared with Unit 2) |
| `ThemeProvider` | Component | Applies CSS custom properties for active neon theme |
| `ThemeSelector` | Component | Cyber / Aurora / Sunset picker |

### UI Shell & Features (Unit 4)
| Name | Type | Responsibility |
|---|---|---|
| `AppLayout` | Component | Root layout; responsive dark theme |
| `NoteHistoryPanel` | Component | Last 5 notes list |
| `OnboardingModal` | Component | First-visit modal; localStorage flag |
| `ErrorBanner` | Component | Permission denied / audio error UI |

### Store (Unit 4)
| Name | Slice | Key State |
|---|---|---|
| `useAppStore` | `audioSlice` | isListening, permissionState, audioLevel, noiseGateThreshold |
| `useAppStore` | `pitchSlice` | detectedNote, noteHistory |
| `useAppStore` | `uiSlice` | theme, onboardingDismissed |

---

## Key Interface Contracts

```typescript
// Detected note — flows from usePitchDetector → pitchSlice → PianoKeyboard + CanvasOverlay
interface DetectedNote {
  frequency: number;   // Hz
  midiNote: number;    // 21–108
  keyIndex: number;    // 0–87
  noteName: string;    // "G#4"
  octave: number;      // 0–8
  timestamp: number;   // performance.now()
}

// Key geometry — shared between SVG and Canvas layers
interface KeyRect {
  x: number; y: number; width: number; height: number; isBlack: boolean;
}

// useAudioEngine return — passes analyserNode to usePitchDetector
interface AudioEngineResult {
  analyserNode: React.RefObject<AnalyserNode | null>;
  start: () => Promise<void>;
  stop: () => void;
}
```

---

## Data Flow Summary

```
Microphone
  → useAudioEngine → audioSlice → MicToggle, AudioLevelMeter, SensitivitySlider, ErrorBanner
  → analyserNode ref
        → usePitchDetector (+ pitchy + pianoGeometry) → pitchSlice
              → PianoKeyboard (SVG highlight)
              → CanvasOverlay → useSparkleAnimation (+ pianoGeometry + CSS vars)
              → NoteHistoryPanel

uiSlice.theme → ThemeProvider → CSS vars → SVG fills + Canvas shadowColor + CSS glow
```

---

## Detailed Artefacts

- **Components & responsibilities**: `components.md`
- **Method signatures & types**: `component-methods.md`
- **Store slices & hook orchestration**: `services.md`
- **Dependency matrix & data flow**: `component-dependency.md`
