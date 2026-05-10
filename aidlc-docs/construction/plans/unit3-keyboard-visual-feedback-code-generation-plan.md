# Unit 3: Keyboard & Visual Feedback — Code Generation Plan

## Unit Context

**Stories**: FEAT-03 (On-Screen Keyboard), FEAT-04 (Neon Visual Feedback), FEAT-05 (Colour Theme Selection), FEAT-10 (Teacher Demonstration)

**Dependencies on prior units**:
- `src/shared/pianoGeometry.ts` — `getKeyGeometry`, `getAllKeyGeometry`, `KeyRect`, `keyIndexToNoteName`, `keyIndexToOctave` (Unit 2)
- `src/store/appStore.ts` — `useAppStore`, `AppState` (Units 1 & 2; will be extended here)
- `src/store/pitchSlice.ts` — `DetectedNote`, `PitchState` (Unit 2)
- `src/types/audio.ts` — existing type declarations

**New directories required**:
- `src/features/keyboard/` — PianoKeyboard, CanvasOverlay, useSparkleAnimation
- `src/features/ui/` — ThemeProvider, ThemeSelector
- `src/__tests__/features/keyboard/`
- `src/__tests__/features/ui/`

**Key NFR patterns applied**:
- Self-terminating rAF loop (NFR-P1)
- Reduced-motion null animation — synchronous draw+clearRect (Q1=B, NFR-A1)
- Key geometry memoisation — `useMemo([totalWidth])` (Q4=B, NFR-P3)
- Zero-width keyboard guard — render container div only until width > 0 (Q2=B)
- Canvas DPR scaling — `Math.round(cssPixels × devicePixelRatio)` (NFR-P2)
- ResizeObserver cleanup on unmount (NFR-R2)

---

## Code Generation Steps

### Step 1: `src/store/uiSlice.ts` — UI Zustand slice
- [x] Define `NeonTheme = 'cyber' | 'aurora' | 'sunset'` type
- [x] Define `UiState` interface: `{ theme, onboardingDismissed, setTheme, setOnboardingDismissed }`
- [x] Implement `createUiSlice: StateCreator<UiState>` with `theme: 'cyber'` default, `onboardingDismissed: false` stub
- **Stories**: FEAT-05

### Step 2: `src/store/appStore.ts` — Extend AppState with UiState (MODIFY)
- [x] Import `UiState`, `createUiSlice` from `uiSlice.ts`
- [x] Extend `AppState = AudioState & PitchState & UiState`
- [x] Compose `createUiSlice` alongside existing slices
- **Stories**: FEAT-05

### Step 3: `src/features/ui/ThemeProvider.tsx` — CSS custom property injector
- [x] Define `ThemeDefinition` interface and `THEME_DEFINITIONS` constant (cyber/aurora/sunset canonical values per BR-24)
- [x] Implement `ThemeProvider` component: reads `uiSlice.theme`, `useEffect` applies all 4 CSS vars to `document.documentElement`
- [x] Renders `children` unchanged
- **Stories**: FEAT-05

### Step 4: `src/features/ui/ThemeSelector.tsx` — Theme picker UI
- [x] Implement 3-button group: Cyber / Aurora / Sunset
- [x] `aria-pressed={theme === t}`, `data-testid="theme-btn-{t}"`
- [x] Wrapper `role="group"` `aria-label="Colour theme"` `data-testid="theme-selector"`
- [x] Clicking any button calls `setTheme(t)`
- **Stories**: FEAT-05

### Step 5: `src/features/keyboard/PianoKeyboard.tsx` — SVG 88-key keyboard
- [x] `useMemo` for `allKeyRects = getAllKeyGeometry(totalWidth)` (NFR-P3)
- [x] Zero-width guard: render container `<div>` always; `<svg>` only when `totalWidth > 0` (Q2=B)
- [x] ResizeObserver updates `totalWidth` state immediately (Q2=A)
- [x] White keys rendered before black keys (BR-02 z-order)
- [x] Active key fill: `var(--neon-white-key)` / `var(--neon-black-key)`; others: `var(--key-white)` / `var(--key-black)`
- [x] Octave markers C1–C8 (BR-04): `<text>` below key when `(midiNote % 12 === 0) AND midiNote >= 24`
- [x] Note name overlay (Q1=A): SVG `<text>` at `(rect.x + rect.width/2, rect.y + rect.height - 8)` when `detectedNote` non-null; `aria-live="polite"` `aria-atomic="true"` `data-testid="active-key-label"`
- [x] `handleKeyClick`: builds synthetic `DetectedNote` (midiNote=keyIndex+21, clarity=1.0, frequency formula, `performance.now()`) → calls `setDetectedNote` (BR-25/26/27)
- [x] `handleKeyKeyDown`: Enter/Space triggers `handleKeyClick` (BR-06)
- [x] Scroll effect on `detectedNote` change: `containerRef.scrollTo({ left: Math.max(0, keyMidX - containerWidth/2), behavior: reduced ? 'instant' : 'smooth' })` (BR-29/30/31)
- [x] Each key: `role="button"`, `tabIndex={0}`, `aria-label={noteName+octave}`, `data-testid="key-{keyIndex}"` (BR-05/06)
- [x] ResizeObserver cleanup on unmount
- **Stories**: FEAT-03, FEAT-04, FEAT-10

### Step 6: `src/features/keyboard/CanvasOverlay.tsx` — Canvas host
- [x] Props: `{ activeKeyIndex: number | null; keyboardWidth: number }`
- [x] `canvasRef = useRef<HTMLCanvasElement | null>(null)`
- [x] ResizeObserver on `canvas.parentElement`: sets `canvas.width = Math.round(w * dpr)`, `canvas.height = Math.round(h * dpr)`, CSS width/height (NFR-P2)
- [x] Calls `useSparkleAnimation({ canvasRef, activeKeyIndex, keyboardWidth })`
- [x] Renders `<canvas>` with `position: absolute; top: 0; left: 0; pointer-events: none; aria-hidden="true"` and `data-testid="canvas-overlay"` (BR-19)
- [x] ResizeObserver cleanup on unmount
- **Stories**: FEAT-04

### Step 7: `src/features/keyboard/useSparkleAnimation.ts` — rAF animation hook
- [x] Define `SparkleParticle` interface (x, y, vx, vy, radius, opacity, colour)
- [x] Module constants: `PARTICLE_COUNT=12`, `GRAVITY=0.15`, `FADE_RATE=1/(0.8*60)`, `MIN_SPEED=1.5`, `MAX_SPEED=4.0`, `MIN_RADIUS=3`, `MAX_RADIUS=10`
- [x] Refs: `particlesRef`, `animationFrameRef`, `prevKeyIndexRef`
- [x] Spawn effect: change detection via `prevKeyIndexRef`; get `getKeyGeometry`; DPR-scale spawn coords; build 12 particles; **ReducedMotionGuard** (Q1=B): if `prefers-reduced-motion: reduce`, synchronous draw+clearRect, return without appending; else append + start rAF if idle
- [x] `animationLoop` (useCallback stabilised): clear → update physics (vy+=GRAVITY×dpr, x+=vx, y+=vy, opacity-=FADE_RATE) → draw outer glow + inner white core → filter dead → recurse or stop
- [x] Cleanup useEffect: `cancelAnimationFrame` + clear particle array
- **Stories**: FEAT-04

### Step 8: `src/__tests__/store/uiSlice.test.ts` — uiSlice tests
- [x] Default state: `theme === 'cyber'`, `onboardingDismissed === false`
- [x] `setTheme` transitions: all 3 themes
- [x] PBT (PBT-02/03): `fc.constantFrom('cyber','aurora','sunset')` — any sequence of setTheme calls ends with the last value set
- [x] `setOnboardingDismissed` stub: true/false toggle
- **Stories**: FEAT-05

### Step 9: `src/__tests__/features/ui/ThemeProvider.test.tsx` — ThemeProvider tests
- [x] Renders children without modification
- [x] On mount with default theme ('cyber'): `document.documentElement.style.getPropertyValue('--neon-white-key')` === '#00f3ff'
- [x] On `setTheme('aurora')`: CSS vars update to aurora canonical values (BR-24)
- [x] On `setTheme('sunset')`: CSS vars update to sunset canonical values
- [x] All 4 CSS vars (`--neon-white-key`, `--neon-black-key`, `--glow-colour`, `--neon-accent`) verified for each theme
- **Stories**: FEAT-05

### Step 10: `src/__tests__/features/ui/ThemeSelector.test.tsx` — ThemeSelector tests
- [x] Renders 3 buttons: `theme-btn-cyber`, `theme-btn-aurora`, `theme-btn-sunset`
- [x] Active button has `aria-pressed="true"`; inactive buttons have `aria-pressed="false"`
- [x] Clicking aurora button calls `setTheme('aurora')`
- [x] `role="group"` wrapper with `aria-label="Colour theme"` present
- **Stories**: FEAT-05

### Step 11: `src/__tests__/features/keyboard/PianoKeyboard.test.tsx` — PianoKeyboard tests
- [x] Zero-width guard: no `<svg>` before ResizeObserver fires; `<svg>` appears after mock resize
- [x] 52 white + 36 black key rects rendered after resize (data-testid `key-0` through `key-87`)
- [x] Active key fill: `var(--neon-white-key)` for white key when `detectedNote` set
- [x] Active key fill: `var(--neon-black-key)` for black key when `detectedNote` set
- [x] Note label appears (`data-testid="active-key-label"`) with correct text (`noteName + octave`) when note set; hidden when null
- [x] Teacher click: clicking `key-48` (A4) calls `setDetectedNote` with `{ midiNote: 69, keyIndex: 48, noteName: 'A', octave: 4, clarity: 1.0 }`
- [x] Keyboard Enter/Space on key triggers `setDetectedNote`
- [x] Scroll: `containerRef.scrollTo` called with computed `left` on note change
- [x] Reduced-motion scroll: `behavior: 'instant'` when `matchMedia` returns true
- **Stories**: FEAT-03, FEAT-04, FEAT-10

### Step 12: `src/__tests__/features/keyboard/CanvasOverlay.test.tsx` — CanvasOverlay tests
- [x] Canvas element renders with `data-testid="canvas-overlay"`
- [x] `aria-hidden="true"` and `pointer-events: none` present
- [x] ResizeObserver callback: `canvas.width` set to `Math.round(300 * devicePixelRatio)` on mock resize
- **Stories**: FEAT-04

### Step 13: `src/__tests__/features/keyboard/useSparkleAnimation.test.ts` — useSparkleAnimation tests
- [x] Mock `HTMLCanvasElement.prototype.getContext` to return spy 2D context
- [x] New `activeKeyIndex` → 12 particles spawned → rAF started → `ctx.arc` called 12 times per frame
- [x] Same `activeKeyIndex` repeated → no second spawn (change detection via `prevKeyIndexRef`)
- [x] Reduced-motion branch: `matchMedia('prefers-reduced-motion: reduce')` → `ctx.arc` called synchronously + `ctx.clearRect` called → rAF NOT started
- [x] Particle drain: after enough rAF ticks (opacity depletes), `cancelAnimationFrame` not called again (loop stops)
- [x] Cleanup: unmount → `cancelAnimationFrame` called with live handle
- **Stories**: FEAT-04

### Step 14: `aidlc-docs/construction/unit3-keyboard-visual-feedback/code/code-summary.md`
- [x] List all created/modified files with paths and purposes
- [x] Note key NFR patterns implemented
- [x] Note data-testid attributes for test automation

### Step 15: Build verification
- [x] Run `tsc --noEmit` — zero TypeScript errors
- [x] Run `npm run lint` — zero ESLint errors
- [x] Run `npm run build` — build succeeds
- [x] Run `npm test` — all tests pass (Unit 1 + Unit 2 + Unit 3)

---

## Story Coverage

| Story | Steps |
|---|---|
| FEAT-03: On-Screen Keyboard | 5, 11 |
| FEAT-04: Neon Visual Feedback | 5, 6, 7, 11, 12, 13 |
| FEAT-05: Colour Theme Selection | 1, 2, 3, 4, 8, 9, 10 |
| FEAT-10: Teacher Demonstration | 5, 11 |
