# PianoVora — Units of Work

**Version**: 1.0 | **Date**: 2026-05-09  
**Package structure**: Single `package.json` (Vite SPA)  
**Test location**: Centralised `src/__tests__/` (mirrors source tree)  
**Build order**: Unit 1 → Unit 2 → Unit 3 → Unit 4

---

## Code Organisation Strategy

```
pianovora/                        # workspace root
  package.json                    # single package — all deps here
  vite.config.ts
  tsconfig.json
  tsconfig.node.json
  index.html
  netlify.toml                    # Unit 4
  public/
    _redirects                    # SPA routing for Netlify — Unit 4
  src/
    main.tsx                      # entry point — Unit 4
    App.tsx                       # root component — Unit 4
    shared/                       # cross-cutting, no feature deps
      types.ts                    # Unit 1 (scaffolded), all units use
      constants.ts                # Unit 1 (scaffolded), all units use
      pianoGeometry.ts            # Unit 2 (all pure functions)
    store/
      audioSlice.ts               # Unit 1
      pitchSlice.ts               # Unit 2
      uiSlice.ts                  # Unit 3 (theme) + Unit 4 (onboarding)
      appStore.ts                 # Unit 4 (composes all slices)
    features/
      audio/                      # Unit 1
        useAudioEngine.ts
        MicToggle.tsx
        AudioLevelMeter.tsx
        SensitivitySlider.tsx
      pitch/                      # Unit 2
        usePitchDetector.ts
      keyboard/                   # Unit 3
        PianoKeyboard.tsx
        CanvasOverlay.tsx
        useSparkleAnimation.ts
      ui/                         # Units 3 + 4
        ThemeProvider.tsx         # Unit 3
        ThemeSelector.tsx         # Unit 3
        AppLayout.tsx             # Unit 4
        NoteHistoryPanel.tsx      # Unit 4
        OnboardingModal.tsx       # Unit 4
        ErrorBanner.tsx           # Unit 4
    __tests__/                    # centralised tests
      features/
        audio/
          useAudioEngine.test.ts
          MicToggle.test.tsx
          AudioLevelMeter.test.tsx
          SensitivitySlider.test.tsx
        pitch/
          usePitchDetector.test.ts
        keyboard/
          PianoKeyboard.test.tsx
          CanvasOverlay.test.tsx
          useSparkleAnimation.test.ts
        ui/
          ThemeProvider.test.tsx
          ThemeSelector.test.tsx
          AppLayout.test.tsx
          NoteHistoryPanel.test.tsx
          OnboardingModal.test.tsx
          ErrorBanner.test.tsx
      shared/
        pianoGeometry.test.ts     # includes fast-check PBT tests
        types.test.ts             # type guard tests if needed
      e2e/
        piano-practice.spec.ts    # Playwright e2e
        mic-permission.spec.ts
        theme-selector.spec.ts
```

**Shared module rules:**
- `src/shared/` files have zero imports from `src/features/` or `src/store/`
- `src/store/` files import only from `src/shared/types.ts`
- Feature files may import from `src/shared/` and `src/store/` but NOT from sibling features (except via the store)
- The only cross-feature coupling allowed: Unit 3 reads `uiSlice.theme` (written by Unit 3's ThemeSelector, scaffolded in Unit 4's appStore)

---

## Unit 1: Audio Engine

**Purpose**: Capture microphone input, manage Web Audio API lifecycle, compute RMS amplitude, apply noise gate, expose the AnalyserNode for downstream pitch detection.

**Stories**: FEAT-01 (Audio Capture & Permissions), FEAT-09 (Error & Fallback — audio layer)

**PRD Requirements**: AC-01, AC-02, AC-03, AC-04, AC-05, UI-02, UI-03, UI-04, NFR-S-01, NFR-S-02, NFR-R-01

**Source files introduced:**
```
src/shared/types.ts              (scaffolded: PermissionState, DetectedNote stubs)
src/shared/constants.ts          (FFT_SIZE, SAMPLE_RATE, DEFAULT_NOISE_GATE, A4_FREQUENCY, etc.)
src/store/audioSlice.ts          (isListening, permissionState, audioLevel, noiseGateThreshold)
src/features/audio/useAudioEngine.ts
src/features/audio/MicToggle.tsx
src/features/audio/AudioLevelMeter.tsx
src/features/audio/SensitivitySlider.tsx
```

**Test files:**
```
src/__tests__/features/audio/useAudioEngine.test.ts
src/__tests__/features/audio/MicToggle.test.tsx
src/__tests__/features/audio/AudioLevelMeter.test.tsx
src/__tests__/features/audio/SensitivitySlider.test.tsx
```

**Dependencies**: Web Audio API (browser), Zustand `audioSlice`

**Outputs for Unit 2**: `analyserNode` React ref (passed as parameter to `usePitchDetector`)

**NFR Focus**: HTTPS requirement, no audio data off-device, auto-reconnect within 1s, Safari Web Audio compatibility

---

## Unit 2: Pitch Detection

**Purpose**: Read the waveform buffer from the AnalyserNode, run the pitchy pitch detector, convert frequency to MIDI note and key index, update the Zustand store with the detected note and note history.

**Stories**: FEAT-02 (Pitch Detection), FEAT-07 (Note History — data layer)

**PRD Requirements**: PD-01, PD-02, PD-03, PD-04, PD-05, PD-06, PD-07, UI-07 (data)

**Source files introduced:**
```
src/shared/pianoGeometry.ts      (all pure functions: frequencyToMidiNote, midiNoteToKeyIndex,
                                  keyIndexToNoteName, keyIndexToOctave, getKeyGeometry,
                                  getAllKeyGeometry, isBlackKey)
src/shared/types.ts              (completed: DetectedNote, KeyRect, NeonTheme)
src/store/pitchSlice.ts          (detectedNote, noteHistory)
src/features/pitch/usePitchDetector.ts
```

**Test files:**
```
src/__tests__/features/pitch/usePitchDetector.test.ts
src/__tests__/shared/pianoGeometry.test.ts   ← includes fast-check PBT (PBT-02, PBT-03)
```

**Dependencies**: Unit 1 (`analyserNode` ref, `audioSlice.isListening`, `audioSlice.noiseGateThreshold`), `pitchy` npm package, `pianoGeometry.ts`

**Outputs for Unit 3**: `pitchSlice.detectedNote` (keyIndex, noteName) via Zustand

**NFR Focus**: <100ms detection latency, >95% accuracy, noise gate integration, PBT for pure geometry/mapping functions

**PBT Coverage (partial enforcement — PBT-02, PBT-03, PBT-07, PBT-08, PBT-09):**
- `frequencyToMidiNote` + MIDI-to-frequency round-trip (PBT-02)
- Invariant: output keyIndex always in [0, 87] for valid piano frequencies (PBT-03)
- Invariant: `getAllKeyGeometry` always returns exactly 88 keys, 52 white + 36 black (PBT-03)
- Domain generators for Hz values constrained to [27.5, 4186.0] (PBT-07)
- fast-check with seed logging enabled (PBT-08, PBT-09)

---

## Unit 3: Piano Keyboard & Visual Feedback

**Purpose**: Render the full 88-key SVG keyboard, display the Canvas sparkle/glow animation at the detected key, provide the neon theme system (Cyber/Aurora/Sunset) via CSS custom properties.

**Stories**: FEAT-03 (On-Screen Keyboard), FEAT-04 (Neon Visual Feedback), FEAT-05 (Colour Theme Selection), FEAT-10 (Teacher Demonstration)

**PRD Requirements**: KB-01, KB-02, KB-03, KB-04, KB-05, KB-06, VF-01, VF-02, VF-03, VF-04, VF-05, VF-06, VF-07

**Source files introduced:**
```
src/store/uiSlice.ts             (theme field; onboardingDismissed scaffolded here,
                                  completed in Unit 4)
src/features/keyboard/PianoKeyboard.tsx
src/features/keyboard/CanvasOverlay.tsx
src/features/keyboard/useSparkleAnimation.ts
src/features/ui/ThemeProvider.tsx
src/features/ui/ThemeSelector.tsx
```

**Test files:**
```
src/__tests__/features/keyboard/PianoKeyboard.test.tsx
src/__tests__/features/keyboard/CanvasOverlay.test.tsx
src/__tests__/features/keyboard/useSparkleAnimation.test.ts
src/__tests__/features/ui/ThemeProvider.test.tsx
src/__tests__/features/ui/ThemeSelector.test.tsx
```

**Dependencies**: Unit 2 (`pitchSlice.detectedNote`), `pianoGeometry.ts` (geometry functions), CSS custom properties (set by ThemeProvider), `uiSlice.theme`

**NFR Focus**: 60fps Canvas animation, SVG accessibility (aria-labels per key), WCAG 2.1 AA colour contrast for neon palettes, reduced-motion fallback, 360px horizontal scroll behaviour

---

## Unit 4: UI Shell & Features

**Purpose**: Compose all units into the final responsive application. Implement the dark-theme layout, note history panel, onboarding modal, error states, and Netlify deployment configuration. Finalise the Zustand store (appStore composition).

**Stories**: FEAT-01 (permission UI), FEAT-06 (Sensitivity Control), FEAT-07 (Note History — UI), FEAT-08 (Onboarding), FEAT-09 (Error & Fallback — UI), FEAT-05 (theme selector wiring)

**PRD Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, NFR-A-01, NFR-A-02, NFR-A-03, NFR-R-02

**Source files introduced:**
```
src/store/uiSlice.ts             (onboardingDismissed completed)
src/store/appStore.ts            (composes audioSlice + pitchSlice + uiSlice)
src/main.tsx
src/App.tsx
src/features/ui/AppLayout.tsx
src/features/ui/NoteHistoryPanel.tsx
src/features/ui/OnboardingModal.tsx
src/features/ui/ErrorBanner.tsx
netlify.toml
public/_redirects
```

**Test files:**
```
src/__tests__/features/ui/AppLayout.test.tsx
src/__tests__/features/ui/NoteHistoryPanel.test.tsx
src/__tests__/features/ui/OnboardingModal.test.tsx
src/__tests__/features/ui/ErrorBanner.test.tsx
src/__tests__/e2e/piano-practice.spec.ts
src/__tests__/e2e/mic-permission.spec.ts
src/__tests__/e2e/theme-selector.spec.ts
```

**Dependencies**: Units 1, 2, 3 (all components and stores), localStorage, Netlify

**NFR Focus**: Responsive layout 360px–2560px, WCAG 2.1 AA automated audit, onboarding localStorage persistence, SPA routing on Netlify
