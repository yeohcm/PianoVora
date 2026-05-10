# Unit 3: Keyboard & Visual Feedback — Logical Components

---

## Component 1: AnimationLoopController

**Lives in**: `useSparkleAnimation` (internal behaviour, not a separate module)

**Responsibility**: Manages the entire rAF lifecycle — starting, ticking, and stopping the animation loop.

**State owned**:
- `animationFrameRef: React.MutableRefObject<number>` — rAF handle; `0` = idle
- `particlesRef: React.MutableRefObject<SparkleParticle[]>` — live particle array; mutated in-place

**Interfaces**:
- **Input**: `appendParticles(newParticles: SparkleParticle[])` — called by the spawn effect to add new particles and start the loop if not running
- **Output**: Canvas draw calls via `CanvasRenderingContext2D`

**Start logic**:
```
if animationFrameRef.current === 0:
  animationFrameRef.current = requestAnimationFrame(animationLoop)
```

**Tick logic** (per rAF frame):
```
clearRect(entire canvas)
for each particle:
  apply gravity + velocity
  decrement opacity
  draw if opacity > 0
filter dead particles
if particles.length > 0: schedule next frame
else: animationFrameRef.current = 0  (idle)
```

**Cleanup**: `cancelAnimationFrame` + `particlesRef.current = []` on unmount

**NFR link**: NFR-P1 (zero idle frames), NFR-R1 (cleanup on unmount)

---

## Component 2: ReducedMotionGuard

**Lives in**: `useSparkleAnimation` spawn effect (inline conditional — not a separate module)

**Responsibility**: Intercepts particle spawning when `prefers-reduced-motion: reduce` is active. Performs a synchronous draw + clearRect (invisible) and suppresses the rAF loop entirely.

**Trigger**: Evaluated once per spawn event, at the point where particles would be appended to `particlesRef`.

**Decision point** (Q1=B — synchronous draw + clearRect):
```
reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if reduced:
  draw newParticles synchronously on ctx
  ctx.clearRect(entire canvas)
  return               ← do NOT append to particlesRef
                       ← do NOT start rAF loop
```

**Contract**: When `reduced === true`, `particlesRef.current` is never modified. The AnimationLoopController is never started. The canvas remains visually blank.

**NFR link**: NFR-A1 (WCAG 2.3.3); Q1=B

---

## Component 3: KeyGeometryMemo

**Lives in**: `PianoKeyboard` (as a `useMemo` call — not a separate module)

**Responsibility**: Provides a stable, memoised array of 88 `KeyRect` objects. Recomputes only when `totalWidth` changes.

**Implementation**:
```typescript
const allKeyRects = useMemo(() => getAllKeyGeometry(totalWidth), [totalWidth]);
```

**Contract**:
- When `totalWidth === 0`: returns empty or zero-geometry rects (not rendered — suppressed by ZeroWidthGuard)
- When `totalWidth > 0`: returns 88 valid `KeyRect` objects with correct x, y, width, height, isBlack
- Fills (highlight colours) are derived inline per render from the memoised array — they are NOT memoised

**NFR link**: NFR-P3 (geometry memoisation); Q4=B

---

## Component 4: ZeroWidthGuard

**Lives in**: `PianoKeyboard` render function (inline conditional — not a separate module)

**Responsibility**: Prevents the SVG keyboard from rendering with zero/invalid geometry during the initial mount window before the ResizeObserver fires.

**Pattern** (Q2=B — render container, suppress SVG):
```typescript
<div ref={containerRef} style={{ overflowX: 'auto', position: 'relative' }}>
  {totalWidth > 0 && (
    <svg width={totalWidth} height={keyboardHeight} ...>
      {/* keys, markers, overlays */}
    </svg>
  )}
</div>
```

**Why container always renders**: `containerRef` must be set before the ResizeObserver can attach. Returning `null` would unmount the ref and prevent width observation.

**NFR link**: NFR-R3 (defensive guard); Q2=B

---

## Component 5: CanvasDPRManager

**Lives in**: `CanvasOverlay` ResizeObserver effect (inline — not a separate module)

**Responsibility**: Keeps canvas pixel dimensions aligned with the container's CSS dimensions, scaled by `window.devicePixelRatio`.

**Implementation**:
```typescript
const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  const dpr = window.devicePixelRatio;
  canvas.width  = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;
});
observer.observe(canvas.parentElement);
return () => observer.disconnect();
```

**Contract**:
- Canvas pixel dimensions are always `Math.round(cssPixels * dpr)`
- Canvas CSS dimensions always match the container's `contentRect`
- Observer disconnects on unmount

**NFR link**: NFR-P2 (DPR scaling), NFR-R2 (ResizeObserver cleanup)

---

## Component 6: ThemeCSSInjector

**Lives in**: `ThemeProvider` (single `useEffect` — not a separate module)

**Responsibility**: Applies four CSS custom properties to `document.documentElement` whenever the Zustand `theme` value changes.

**Properties applied**:
| Property | Applied from |
|---|---|
| `--neon-white-key` | `THEME_DEFINITIONS[theme]['--neon-white-key']` |
| `--neon-black-key` | `THEME_DEFINITIONS[theme]['--neon-black-key']` |
| `--glow-colour` | `THEME_DEFINITIONS[theme]['--glow-colour']` |
| `--neon-accent` | `THEME_DEFINITIONS[theme]['--neon-accent']` |

**Contract**:
- Effect runs synchronously after React commits the render
- CSS properties are available to all descendant elements (SVG fills, canvas `getComputedStyle`, ThemeSelector button accents) before the next browser paint
- No cleanup needed — setting CSS properties is idempotent

**NFR link**: NFR-M1 (THEME_DEFINITIONS co-located); TD-02 (CSS custom properties cascade)

---

## Component 7: ParticleSpawner

**Lives in**: `useSparkleAnimation` spawn `useEffect` (inline — not a separate module)

**Responsibility**: Constructs the 12 new `SparkleParticle` objects when a new `activeKeyIndex` is received, scaled by `window.devicePixelRatio`. Delegates to ReducedMotionGuard before appending.

**Inputs**:
- `activeKeyIndex` (prop) — triggers the effect when it changes
- `keyboardWidth` (prop) — used to compute spawn position via `getKeyGeometry`
- `canvasRef` — checked for null before spawning

**Spawn position** (DPR-scaled):
```typescript
const dpr    = window.devicePixelRatio;
const spawnX = (rect.x + rect.width  / 2)     * dpr;
const spawnY = (rect.y + rect.height * 0.3)   * dpr;
```

**Output**: Appends to `particlesRef.current` (via AnimationLoopController) unless ReducedMotionGuard intercepts.

**Change detection**: `prevKeyIndexRef` stores the last-seen `activeKeyIndex`; spawning is skipped if `activeKeyIndex === prevKeyIndexRef.current` (same key re-activated — no double-spawn).

**NFR link**: NFR-P2 (DPR scaling); NFR-M2 (hook has no JSX/Zustand)

---

## Interaction Summary

```
PianoKeyboard render
  └── ZeroWidthGuard (totalWidth > 0 conditional)
        └── KeyGeometryMemo (useMemo on totalWidth)
              └── SVG key rects (fill derived inline)

useSparkleAnimation spawn effect
  └── ParticleSpawner (builds 12 SparkleParticle[])
        └── ReducedMotionGuard (checks prefers-reduced-motion)
              ├── [reduced=true] → sync draw + clearRect → return
              └── [reduced=false] → append to particlesRef
                    └── AnimationLoopController (starts rAF if idle)

CanvasOverlay
  └── CanvasDPRManager (ResizeObserver → canvas.width/height)

ThemeProvider
  └── ThemeCSSInjector (useEffect → document.documentElement CSS vars)
```
