# Unit 3: Keyboard & Visual Feedback — NFR Design Patterns

---

## Pattern 1: Self-Terminating rAF Animation Loop

**Applies to**: `useSparkleAnimation`

**Problem**: Canvas animation must run at 60fps while particles exist, but must not consume CPU or GPU when idle.

**Pattern**: The loop is demand-started (on particle spawn) and self-terminates (when the array drains to zero). No external scheduler or timer is involved.

```
State machine:
  IDLE  ─── spawn triggered ──→  RUNNING
  RUNNING ─── particles > 0 ──→  RUNNING (next rAF)
  RUNNING ─── particles == 0 ──→ IDLE (animationFrameRef = 0)
  RUNNING ─── unmount ─────────→ CANCELLED (cancelAnimationFrame)
```

**Start condition**:
```typescript
if (!animationFrameRef.current) {
  animationFrameRef.current = requestAnimationFrame(animationLoop);
}
```

**Loop body** (each frame):
1. `ctx.clearRect(0, 0, canvas.width, canvas.height)` — clear previous frame
2. For each particle: update physics (vy += GRAVITY, x += vx, y += vy, opacity -= FADE_RATE)
3. Draw outer glow circle + inner white core
4. Filter dead particles (`opacity <= 0`)
5. If `particles.length > 0`: `animationFrameRef.current = requestAnimationFrame(animationLoop)`
6. Else: `animationFrameRef.current = 0` — loop stops

**Cleanup** (unmount):
```typescript
cancelAnimationFrame(animationFrameRef.current);
animationFrameRef.current = 0;
particlesRef.current = [];
```

---

## Pattern 2: Reduced-Motion Null Animation (Q1=B)

**Applies to**: `useSparkleAnimation` spawn effect

**Problem**: `prefers-reduced-motion: reduce` requires no animated motion on the canvas, but the spawn event should still be acknowledged without a visual animation.

**Pattern**: Synchronous draw + immediate clearRect in the same synchronous execution context. No browser paint occurs between the draw and clear calls, so the canvas stays visually blank. No `requestAnimationFrame` is started.

**Decision**: Q1=B — synchronous draw + clearRect; no visible flash; canvas remains blank.

**Implementation**:
```typescript
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Draw particles at full opacity (synchronously)
    newParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur  = 12 * dpr;
      ctx.shadowColor = p.colour;
      ctx.fillStyle   = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Immediately erase — no paint between draw and clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  return; // Do NOT append to particlesRef; do NOT start rAF loop
}
```

**Key constraint**: `newParticles` must NOT be appended to `particlesRef.current` in the reduced-motion branch. The rAF loop must NOT be started. The canvas returns to its blank state immediately.

---

## Pattern 3: Key Geometry Memoisation (Q4=B)

**Applies to**: `PianoKeyboard`

**Problem**: `getAllKeyGeometry(totalWidth)` is O(88) and involves per-key geometry arithmetic. Re-running it on every `detectedNote` change is wasteful since geometry is purely a function of `totalWidth`.

**Pattern**: `useMemo` with `[totalWidth]` as the only dependency. Geometry recomputes only when the container width changes (ResizeObserver callback), not on note changes.

```typescript
const allKeyRects = useMemo(() => getAllKeyGeometry(totalWidth), [totalWidth]);
```

**Fill derivation** (per render, not memoised — depends on `detectedNote`):
```typescript
// Derived inline in render, not memoised:
const activeFill = (rect: KeyRect) =>
  rect.keyIndex === detectedNote?.keyIndex
    ? (rect.isBlack ? 'var(--neon-black-key)' : 'var(--neon-white-key)')
    : (rect.isBlack ? 'var(--key-black)' : 'var(--key-white)');
```

**When `totalWidth === 0`**: `getAllKeyGeometry(0)` returns rects with zero/invalid geometry. These are not rendered because the zero-width guard (Pattern 4) suppresses the SVG element until `totalWidth > 0`.

---

## Pattern 4: Zero-Width Keyboard Guard (Q2=B)

**Applies to**: `PianoKeyboard`

**Problem**: On initial mount, `totalWidth === 0` before the ResizeObserver fires. `getAllKeyGeometry(0)` returns invalid geometry. Rendering an SVG with `width=0` produces zero-size keys.

**Pattern**: Render the scrollable container `<div>` unconditionally (so `containerRef` is set and the ResizeObserver can attach). Suppress the `<svg>` element and all key rects with a conditional until `totalWidth > 0`.

```typescript
return (
  <div ref={containerRef} style={{ overflowX: 'auto', position: 'relative' }}>
    {totalWidth > 0 && (
      <svg width={totalWidth} height={keyboardHeight} ...>
        {/* white keys, black keys, overlays */}
      </svg>
    )}
  </div>
);
```

**Why not return null** (Option A): Returning null unmounts `containerRef`, preventing the ResizeObserver from attaching. The real width would never be observed and the component would remain blank.

**Why not useLayoutEffect** (Option C): Avoids an additional layout effect; the ResizeObserver fires promptly after the first paint, producing a sub-frame blank state that is not perceptible.

---

## Pattern 5: Canvas DevicePixelRatio Scaling

**Applies to**: `CanvasOverlay` (ResizeObserver), `useSparkleAnimation` (particle spawn + physics)

**Problem**: On HiDPI displays, `devicePixelRatio > 1`. Drawing at CSS pixel dimensions produces blurry canvas content.

**Pattern — canvas sizing** (in `CanvasOverlay` ResizeObserver):
```typescript
const dpr = window.devicePixelRatio;
canvas.width  = Math.round(width * dpr);
canvas.height = Math.round(height * dpr);
canvas.style.width  = `${width}px`;
canvas.style.height = `${height}px`;
```

**Pattern — particle spawn** (in `useSparkleAnimation`):
```typescript
const dpr = window.devicePixelRatio;
const spawnX = (rect.x + rect.width / 2) * dpr;
const spawnY = (rect.y + rect.height * 0.3) * dpr;
// velocities, radius, shadowBlur also scaled by dpr
```

**Why `Math.round`**: Fractional canvas pixel dimensions cause sub-pixel rendering artifacts. Rounding prevents this without visible impact at typical DPRs (1, 1.5, 2, 3).

---

## Pattern 6: ResizeObserver Lifecycle Management

**Applies to**: `PianoKeyboard`, `CanvasOverlay`

**Problem**: ResizeObserver instances must be disconnected on unmount to prevent stale callbacks and memory leaks.

**Pattern** (same structure in both components):
```typescript
useEffect(() => {
  if (!targetElement) return;
  const observer = new ResizeObserver(([entry]) => {
    // update state or canvas dimensions
  });
  observer.observe(targetElement);
  return () => observer.disconnect();
}, []); // empty deps — observe once, disconnect on unmount
```

**`PianoKeyboard`**: observes `containerRef.current` → updates `totalWidth` state
**`CanvasOverlay`**: observes `canvas.parentElement` → updates canvas pixel dimensions

---

## Pattern 7: Zustand Selector Isolation

**Applies to**: `PianoKeyboard`, `ThemeProvider`, `ThemeSelector`

**Problem**: Components must re-render only when their specific slice of Zustand state changes, not on every store update.

**Pattern**: Each component selects only the fields it consumes:
```typescript
// PianoKeyboard — re-renders only on detectedNote change
const detectedNote    = useAppStore((s) => s.detectedNote);
const setDetectedNote = useAppStore((s) => s.setDetectedNote);

// ThemeProvider — re-renders only on theme change
const theme = useAppStore((s) => s.theme);

// ThemeSelector — re-renders only on theme change
const theme    = useAppStore((s) => s.theme);
const setTheme = useAppStore((s) => s.setTheme);
```

**CanvasOverlay** does not read Zustand; it receives `activeKeyIndex` as a prop from its parent, keeping it decoupled from the store.
