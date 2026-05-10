# Unit 3: Keyboard & Visual Feedback — Frontend Components

---

## Component 1: PianoKeyboard

**File**: `src/features/keyboard/PianoKeyboard.tsx`

**Responsibility**: Renders the full 88-key SVG keyboard. Applies neon highlight to the detected key. Renders note name overlay as SVG text. Scrolls container to centre active key. Handles key clicks for teacher mode.

**Props**: None — reads Zustand directly.

**Zustand reads**:
```typescript
const detectedNote = useAppStore((s) => s.detectedNote);
const setDetectedNote = useAppStore((s) => s.setDetectedNote);
```

**Internal state**:
```typescript
const [totalWidth, setTotalWidth] = useState(0);
const containerRef = useRef<HTMLDivElement | null>(null);
```

**Key refs** (for scroll):
No per-key DOM refs needed — scroll uses `containerRef.scrollTo()` with computed offset from `getKeyGeometry()`.

**ResizeObserver** (for width):
```typescript
useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver(([entry]) => {
    setTotalWidth(entry.contentRect.width);
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```

**Scroll effect** (on detectedNote change):
```typescript
useEffect(() => {
  if (!detectedNote || !containerRef.current || totalWidth === 0) return;
  const rect = getKeyGeometry(detectedNote.keyIndex, totalWidth);
  if (!rect) return;
  const keyMidX = rect.x + rect.width / 2;
  const containerWidth = containerRef.current.clientWidth;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  containerRef.current.scrollTo({
    left: Math.max(0, keyMidX - containerWidth / 2),
    behavior: reduced ? 'instant' : 'smooth',
  });
}, [detectedNote, totalWidth]);
```

**Key click handler**:
```typescript
function handleKeyClick(keyIndex: number): void {
  const midiNote = keyIndex + 21;
  const note: DetectedNote = {
    midiNote,
    keyIndex,
    noteName: keyIndexToNoteName(keyIndex)!,
    octave:   keyIndexToOctave(keyIndex)!,
    frequency: 440 * Math.pow(2, (midiNote - 69) / 12),
    clarity:   1.0,
    timestamp: performance.now(),
  };
  setDetectedNote(note);
}
```

**Key keyboard activation** (Enter/Space):
```typescript
function handleKeyKeyDown(e: React.KeyboardEvent, keyIndex: number): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleKeyClick(keyIndex);
  }
}
```

**Render structure**:
```typescript
<div
  ref={containerRef}
  style={{ overflowX: 'auto', position: 'relative' }}
  data-testid="piano-keyboard-container"
>
  <svg
    width={totalWidth}
    height={keyboardHeight}
    role="group"
    aria-label="Piano keyboard"
    data-testid="piano-keyboard-svg"
  >
    {/* White keys first (z-order) */}
    {allKeyRects.filter(r => !r.isBlack).map(rect => (
      <rect key={rect.keyIndex} {...rectProps} />
    ))}
    {/* Black keys on top */}
    {allKeyRects.filter(r => r.isBlack).map(rect => (
      <rect key={rect.keyIndex} {...rectProps} />
    ))}
    {/* Octave markers C1–C8 */}
    {octaveMarkers.map(({ x, label }) => (
      <text key={label} x={x} y={keyboardHeight + 14} textAnchor="middle" fontSize={10}>
        {label}
      </text>
    ))}
    {/* Note name overlay on active key (Q1=A) */}
    {detectedNote && activeRect && (
      <text
        x={activeRect.x + activeRect.width / 2}
        y={activeRect.y + activeRect.height - 8}
        textAnchor="middle"
        fontSize={activeRect.isBlack ? 9 : 12}
        fill="var(--key-label-colour)"
        aria-live="polite"
        aria-atomic="true"
        data-testid="active-key-label"
      >
        {detectedNote.noteName + detectedNote.octave}
      </text>
    )}
  </svg>
</div>
```

**Each key rect props** (derived inline):
```typescript
{
  x:          rect.x,
  y:          rect.y,
  width:      rect.width,
  height:     rect.height,
  fill:       rect.keyIndex === detectedNote?.keyIndex
                ? (rect.isBlack ? 'var(--neon-black-key)' : 'var(--neon-white-key)')
                : (rect.isBlack ? 'var(--key-black)' : 'var(--key-white)'),
  role:       'button',
  tabIndex:   0,
  cursor:     'pointer',
  'aria-label': keyIndexToNoteName(rect.keyIndex)! + keyIndexToOctave(rect.keyIndex)!,
  onClick:    () => handleKeyClick(rect.keyIndex),
  onKeyDown:  (e) => handleKeyKeyDown(e, rect.keyIndex),
  'data-testid': `key-${rect.keyIndex}`,
}
```

**`data-testid` attributes**:
- `piano-keyboard-container` — scrollable wrapper
- `piano-keyboard-svg` — SVG element
- `key-{keyIndex}` — each key rect (e.g. `key-48` for A4)
- `active-key-label` — note name SVG text overlay

---

## Component 2: CanvasOverlay

**File**: `src/features/keyboard/CanvasOverlay.tsx`

**Responsibility**: Absolutely-positioned canvas element layered over the SVG keyboard. Measures its own container. Delegates animation to `useSparkleAnimation`.

**Props**:
```typescript
interface CanvasOverlayProps {
  activeKeyIndex: number | null;   // from parent — derived from pitchSlice.detectedNote?.keyIndex
  keyboardWidth:  number;          // SVG keyboard pixel width — for particle positioning
}
```

**Internal**:
```typescript
const canvasRef = useRef<HTMLCanvasElement | null>(null);

// Resize canvas pixel dimensions to match container
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas || !canvas.parentElement) return;
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    canvas.width = Math.round(width * window.devicePixelRatio);
    canvas.height = Math.round(height * window.devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  });
  observer.observe(canvas.parentElement);
  return () => observer.disconnect();
}, []);
```

**Render**:
```typescript
useSparkleAnimation({ canvasRef, activeKeyIndex, keyboardWidth });

return (
  <canvas
    ref={canvasRef}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      pointerEvents: 'none',   // clicks pass through to SVG keys below
    }}
    aria-hidden="true"
    data-testid="canvas-overlay"
  />
);
```

**`data-testid`**: `canvas-overlay`

---

## Component 3: useSparkleAnimation (Hook)

**File**: `src/features/keyboard/useSparkleAnimation.ts`

**Responsibility**: Manages the rAF animation loop. Spawns 12 particles on new key detection. Updates particle physics each frame. Stops loop when particles drain to zero.

**Options interface**:
```typescript
interface SparkleAnimationOptions {
  canvasRef:      React.RefObject<HTMLCanvasElement | null>;
  activeKeyIndex: number | null;
  keyboardWidth:  number;
}

export function useSparkleAnimation(options: SparkleAnimationOptions): void
```

**Constants** (module-level):
```typescript
const PARTICLE_COUNT   = 12;
const GRAVITY          = 0.15;          // px/frame²
const FADE_RATE        = 1 / (0.8 * 60); // per frame (~0.021 for 800ms)
const MIN_SPEED        = 1.5;           // px/frame
const MAX_SPEED        = 4.0;           // px/frame
const MIN_RADIUS       = 3;             // px
const MAX_RADIUS       = 10;            // px
```

**Refs owned**:
```typescript
const particlesRef      = useRef<SparkleParticle[]>([]);
const animationFrameRef = useRef<number>(0);
const prevKeyIndexRef   = useRef<number | null>(null);   // detect genuine key changes
```

**Spawn effect** (watches activeKeyIndex):
```typescript
useEffect(() => {
  if (activeKeyIndex === null) return;
  if (activeKeyIndex === prevKeyIndexRef.current) return; // same key — no respawn
  prevKeyIndexRef.current = activeKeyIndex;

  const rect = getKeyGeometry(activeKeyIndex, keyboardWidth);
  if (!rect) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const dpr = window.devicePixelRatio;
  const spawnX = (rect.x + rect.width / 2) * dpr;
  const spawnY = (rect.y + rect.height * 0.3) * dpr;
  const colour = getComputedStyle(document.documentElement)
    .getPropertyValue('--glow-colour').trim() || '#00f3ff';

  const newParticles: SparkleParticle[] = Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * 2 * Math.PI - Math.PI;
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    return {
      x:       spawnX,
      y:       spawnY,
      vx:      Math.cos(angle) * speed * dpr,
      vy:      (Math.sin(angle) * speed - 2.0) * dpr,
      radius:  (MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS)) * dpr,
      opacity: 1.0,
      colour,
    };
  });

  particlesRef.current = [...particlesRef.current, ...newParticles];

  if (!animationFrameRef.current) {
    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }
}, [activeKeyIndex, keyboardWidth, canvasRef]);
```

**Animation loop** (closed over via useCallback or stable ref):
```typescript
const animationLoop = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particlesRef.current = particlesRef.current.filter((p) => {
    p.vy += GRAVITY * window.devicePixelRatio;
    p.x  += p.vx;
    p.y  += p.vy;
    p.opacity -= FADE_RATE;
    if (p.opacity <= 0) return false;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.opacity);
    // Outer glow (theme colour)
    ctx.shadowBlur  = 12 * window.devicePixelRatio;
    ctx.shadowColor = p.colour;
    ctx.fillStyle   = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright core (white)
    ctx.shadowBlur  = 4 * window.devicePixelRatio;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return true;
  });

  if (particlesRef.current.length > 0) {
    animationFrameRef.current = requestAnimationFrame(animationLoop);
  } else {
    animationFrameRef.current = 0;
  }
}, [canvasRef]);
```

**Cleanup** (unmount):
```typescript
useEffect(() => {
  return () => {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
    particlesRef.current = [];
  };
}, []);
```

---

## Component 4: ThemeProvider

**File**: `src/features/ui/ThemeProvider.tsx`

**Responsibility**: Reads `uiSlice.theme` and synchronises four CSS custom properties on `document.documentElement`. Renders its children unchanged.

**Props**:
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
}
```

**Zustand read**: `const theme = useAppStore((s) => s.theme);`

**Effect**:
```typescript
useEffect(() => {
  const def = THEME_DEFINITIONS[theme];
  const root = document.documentElement;
  root.style.setProperty('--neon-white-key', def['--neon-white-key']);
  root.style.setProperty('--neon-black-key', def['--neon-black-key']);
  root.style.setProperty('--glow-colour',    def['--glow-colour']);
  root.style.setProperty('--neon-accent',    def['--neon-accent']);
}, [theme]);
```

**Render**: `return <>{children}</>;`

**`data-testid`**: none (wrapper only; test via DOM CSS var inspection)

---

## Component 5: ThemeSelector

**File**: `src/features/ui/ThemeSelector.tsx`

**Responsibility**: Displays three buttons (Cyber, Aurora, Sunset). Active theme button is visually differentiated. Clicking a button writes to `uiSlice.setTheme`.

**Props**: None.

**Zustand read/write**:
```typescript
const theme    = useAppStore((s) => s.theme);
const setTheme = useAppStore((s) => s.setTheme);
```

**Render structure**:
```typescript
<div
  role="group"
  aria-label="Colour theme"
  data-testid="theme-selector"
  className="flex gap-2"
>
  {(['cyber', 'aurora', 'sunset'] as NeonTheme[]).map((t) => (
    <button
      key={t}
      onClick={() => setTheme(t)}
      aria-pressed={theme === t}
      data-testid={`theme-btn-${t}`}
      className={theme === t ? 'active-theme-btn' : 'inactive-theme-btn'}
    >
      {THEME_DEFINITIONS[t].label}
    </button>
  ))}
</div>
```

**`data-testid` attributes**:
- `theme-selector` — wrapper group
- `theme-btn-cyber`, `theme-btn-aurora`, `theme-btn-sunset` — individual buttons

**Accessibility**: Each button has `aria-pressed={theme === t}` to communicate active state to screen readers.

---

## Component Interaction Summary

```
ThemeProvider (wraps the app tree)
  reads: uiSlice.theme
  writes: document.documentElement CSS vars

ThemeSelector
  reads: uiSlice.theme (active indicator)
  writes: uiSlice.setTheme → triggers ThemeProvider effect

PianoKeyboard
  reads: pitchSlice.detectedNote (key highlight + label + scroll)
  writes: pitchSlice.detectedNote (teacher click Q2=A)
  reads: pianoGeometry.getAllKeyGeometry (layout)
  reads: pianoGeometry.getKeyGeometry (scroll computation, key click)

CanvasOverlay
  receives: activeKeyIndex, keyboardWidth (props from parent)
  owns: <canvas> element ref
  delegates: to useSparkleAnimation

useSparkleAnimation
  reads: activeKeyIndex prop (spawns on change)
  reads: pianoGeometry.getKeyGeometry (spawn position)
  reads: CSS --glow-colour (particle colour at spawn)
  maintains: SparkleParticle[] in ref (no Zustand, no re-renders)
```
