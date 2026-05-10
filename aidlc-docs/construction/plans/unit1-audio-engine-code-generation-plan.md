# Unit 1: Audio Engine — Code Generation Plan

## Unit Context

- **Stories implemented**: FEAT-01 (Audio Capture & Permissions), FEAT-09 (Error & Fallback — audio layer)
- **PRD requirements**: AC-01, AC-02, AC-03, AC-04, AC-05, UI-02, UI-03, UI-04, NFR-S-01, NFR-S-02, NFR-R-01
- **Dependencies**: Web Audio API (browser native), Zustand `audioSlice`
- **Output for Unit 2**: `analyserRef` (React ref to AnalyserNode) passed as parameter to `usePitchDetector`
- **Key design decisions**: getUserMedia constraints (disable all browser processing), immediate-sequential reconnect, inline reconnect coordinator, browser-native rAF tab throttling, suspend-not-close AudioContext lifecycle

## Files to Generate

**Application code** (workspace root: `D:\Projects\PianoVora`):
```
package.json
tsconfig.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
tailwind.config.js
postcss.config.js
index.html
src/__tests__/setup.ts
src/main.tsx                          (Unit 1 stub — completed in Unit 4)
src/App.tsx                           (Unit 1 stub — completed in Unit 4)
src/index.css
src/shared/types.ts                   (scaffolded — completed in Unit 2)
src/shared/constants.ts
src/store/audioSlice.ts
src/store/appStore.ts                 (Unit 1 stub — completed in Unit 4)
src/features/audio/useAudioEngine.ts
src/features/audio/MicToggle.tsx
src/features/audio/AudioLevelMeter.tsx
src/features/audio/SensitivitySlider.tsx
src/__tests__/features/audio/useAudioEngine.test.ts
src/__tests__/features/audio/MicToggle.test.tsx
src/__tests__/features/audio/AudioLevelMeter.test.tsx
src/__tests__/features/audio/SensitivitySlider.test.tsx
```

**Documentation** (aidlc-docs only):
```
aidlc-docs/construction/unit1-audio-engine/code/code-summary.md
```

---

## Generation Steps

### Step 1: Project Setup (Greenfield)
- [x] Create `package.json` with all project dependencies:
  - **dependencies**: `react ^18.3.1`, `react-dom ^18.3.1`, `zustand ^4.5.4`, `pitchy ^4.0.7`
  - **devDependencies**: `typescript ^5.4.5`, `vite ^5.2.11`, `@vitejs/plugin-react ^4.3.0`, `vitest ^1.6.0`, `jsdom ^24.1.0`, `@testing-library/react ^16.0.0`, `@testing-library/user-event ^14.5.2`, `@testing-library/jest-dom ^6.4.5`, `fast-check ^3.19.0`, `@playwright/test ^1.44.0`, `tailwindcss ^3.4.3`, `autoprefixer ^10.4.19`, `postcss ^8.4.38`, `@types/react ^18.3.1`, `@types/react-dom ^18.3.0`
  - **scripts**: `dev`, `build` (tsc + vite build), `preview`, `test` (vitest), `test:run` (vitest run), `test:e2e` (playwright test), `lint` (tsc --noEmit)
- [x] Create `tsconfig.json`:
  - Strict mode enabled; `target: ES2020`; `lib: [ES2020, DOM, DOM.Iterable]`; `jsx: react-jsx`; `moduleResolution: bundler`; `noEmit: true`
  - Path alias: `@/*` → `src/*`
- [x] Create `tsconfig.node.json`:
  - `composite: true`; includes `vite.config.ts` and `vitest.config.ts`
- [x] Create `vite.config.ts`:
  - `@vitejs/plugin-react`; path alias `@` → `src/`
- [x] Create `vitest.config.ts`:
  - `globals: true`; `environment: jsdom`; `setupFiles: ['./src/__tests__/setup.ts']`; exclude `src/__tests__/e2e/**`; path alias `@` → `src/`
- [x] Create `tailwind.config.js`:
  - content: `['./index.html', './src/**/*.{js,ts,jsx,tsx}']`
- [x] Create `postcss.config.js`:
  - plugins: `tailwindcss`, `autoprefixer`
- [x] Create `index.html`:
  - Viewport meta, `lang="en"`, description meta, title "PianoVora", `<div id="root">`, script module src `/src/main.tsx`
- [x] Create `src/index.css`:
  - `@tailwind base; @tailwind components; @tailwind utilities;`
  - CSS custom property placeholders for neon themes (values set by ThemeProvider in Unit 3):
    `--neon-white-key`, `--neon-black-key`, `--neon-accent`, `--neon-glow`, `--bg-primary`, `--bg-surface`
  - Default values (Cyber theme): dark background (#0a0a0f), white key neon (#e0e0ff), accent cyan (#00ffff)
- [x] Create `src/__tests__/setup.ts`:
  - `import '@testing-library/jest-dom';`
- [x] Create Unit 1 stub `src/main.tsx`:
  - Renders `<App />` into `#root` with `React.StrictMode`; imports `./index.css`
  - Comment: stub completed in Unit 4
- [x] Create Unit 1 stub `src/App.tsx`:
  - Returns minimal JSX placeholder (renders MicToggle, AudioLevelMeter, SensitivitySlider for Unit 1 dev visibility)
  - Comment: stub — replaced by Unit 4's full AppLayout composition
- [x] Create directory structure (empty placeholder directories):
  - `src/features/audio/`, `src/features/pitch/`, `src/features/keyboard/`, `src/features/ui/`
  - `src/shared/`, `src/store/`
  - `src/__tests__/features/audio/`, `src/__tests__/features/pitch/`, `src/__tests__/features/keyboard/`, `src/__tests__/features/ui/`
  - `src/__tests__/shared/`, `src/__tests__/e2e/`

**Stories covered**: FEAT-01 (project infrastructure), FEAT-09 (error infrastructure)

---

### Step 2: Shared Types — `src/shared/types.ts`
- [x] Define `PermissionState` type: `'prompt' | 'granted' | 'denied' | 'error'`
- [x] Define `AudioEngineResult` interface: `{ start: () => Promise<void>; stop: () => void; analyserRef: React.MutableRefObject<AnalyserNode | null> }`
- [x] Define `AudioState` interface (matches audioSlice shape): `{ isListening, permissionState, audioLevel, noiseGateThreshold }` + setter types
- [x] Scaffold `DetectedNote` interface (stub for Unit 2): `{ midiNote: number; keyIndex: number; noteName: string; octave: number; frequency: number; clarity: number; timestamp: number }`
- [x] Scaffold `KeyRect` interface (stub for Unit 2): `{ x: number; y: number; width: number; height: number; isBlack: boolean; keyIndex: number }`
- [x] Scaffold `NeonTheme` type (stub for Unit 3): `'cyber' | 'aurora' | 'sunset'`

**Stories covered**: FEAT-01, FEAT-02 (stub), FEAT-05 (stub)

---

### Step 3: Shared Constants — `src/shared/constants.ts`
- [x] `FFT_SIZE = 2048` — AnalyserNode fftSize
- [x] `MIN_SAMPLE_RATE = 44100` — minimum required by pitchy
- [x] `DEFAULT_NOISE_GATE = 0.02` — default threshold (~-34 dBFS; BR-05)
- [x] `MIN_NOISE_GATE = 0.001` — minimum threshold (BR-05)
- [x] `MAX_NOISE_GATE = 0.1` — maximum threshold (BR-05)
- [x] `EMA_ALPHA = 0.3` — EMA smoothing coefficient for audioLevel (BR-08)
- [x] `PEAK_HOLD_MS = 500` — peak hold window in milliseconds
- [x] `PEAK_DECAY_RATE = 0.02` — per-frame peak decay after hold window
- [x] `MAX_RECONNECT_ATTEMPTS = 3` — circuit breaker threshold (NFR-R-03)
- [x] `RECONNECT_STABILISE_MS = 200` — hardware disconnect stabilisation delay (NFR-R-02)
- [x] `A4_FREQUENCY = 440.0` — reference frequency (stub for Unit 2)
- [x] `MIDI_A4 = 69` — MIDI note number of A4 (stub for Unit 2)
- [x] `PIANO_KEY_COUNT = 88` — total piano keys (stub for Unit 2)

**Stories covered**: FEAT-01, FEAT-02 (stub)

---

### Step 4: Zustand audioSlice + stub appStore
- [x] Create `src/store/audioSlice.ts`:
  - Export `AudioSlice` interface (state + actions)
  - Export `createAudioSlice` function compatible with Zustand slice pattern:
    ```typescript
    export type AudioSlice = { isListening: boolean; permissionState: PermissionState; audioLevel: number; noiseGateThreshold: number; setIsListening: (v: boolean) => void; setPermissionState: (v: PermissionState) => void; setAudioLevel: (v: number) => void; setNoiseGateThreshold: (v: number) => void; }
    export const createAudioSlice: StateCreator<AudioSlice> = (set) => ({ ... })
    ```
  - Initial values: `isListening: false`, `permissionState: 'prompt'`, `audioLevel: 0`, `noiseGateThreshold: DEFAULT_NOISE_GATE`
- [x] Create stub `src/store/appStore.ts`:
  - Composes only `createAudioSlice` for now; comment notes it is extended in Units 2, 3, 4
  - Exports `useAppStore` hook (default Zustand `create`)
  - Comment: `// Extended in Unit 2 (pitchSlice), Unit 3 (uiSlice), Unit 4 (final composition)`

**Stories covered**: FEAT-01 (audio state)

---

### Step 5: useAudioEngine Hook — `src/features/audio/useAudioEngine.ts`
- [x] Implement all refs: `audioContextRef`, `analyserRef`, `streamRef`, `bufferRef` (pre-allocated `Float32Array(FFT_SIZE)`), `animationFrameRef`, `userIntentStoppedRef`, `reconnectAttemptsRef`, `prevSmoothedRef`, `peakLevelRef`, `lastPeakTimeRef`
- [x] Implement `requestMicrophoneAccess()`: getUserMedia with constraints `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false, video: false }` — maps `NotAllowedError` → `'denied'`, other errors → `'error'`
- [x] Implement `setupAudioGraph(stream)`: creates `AudioContext({ latencyHint: 'interactive' })`, creates and configures `AnalyserNode` (`fftSize: FFT_SIZE`, `smoothingTimeConstant: 0`), connects source → analyser → destination, validates `sampleRate >= MIN_SAMPLE_RATE`
- [x] Implement RMS processor loop (inline): `getFloatTimeDomainData` → `computeRMS` → EMA (α=0.3) → noise gate → peak hold → `setAudioLevel` → schedule next frame
- [x] Implement `computeRMS(buffer: Float32Array): number`: √(mean(x²)) over full buffer
- [x] Implement reconnect coordinator (inline): `onstatechange` handler (immediate `resume()`), `onended` handler (200ms delay then `getUserMedia` retry), `attemptReconnect()` with immediate-sequential retry and circuit breaker at `MAX_RECONNECT_ATTEMPTS`
- [x] Implement `start()`: sets `userIntentStoppedRef = false`, calls permission coordinator, sets up audio graph, starts rAF loop, writes `permissionState: 'granted'` and `isListening: true` to store
- [x] Implement `stop()`: sets `userIntentStoppedRef = true`, cancels rAF, calls `audioContext.suspend()`, writes `isListening: false` to store
- [x] Implement `useEffect` cleanup: cancels rAF, nulls event handlers, calls `audioContext.close()`, writes `isListening: false`
- [x] Export `useAudioEngine(): AudioEngineResult` with `{ start, stop, analyserRef }`
- [x] Add `data-testid` is not applicable to a hook — skip
- [x] Add JSDoc-free implementation (no comments except one-line WHY notes per CLAUDE.md rules)

**Stories covered**: FEAT-01 (AC-01, AC-02, AC-03, AC-04, AC-05, NFR-R-01, NFR-S-01)

---

### Step 6: MicToggle Component — `src/features/audio/MicToggle.tsx`
- [x] Props: `interface MicToggleProps { onStart: () => Promise<void>; onStop: () => void; }`
- [x] Reads from `useAppStore`: `isListening`, `permissionState`
- [x] Local state: `isRequesting: boolean` (transient requesting state — not in Zustand)
- [x] Render 5 states derived from `permissionState` + `isListening` + `isRequesting`:
  - **idle** (`permissionState='prompt'`, not requesting): label "Allow Microphone", icon mic-off, enabled
  - **requesting** (isRequesting=true): label "Connecting…", icon spinner (CSS animation), disabled
  - **active** (`isListening=true`): label "Stop", icon mic-on, enabled, pulse animation class
  - **stopped** (`permissionState='granted'`, `isListening=false`): label "Start", icon mic-off, enabled
  - **error** (`permissionState='denied'|'error'`): label "Mic Unavailable", icon mic-blocked, disabled
- [x] ARIA: `aria-label` per state, `aria-pressed={isListening}`, focusable button
- [x] `data-testid="mic-toggle"` on the button
- [x] Use SVG inline icons (or Unicode fallback): mic-on (🎤), mic-off (🎙), spinner (CSS border-radius animation), mic-blocked (🚫) — or simple text symbols; full SVG icons are Unit 4 polish
- [x] Tailwind classes for dark theme styling; colour via CSS custom properties for theme compatibility

**Stories covered**: FEAT-01 (UI-02, AC-01), FEAT-09 (error state)

---

### Step 7: AudioLevelMeter Component — `src/features/audio/AudioLevelMeter.tsx`
- [x] Props: `interface AudioLevelMeterProps { orientation?: 'horizontal' | 'vertical'; height?: number; }`
- [x] Reads from `useAppStore`: `audioLevel`, `isListening`
- [x] Local state: `peakDisplay: number` (tracked in useState for visual peak indicator — separate from hook-level peak hold)
- [x] Bar fill: `width = audioLevel * 100%` (horizontal); CSS transition `50ms ease-out`
- [x] Peak indicator: positioned at `peakDisplay * 100%`; CSS transition `150ms ease-in-out`
- [x] Peak hold logic (component-level display only): update `peakDisplay` on `audioLevel > peakDisplay`; decay via `useEffect` + `requestAnimationFrame` after 500ms
- [x] Colours: `isListening=true` → `var(--neon-white-key)`; `isListening=false` → `#555`
- [x] Inactive state: bar width 0%, peak hidden, no animation when `isListening=false`
- [x] ARIA: `role="meter"`, `aria-valuenow={Math.round(audioLevel * 100)}`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Microphone level"`, `aria-live="off"`
- [x] `data-testid="audio-level-meter"` on the container, `data-testid="audio-level-bar"` on the fill bar, `data-testid="audio-level-peak"` on the peak indicator

**Stories covered**: FEAT-01 (UI-03)

---

### Step 8: SensitivitySlider Component — `src/features/audio/SensitivitySlider.tsx`
- [x] No external props — reads/writes `noiseGateThreshold` from `useAppStore`
- [x] Inverted mapping (right = more sensitive = lower threshold):
  - Display: `sliderValue = 1 - ((noiseGateThreshold - MIN_NOISE_GATE) / (MAX_NOISE_GATE - MIN_NOISE_GATE))` (0–1 range)
  - On change: `threshold = MIN_NOISE_GATE + (1 - sliderValue) * (MAX_NOISE_GATE - MIN_NOISE_GATE)`, clamped to [MIN_NOISE_GATE, MAX_NOISE_GATE]
- [x] Labels: left "Less Sensitive", right "More Sensitive" (no numeric values shown)
- [x] ARIA: explicit `<label>` with `htmlFor`, `aria-label="Microphone sensitivity"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow={Math.round(sliderValue * 100)}`, `aria-valuetext` = "Low sensitivity" / "Medium sensitivity" / "High sensitivity" (by thirds)
- [x] `data-testid="sensitivity-slider"` on the `<input type="range">`
- [x] No debounce — real-time write to store per PRD UI-04 requirement

**Stories covered**: FEAT-01 (UI-04), FEAT-06 (sensitivity control)

---

### Step 9: Tests — useAudioEngine — `src/__tests__/features/audio/useAudioEngine.test.ts`
- [x] Mock `navigator.mediaDevices.getUserMedia` using `vi.fn()`
- [x] Mock `AudioContext`, `AnalyserNode`, `MediaStreamSourceNode` using `vi.stubGlobal` or manual mock objects
- [x] Mock `requestAnimationFrame` / `cancelAnimationFrame` using `vi.stubGlobal`
- [x] Test: `start()` — granted path — sets `isListening: true`, `permissionState: 'granted'` in store
- [x] Test: `start()` — denied path — sets `permissionState: 'denied'`, `isListening` stays false
- [x] Test: `start()` — device error path — sets `permissionState: 'error'`
- [x] Test: `stop()` — sets `isListening: false`, calls `audioContext.suspend()`
- [x] Test: `start()` after `stop()` — resumes without re-requesting getUserMedia (`audioContext.resume()` called)
- [x] Test: RMS computation — `computeRMS` returns correct value for known Float32Array
- [x] Test: noise gate — `audioLevel` stays 0 when RMS below threshold
- [x] Test: reconnect — `onstatechange` suspended → calls `audioContext.resume()`
- [x] Test: circuit breaker — after 3 failed reconnects, `permissionState` → `'error'`
- [x] Test: `userIntentStopped` guard — no reconnect attempted after manual stop
- [x] Test: cleanup on unmount — `audioContext.close()` called, rAF cancelled
- [x] Use `renderHook` from `@testing-library/react`; wrap store writes with `act()`

**Stories covered**: FEAT-01, FEAT-09 (audio layer tests)

---

### Step 10: Tests — MicToggle — `src/__tests__/features/audio/MicToggle.test.tsx`
- [x] Setup: render with mock store state via Zustand store pre-population
- [x] Test: idle state — renders "Allow Microphone" button, enabled
- [x] Test: click idle — calls `onStart`, shows "Connecting…" while in-flight
- [x] Test: active state — renders "Stop" button, `aria-pressed="true"`
- [x] Test: click active — calls `onStop`
- [x] Test: stopped state — renders "Start" button
- [x] Test: error state (`permissionState='denied'`) — renders "Mic Unavailable", button disabled
- [x] Test: aria-label changes per state
- [x] Test: keyboard activation — Enter key triggers the button action
- [x] Use `userEvent` from `@testing-library/user-event` for interactions

**Stories covered**: FEAT-01 (UI-02), FEAT-09 (error UI)

---

### Step 11: Tests — AudioLevelMeter — `src/__tests__/features/audio/AudioLevelMeter.test.tsx`
- [x] Test: `isListening=false` — bar width is 0%, peak indicator hidden
- [x] Test: `audioLevel=0.5`, `isListening=true` — bar width reflects 50%
- [x] Test: `audioLevel=1.0` — bar at 100%
- [x] Test: ARIA attributes — `aria-valuenow` matches `Math.round(audioLevel * 100)`
- [x] Test: `aria-label="Microphone level"` present
- [x] Test: orientation prop — horizontal (default) renders correctly
- [x] Use `@testing-library/react` render; query by `data-testid`

**Stories covered**: FEAT-01 (UI-03)

---

### Step 12: Tests — SensitivitySlider — `src/__tests__/features/audio/SensitivitySlider.test.tsx`
- [x] Test: slider renders with initial store value (DEFAULT_NOISE_GATE = 0.02)
- [x] Test: slider inverted mapping — high threshold (0.1) maps to slider left (low position)
- [x] Test: change event — moving slider to max right calls `setNoiseGateThreshold` with MIN_NOISE_GATE
- [x] Test: change event — moving slider to max left calls `setNoiseGateThreshold` with MAX_NOISE_GATE
- [x] Test: `aria-valuetext` — low end = "Low sensitivity", high end = "High sensitivity"
- [x] Test: `aria-label="Microphone sensitivity"` present
- [x] Test: explicit label association (`<label>` htmlFor matches input id)

**Stories covered**: FEAT-01 (UI-04), FEAT-06

---

### Step 13: Code Summary Documentation — `aidlc-docs/construction/unit1-audio-engine/code/code-summary.md`
- [x] List all files created with brief description
- [x] Note stub files and which unit completes them
- [x] Note output contract for Unit 2 (`analyserRef`)
- [x] Note any implementation decisions made during code generation

**Stories covered**: All Unit 1 stories (documentation)

---

## Story Traceability

| Story | Steps | PRD Requirements |
|---|---|---|
| FEAT-01 (Audio Capture & Permissions) | 1–12 | AC-01, AC-02, AC-03, AC-04, AC-05, UI-02, UI-03, UI-04, NFR-S-01, NFR-S-02, NFR-R-01 |
| FEAT-06 (Sensitivity Control) | 8, 12 | UI-04 |
| FEAT-09 (Error & Fallback — audio layer) | 6, 9, 10 | — |

---

## Dependencies and Constraints

- All code in workspace root `D:\Projects\PianoVora\` (never in aidlc-docs/)
- TypeScript strict mode enforced throughout
- No hardcoded threshold values — all use constants from `src/shared/constants.ts`
- All interactive elements have `data-testid` attributes
- No external audio data transmission (NFR-S-01) — all processing browser-local
- `appStore.ts` is a Unit 1 stub — extended in Units 2, 3, 4
- `src/main.tsx` and `src/App.tsx` are Unit 1 stubs — replaced in Unit 4
