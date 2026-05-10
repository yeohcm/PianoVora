# Unit 1: Audio Engine — Code Summary

## Files Created

### Project Setup (Greenfield)
| File | Description |
|---|---|
| `package.json` | Single-package project; React 18, Zustand, pitchy, Vite, Vitest, Tailwind, Playwright, fast-check |
| `tsconfig.json` | Strict TypeScript; `@` path alias → `src/`; ESNext modules |
| `tsconfig.node.json` | Build-tool composite config covering vite/vitest configs |
| `vite.config.ts` | Vite 5 with React plugin; `@` alias |
| `vitest.config.ts` | jsdom environment; globals; setup file; e2e excluded |
| `tailwind.config.js` | Content scanning `src/**`; no custom theme yet (Unit 3) |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `index.html` | SPA entry; references `src/main.tsx` |
| `src/index.css` | Tailwind directives + Cyber theme CSS custom properties (default) |
| `src/__tests__/setup.ts` | `@testing-library/jest-dom` import |

### Stubs (completed in Unit 4)
| File | Status |
|---|---|
| `src/main.tsx` | Unit 1 stub — renders `<App />`; Unit 4 adds error boundary, StrictMode config |
| `src/App.tsx` | Unit 1 stub — composes audio components; Unit 4 replaces with full `AppLayout` |
| `src/store/appStore.ts` | Unit 1 stub — only `audioSlice`; Units 2–4 extend with pitch/ui slices |

### Scaffolded (extended in Unit 2)
| File | Unit 1 content | Unit 2 additions |
|---|---|---|
| `src/shared/types.ts` | `PermissionState`, `AudioEngineResult`, `AudioState`, stubs for `DetectedNote`, `KeyRect`, `NeonTheme` | `DetectedNote` completed, `KeyRect` completed |
| `src/shared/constants.ts` | All audio + noise gate + reconnect constants; stubs `A4_FREQUENCY`, `MIDI_A4`, `PIANO_KEY_COUNT` | Pitch/geometry constants added |

### Application Code (complete)
| File | Description |
|---|---|
| `src/store/audioSlice.ts` | Zustand slice factory; `isListening`, `permissionState`, `audioLevel`, `noiseGateThreshold` + setters |
| `src/features/audio/useAudioEngine.ts` | Main hook: permission coordinator, AudioContext lifecycle manager (suspend-not-close), RMS processor (pre-allocated Float32Array, EMA α=0.3, noise gate, peak hold), reconnect coordinator (immediate-sequential, circuit breaker at 3) |
| `src/features/audio/MicToggle.tsx` | 5-state button (idle/requesting/active/stopped/error); derived from Zustand; ARIA; `data-testid="mic-toggle"` |
| `src/features/audio/AudioLevelMeter.tsx` | Normalised bar + peak hold (500ms decay); `role="meter"`; `data-testid="audio-level-meter"` |
| `src/features/audio/SensitivitySlider.tsx` | Inverted range mapping; real-time `noiseGateThreshold` write; ARIA `aria-valuetext`; `data-testid="sensitivity-slider"` |

### Tests
| File | Coverage |
|---|---|
| `src/__tests__/features/audio/useAudioEngine.test.ts` | start/stop lifecycle, permission errors, rAF RMS loop, reconnect paths, circuit breaker, cleanup |
| `src/__tests__/features/audio/MicToggle.test.tsx` | All 5 states, click handlers, ARIA labels, keyboard activation |
| `src/__tests__/features/audio/AudioLevelMeter.test.tsx` | Bar width, ARIA meter attributes, inactive state |
| `src/__tests__/features/audio/SensitivitySlider.test.tsx` | Inverted mapping, aria-valuetext labels, label association |

## Output Contract for Unit 2

`useAudioEngine` returns `{ start, stop, analyserRef }`. Unit 2's `usePitchDetector` receives `analyserRef` as a parameter and calls `analyserRef.current.getFloatTimeDomainData(buffer)` independently — no data copying between units.

## Key Implementation Decisions Made During Generation

- `getNoiseGateThreshold` uses `useRef(() => useAppStore.getState().noiseGateThreshold)` to read the current threshold inside the rAF loop without subscribing to store updates (avoids re-registering the loop on every slider change)
- `analyser.connect(ctx.destination)` is included even though no audio is played — required for Safari to activate the audio processing graph
- `connectStream` is extracted as a `useCallback` to avoid re-registering event listeners on every render while still being callable from both `start()` and `attemptReconnect()`
- Peak hold is tracked at two levels: hook-level refs (for EMA/noise gate) and component-level `useState` in `AudioLevelMeter` (for visual display) — the hook level is the source of truth for smoothed amplitude
