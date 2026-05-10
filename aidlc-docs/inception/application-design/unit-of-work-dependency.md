# PianoVora — Unit of Work Dependencies

**Version**: 1.0 | **Date**: 2026-05-09

---

## Dependency Matrix

| Unit | Depends On | Provides To |
|---|---|---|
| **Unit 1: Audio Engine** | Web Audio API (browser), Zustand `audioSlice` | `analyserNode` ref → Unit 2; `audioSlice` state → Unit 4 components |
| **Unit 2: Pitch Detection** | Unit 1 (`analyserNode` ref, `audioSlice`), `pitchy` lib, `pianoGeometry.ts` | `pitchSlice.detectedNote` → Unit 3; `pitchSlice.noteHistory` → Unit 4 |
| **Unit 3: Keyboard & Visual Feedback** | Unit 2 (`pitchSlice.detectedNote`), `pianoGeometry.ts`, CSS vars (ThemeProvider), `uiSlice.theme` | Rendered keyboard + animation → Unit 4 (composed into layout) |
| **Unit 4: UI Shell & Features** | Units 1, 2, 3 (all stores + components), localStorage | Final deployed application |

---

## Build & Test Order

```
Unit 1: Audio Engine
  |  (provides analyserNode ref and audioSlice)
  v
Unit 2: Pitch Detection
  |  (provides pitchSlice with detectedNote and noteHistory)
  v
Unit 3: Keyboard & Visual Feedback
  |  (provides SVG keyboard, Canvas animation, theme system)
  v
Unit 4: UI Shell & Features
  |  (composes everything, adds layout + feature components)
  v
Build and Test (integration + e2e)
```

**Strict sequential order** — no parallelisation within units, as each unit's output is an input to the next.

---

## Shared Artefacts

| Artefact | Location | Introduced In | Used By |
|---|---|---|---|
| `types.ts` | `src/shared/` | Unit 1 (scaffolded) | All units |
| `constants.ts` | `src/shared/` | Unit 1 | All units |
| `pianoGeometry.ts` | `src/shared/` | Unit 2 (all functions) | Units 2, 3 |
| `audioSlice.ts` | `src/store/` | Unit 1 | Units 1, 4 |
| `pitchSlice.ts` | `src/store/` | Unit 2 | Units 2, 3, 4 |
| `uiSlice.ts` | `src/store/` | Unit 3 (theme) + Unit 4 (completed) | Units 3, 4 |
| `appStore.ts` | `src/store/` | Unit 4 (composes all slices) | All units (via `useAppStore`) |

---

## Inter-Unit Integration Points

| Integration | Mechanism | Risk |
|---|---|---|
| Unit 1 → Unit 2 | `analyserNode` React ref passed as prop/parameter to `usePitchDetector` | Low — standard React ref pattern |
| Unit 2 → Unit 3 | `pitchSlice.detectedNote` read from Zustand store | Low — Zustand subscription |
| Unit 3 → Unit 3 internal | `pianoGeometry.ts` imported by both `PianoKeyboard` and `useSparkleAnimation` | None — pure module |
| All → Unit 4 | All stores composed in `appStore.ts`; all components imported into `AppLayout` | Low — standard composition |
| ThemeProvider → Canvas | CSS custom properties read at particle spawn time | Low — standard CSS API |

---

## Testing Strategy Per Unit

| Unit | Unit Tests | Component Tests | PBT | e2e |
|---|---|---|---|---|
| Unit 1 | `useAudioEngine` (mock getUserMedia, AudioContext) | `MicToggle`, `AudioLevelMeter`, `SensitivitySlider` (RTL) | N/A | `mic-permission.spec.ts` |
| Unit 2 | `usePitchDetector` (mock AnalyserNode), `pianoGeometry.ts` | N/A | `pianoGeometry.test.ts` (fast-check) | N/A |
| Unit 3 | `useSparkleAnimation` (mock Canvas API) | `PianoKeyboard`, `CanvasOverlay`, `ThemeProvider`, `ThemeSelector` (RTL) | N/A | `theme-selector.spec.ts` |
| Unit 4 | `OnboardingModal` (localStorage mock) | `AppLayout`, `NoteHistoryPanel`, `ErrorBanner` (RTL) | N/A | `piano-practice.spec.ts` |

**Coverage target**: >70% aggregate (Vitest + RTL). PBT counted towards Unit 2 coverage.

---

## Deployment Dependencies

| Dependency | Type | Required For |
|---|---|---|
| HTTPS | Infrastructure | getUserMedia (mandatory for all browsers) |
| Netlify | Hosting | Production deployment |
| `netlify.toml` | Config | SPA routing, security headers (X-Frame-Options, CSP) |
| `public/_redirects` | Config | Fallback routing for client-side navigation |
