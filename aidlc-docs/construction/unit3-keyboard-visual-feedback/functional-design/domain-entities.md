# Unit 3: Keyboard & Visual Feedback — Domain Entities

---

## Entity 1: SparkleParticle

**Description**: A single animated canvas particle spawned at a detected key. Mutable — position, velocity, and opacity evolve each animation frame. Not in Zustand; lives exclusively in `useSparkleAnimation`'s particle array ref.

```typescript
interface SparkleParticle {
  x:       number;   // Current x position in canvas coordinates (px)
  y:       number;   // Current y position in canvas coordinates (px)
  vx:      number;   // Horizontal velocity (px/frame)
  vy:      number;   // Vertical velocity (px/frame; negative = upward)
  radius:  number;   // Circle radius (px), uniform-random in [3, 10] at spawn
  opacity: number;   // 0.0–1.0; decremented ~0.021/frame for 800ms lifetime
  colour:  string;   // Theme glow colour (CSS value read at spawn time)
}
```

**Lifecycle**: Created in bulk (12 at a time) on new note detection → mutated each rAF frame (position + opacity update) → removed when `opacity ≤ 0`.

**Spawn parameters** (Q3=B):
- `x` = `keyRect.x + keyRect.width / 2`
- `y` = `keyRect.y + keyRect.height * 0.3`
- `vx` = `Math.cos(angle) * speed` where `angle ∈ [-π, π]`, `speed ∈ [1.5, 4.0]`
- `vy` = `Math.sin(angle) * speed - 2.0` (upward bias)
- `radius` = random integer in [3, 10]
- `opacity` = 1.0
- `colour` = current `--glow-colour` CSS var value

---

## Entity 2: ThemeDefinition

**Description**: A single neon palette — maps a theme ID to the four CSS custom property values applied to `:root` by `ThemeProvider`. Immutable; defined as a static constant.

```typescript
interface ThemeDefinition {
  id:                NeonTheme;  // 'cyber' | 'aurora' | 'sunset'
  label:             string;     // Display name for ThemeSelector UI button
  '--neon-white-key': string;    // Highlight fill for white keys (hex)
  '--neon-black-key': string;    // Highlight fill for black keys (hex)
  '--glow-colour':   string;     // Canvas shadow colour for particle glow (hex)
  '--neon-accent':   string;     // ThemeSelector active indicator colour (hex)
}
```

**Canonical values** (BR-24):
```typescript
const THEME_DEFINITIONS: Record<NeonTheme, ThemeDefinition> = {
  cyber: {
    id: 'cyber', label: 'Cyber',
    '--neon-white-key': '#00f3ff',
    '--neon-black-key': '#b300ff',
    '--glow-colour':    '#00f3ff',
    '--neon-accent':    '#00f3ff',
  },
  aurora: {
    id: 'aurora', label: 'Aurora',
    '--neon-white-key': '#39ff14',
    '--neon-black-key': '#00e5ff',
    '--glow-colour':    '#39ff14',
    '--neon-accent':    '#39ff14',
  },
  sunset: {
    id: 'sunset', label: 'Sunset',
    '--neon-white-key': '#ff6b35',
    '--neon-black-key': '#ff2d78',
    '--glow-colour':    '#ff6b35',
    '--neon-accent':    '#ff6b35',
  },
};
```

---

## Entity 3: UiState (Zustand slice)

**Description**: Zustand slice for UI preferences. Scaffolded in Unit 3 (theme only); `onboardingDismissed` is present as a stub (default `false`) and completed in Unit 4.

**File**: `src/store/uiSlice.ts`

```typescript
export interface UiState {
  theme:                    NeonTheme;
  onboardingDismissed:      boolean;     // stub — completed in Unit 4
  setTheme:                 (t: NeonTheme) => void;
  setOnboardingDismissed:   (v: boolean) => void;
}

export const createUiSlice: StateCreator<UiState> = (set) => ({
  theme:                  'cyber',
  onboardingDismissed:    false,
  setTheme:               (t) => set({ theme: t }),
  setOnboardingDismissed: (v) => set({ onboardingDismissed: v }),
});
```

**appStore extension** (Unit 3 extends existing appStore):
```typescript
// appStore.ts after Unit 3
export type AppState = AudioState & PitchState & UiState;
export const useAppStore = create<AppState>()((...a) => ({
  ...createAudioSlice(...a),
  ...createPitchSlice(...a),
  ...createUiSlice(...a),
}));
```

---

## Entity 4: PianoKeyboard Internal Refs

These refs live inside `PianoKeyboard` and do not appear in Zustand or props. They manage geometry and scroll state without causing re-renders.

```typescript
const containerRef    = useRef<HTMLDivElement | null>(null);
// The scrollable container wrapping the SVG — used for scrollTo() calls

const totalWidth      = useState<number>(0);
// React state — triggers re-render when ResizeObserver fires; NOT a ref
// because layout-dependent renders must be synchronised with the DOM

const keyboardHeight  // derived: getKeyGeometry(0, totalWidth).height (computed in render)
```

**Note**: `totalWidth` is React state (not a ref) because changing it must trigger a re-render to recompute `getAllKeyGeometry` and update the SVG.

---

## Entity 5: CanvasOverlay / useSparkleAnimation Internal Refs

```typescript
const canvasRef          = useRef<HTMLCanvasElement | null>(null);
// The canvas DOM element — used to get 2D context and set pixel dimensions

const particlesRef       = useRef<SparkleParticle[]>([]);
// Live particle array — mutated in-place each frame (no React state, no re-renders)

const animationFrameRef  = useRef<number>(0);
// rAF handle — cancelled on unmount or when particles drain to 0

const activeKeyIndexRef  = useRef<number | null>(null);
// Last-known active key — used to detect change (spawn only on actual key change,
// not on every render of the same note)
```

---

## Relationship Summary

```
ThemeProvider
  reads: uiSlice.theme (Zustand)
  writes: CSS custom properties on document.documentElement
  consumed by: SVG fills (via var(--neon-*)), Canvas colours (via getComputedStyle)

PianoKeyboard
  reads: pitchSlice.detectedNote (Zustand)
  reads: getAllKeyGeometry(containerWidth) from pianoGeometry.ts
  writes: pitchSlice.detectedNote on key click (Q2=A, teacher mode)
  renders: 88 SVG <rect> keys + octave markers + note label <text>

CanvasOverlay
  receives: activeKeyIndex prop from parent (derived from pitchSlice.detectedNote)
  owns: <canvas> DOM element
  delegates animation to: useSparkleAnimation

useSparkleAnimation
  reads: activeKeyIndex prop
  reads: getKeyGeometry(activeKeyIndex, keyboardWidth) for spawn position
  reads: CSS --glow-colour at spawn time
  maintains: SparkleParticle[] array (in-memory, not Zustand)

ThemeSelector
  reads: uiSlice.theme (Zustand)
  writes: uiSlice.setTheme on button click
```
