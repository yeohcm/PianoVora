# Unit 3: Keyboard & Visual Feedback — Tech Stack Decisions

---

## Rendering Layer

### TD-01: SVG for Keyboard Structure, Canvas for Animation
- **Decision**: The 88-key keyboard is rendered as SVG `<rect>` elements; the sparkle animation runs on an absolutely-positioned `<canvas>` element layered above.
- **Rationale**: SVG provides natural accessibility (aria-label, role=button, tabIndex); DOM-based key rects receive click/keyboard events natively. Canvas provides efficient rAF animation without polluting the DOM with 12+ animated elements per note.
- **Interaction**: Canvas has `pointer-events: none` so clicks pass through to SVG keys below.
- **Source**: KB-06; BR-19.

### TD-02: CSS Custom Properties for Theme Application
- **Decision**: Theme colours are applied as CSS custom properties on `document.documentElement` by `ThemeProvider`.
- **Rationale**: CSS custom properties propagate through the cascade instantly without React re-renders; SVG fills reference `var(--neon-white-key)` etc. and update automatically when properties change; Canvas reads `getComputedStyle` at spawn time for particle colour.
- **Tradeoff**: Canvas particles capture colour at spawn time — particles spawned mid-theme-change use the old colour. Acceptable: theme changes are user-initiated and rare.
- **Source**: BR-23; Flow 4.

### TD-03: useMemo for allKeyRects Geometry
- **Decision**: `getAllKeyGeometry(totalWidth)` is wrapped in `useMemo([totalWidth])` inside `PianoKeyboard`.
- **Rationale**: Geometry is deterministic given totalWidth; O(88) recompute on every `detectedNote` change is avoidable with a one-line memo. (Q4=B)
- **Pattern**: `const allKeyRects = useMemo(() => getAllKeyGeometry(totalWidth), [totalWidth]);`

---

## Animation

### TD-04: requestAnimationFrame Loop (useCallback-stabilised)
- **Decision**: `animationLoop` in `useSparkleAnimation` is stabilised with `useCallback([canvasRef])` to prevent the loop from capturing stale closure state.
- **Rationale**: `particlesRef` and `animationFrameRef` are refs (not state), so they are always current inside the callback regardless of when it was created. Stabilising with `useCallback` prevents ESLint exhaustive-deps warnings.

### TD-05: prefers-reduced-motion — Flash Branch (Q1=B)
- **Decision**: When `prefers-reduced-motion: reduce` is detected at spawn time, particles are drawn once at full opacity using a single 2D context draw call, then the canvas is cleared immediately. No `requestAnimationFrame` loop is started.
- **Implementation**:
  ```typescript
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    // draw particles once, then clear
    const ctx = canvas.getContext('2d');
    // ... draw each particle ...
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return; // no rAF loop
  }
  ```
- **Source**: NFR-A1; Q1=B.

---

## State Management

### TD-06: uiSlice Added to appStore (Incremental Slice Pattern)
- **Decision**: `uiSlice.ts` follows the same `StateCreator<UiState>` pattern as `audioSlice.ts` and `pitchSlice.ts`. `AppState` is extended to `AudioState & PitchState & UiState`.
- **Rationale**: Consistent slice composition pattern; no change to existing slice code.
- **Source**: domain-entities.md Entity 3.

### TD-07: No localStorage in Unit 3
- **Decision**: Theme preference is held in Zustand memory only; no `localStorage` read/write in Unit 3.
- **Rationale**: Persistence is Unit 4's responsibility (BR-22). Unit 3 initialises `theme: 'cyber'` on every page load.
- **Source**: BR-22.

---

## Testing

### TD-08: Canvas Tests Use OffscreenCanvas or Mock Context
- **Decision**: Unit tests for `useSparkleAnimation` mock `HTMLCanvasElement.prototype.getContext` to return a jest/vitest spy object. Canvas draw assertions check that `ctx.arc`, `ctx.fill`, `ctx.clearRect` etc. were called with expected arguments.
- **Rationale**: jsdom does not implement a real Canvas 2D rendering context; spy-based approach is the standard Vitest/RTL pattern for Canvas.

### TD-09: ThemeProvider Tests Assert document.documentElement CSS Variables
- **Decision**: `ThemeProvider` tests render the component and assert `document.documentElement.style.getPropertyValue('--neon-white-key')` returns the expected hex value.
- **Pattern**:
  ```typescript
  render(<ThemeProvider><div /></ThemeProvider>);
  act(() => { useAppStore.getState().setTheme('aurora'); });
  expect(document.documentElement.style.getPropertyValue('--neon-white-key')).toBe('#39ff14');
  ```

### TD-10: ResizeObserver Mocked in Tests
- **Decision**: `ResizeObserver` is mocked globally in the Vitest setup file (already present from Unit 1/2 tests). Tests for `PianoKeyboard` and `CanvasOverlay` call the mock callback directly to simulate resize events.
- **Source**: Existing test infrastructure.
