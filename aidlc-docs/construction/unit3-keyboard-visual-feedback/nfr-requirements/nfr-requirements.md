# Unit 3: Keyboard & Visual Feedback — NFR Requirements

---

## Performance

### NFR-P1: rAF Loop — 60fps Target, Zero Idle Frames
- **Requirement**: The `useSparkleAnimation` rAF loop must target 60fps and must not schedule `requestAnimationFrame` when the particle array is empty.
- **Rule**: `animationFrameRef.current = 0` when `particles.length === 0`; no idle polling.
- **Source**: BR-18; Q3=B (browser throttling accepted; no visibility guard needed).
- **Rationale**: Avoids wasted GPU and CPU cycles between note events.

### NFR-P2: Canvas DevicePixelRatio Scaling
- **Requirement**: `canvas.width` and `canvas.height` must be set to `Math.round(dimension * window.devicePixelRatio)` to produce sharp rendering on HiDPI displays.
- **Rule**: All particle coordinates (x, y, vx, vy, radius, shadowBlur) in `useSparkleAnimation` are multiplied by `window.devicePixelRatio` at spawn time.
- **Source**: BR-19; VF-02.

### NFR-P3: SVG Key Geometry Memoisation (Q4=B)
- **Requirement**: `allKeyRects` (the array of 88 `KeyRect` objects from `getAllKeyGeometry`) must be memoised with `useMemo`, recomputing only when `totalWidth` changes.
- **Rule**: `const allKeyRects = useMemo(() => getAllKeyGeometry(totalWidth), [totalWidth]);`
- **Rationale**: Prevents O(88) geometry recompute on every `detectedNote` change; fill colours are derived inline from the memoised array each render.
- **Source**: Q4=B.

### NFR-P4: ResizeObserver — Immediate State Update (Q2=A)
- **Requirement**: `totalWidth` state is updated synchronously on every ResizeObserver callback; no debounce or rAF batching.
- **Rationale**: React 18 automatic batching already coalesces rapid state updates within event handlers and microtasks; geometry compute is O(88) and sub-millisecond; additional debounce adds complexity without measurable benefit.
- **Source**: Q2=A.

### NFR-P5: Tab Visibility — No Guard Needed (Q3=B)
- **Requirement**: No `visibilitychange` listener or rAF pause on tab hide.
- **Rationale**: Browser throttles rAF to ~1fps when tab is hidden; at 1fps, 800ms-lifetime particles drain in ~48 frames (~48 seconds), but particle count is at most 12 per burst and CPU cost at 1fps is negligible. Self-extinguishing lifecycle makes a guard unnecessary.
- **Source**: Q3=B.

---

## Accessibility

### NFR-A1: prefers-reduced-motion — Sparkle Animation (Q1=B)
- **Requirement**: When `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true at spawn time, `useSparkleAnimation` skips the rAF fade loop. Particles are drawn once at full opacity, then the canvas is cleared on the next frame (one `clearRect` call). No animated motion occurs.
- **Rule**: Check reduced motion inside the spawn effect, after building the particle array. If reduced motion: draw once then clear; do not call `requestAnimationFrame` for the loop.
- **Source**: Q1=B; WCAG 2.3.3 Animation from Interactions.
- **Note**: Scroll reduced-motion fallback is already handled by BR-29 (independent of this rule).

### NFR-A2: ARIA on SVG Keys — Note Name + Octave
- **Requirement**: Every key `<rect>` must have `aria-label` containing the full note name and octave (e.g. `"C4"`, `"F#3"`, `"A0"`).
- **Rule**: `aria-label={keyIndexToNoteName(rect.keyIndex)! + keyIndexToOctave(rect.keyIndex)!}`
- **Source**: BR-05; WCAG 2.1 AA.

### NFR-A3: Note Label aria-live Region
- **Requirement**: The SVG `<text>` note name overlay must carry `aria-live="polite"` and `aria-atomic="true"` so screen readers announce each new note without interrupting ongoing speech.
- **Source**: BR-09; VF-05.

### NFR-A4: Theme Buttons aria-pressed
- **Requirement**: Each theme button in `ThemeSelector` must have `aria-pressed={theme === t}` to communicate active state to screen readers.
- **Source**: BR-06; WCAG 4.1.2.

### NFR-A5: Scroll Reduced-Motion Fallback (Already Locked)
- **Requirement**: Scroll behaviour is `'smooth'` unless `prefers-reduced-motion: reduce` is set, in which case `'instant'` is used.
- **Source**: BR-29 (existing; no change from functional design).

---

## Reliability

### NFR-R1: rAF Cleanup on Unmount
- **Requirement**: `useSparkleAnimation` must cancel the rAF handle and clear the particle array in its cleanup `useEffect` return.
- **Rule**: `cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = 0; particlesRef.current = [];`
- **Source**: BR-18; standard React hook cleanup.

### NFR-R2: ResizeObserver Cleanup on Unmount
- **Requirement**: Both `PianoKeyboard` and `CanvasOverlay` must call `observer.disconnect()` in their ResizeObserver effect cleanup returns.
- **Source**: BR-03; BR-19.

### NFR-R3: Defensive getKeyGeometry Null Guard
- **Requirement**: Every call to `getKeyGeometry(keyIndex, totalWidth)` in `PianoKeyboard` and `useSparkleAnimation` must null-check the result before accessing properties. If null, skip the operation silently.
- **Source**: pianoGeometry.ts API (returns `null` for out-of-range inputs).

---

## Testing

### NFR-T1: PBT Rules Applied (Partial — PBT-02, PBT-03, PBT-07, PBT-08, PBT-09)
- **PBT-02/03**: Property-based tests for `uiSlice` state transitions (theme cycling).
- **PBT-07/08/09**: Boundary and round-trip tests do not apply to canvas animation (no pure numeric transforms to round-trip); apply to any new pure utility functions introduced.
- **Source**: Extension Configuration in aidlc-state.md.

### NFR-T2: Reduced-Motion Branch Must Be Tested
- **Requirement**: `useSparkleAnimation` tests must cover both `prefers-reduced-motion: false` (full animation) and `prefers-reduced-motion: true` (flash-then-clear) branches.
- **Rationale**: Accessibility regressions are silent failures; explicit test coverage required.

### NFR-T3: Theme CSS Variable Application Must Be Tested
- **Requirement**: `ThemeProvider` tests must verify that all four CSS custom properties are set on `document.documentElement` when the theme changes.
- **Rule**: Assert `document.documentElement.style.getPropertyValue('--neon-white-key')` etc. after triggering theme change.

---

## Maintainability

### NFR-M1: THEME_DEFINITIONS Co-located with ThemeProvider
- **Requirement**: The `THEME_DEFINITIONS` constant is defined in `ThemeProvider.tsx`, not in a separate file. It is the single source of truth for all theme colour values.
- **Rationale**: Keeps theme data adjacent to its only consumer (ThemeProvider effect) and its related type (NeonTheme).

### NFR-M2: useSparkleAnimation Is a Pure Hook (No JSX, No Zustand)
- **Requirement**: `useSparkleAnimation` must not render JSX, read from Zustand, or write to any external state. Its only output is canvas draw calls.
- **Rationale**: Separation of concerns; hook can be unit-tested without rendering a component tree.
