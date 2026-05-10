# Unit 3: Keyboard & Visual Feedback — Business Rules

---

## Keyboard Rendering (KB)

### BR-01: 88 Keys Always Rendered
- **Rule**: `PianoKeyboard` always renders exactly 88 key rects (52 white + 36 black), regardless of container width
- **Source**: KB-01; `getAllKeyGeometry` invariant from Unit 2

### BR-02: White Keys Rendered Before Black Keys (Z-Order)
- **Rule**: In the SVG render loop, all 52 white key rects are output before all 36 black key rects so that black keys visually sit on top
- **Source**: KB-06 (SVG keyboard)

### BR-03: Keyboard Width = Container Width
- **Rule**: The SVG keyboard `width` equals the container's `clientWidth` at render time; key geometry is recomputed via `getAllKeyGeometry(containerWidth)` on every ResizeObserver callback
- **Source**: KB-01, KB-04 (horizontal scroll with varying screen widths)
- **Minimum**: Container scroll enables keyboards wider than viewport; SVG `width` is never artificially capped

### BR-04: Octave Markers for C1–C8 Only
- **Rule**: Octave markers appear below C1 through C8 (MIDI notes 24–108 in steps of 12); marker text is the octave number (1–8); no marker for A0 or B0
- **Formula**: Octave marker renders when `(midiNote % 12 === 0) AND (midiNote >= 24)` — i.e. the key is a C key above C0
- **Source**: KB-03

### BR-05: Per-Key ARIA Label
- **Rule**: Every key `<rect>` must carry `aria-label` containing the note name and octave number (e.g. `aria-label="C4"`, `aria-label="F#3"`)
- **Source**: Accessibility requirement; WCAG 2.1 AA

### BR-06: Keyboard SVG is Non-Focusable; Keys Are Focusable
- **Rule**: The root `<svg>` has `role="group"` and `aria-label="Piano keyboard"`; each key `<rect>` has `role="button"`, `tabIndex={0}`, and handles `onKeyDown` for keyboard activation (Enter/Space)
- **Source**: KB-05 (clickable/tappable); accessibility

---

## Key Highlighting (VF)

### BR-07: Active Key Gets Theme Neon Colour
- **Rule**: When `detectedNote` is non-null, the key rect at `detectedNote.keyIndex` receives:
  - White key: `fill = "var(--neon-white-key)"`
  - Black key: `fill = "var(--neon-black-key)"`
- **Source**: VF-01, VF-03

### BR-08: All Other Keys Return to Default Fill
- **Rule**: Every key not matching `detectedNote.keyIndex` uses:
  - White key: `fill = "var(--key-white)"` (`#f5f5f0`)
  - Black key: `fill = "var(--key-black)"` (`#1a1a1a`)
- **Source**: VF-01

### BR-09: Note Name Overlay — SVG `<text>` on Active Key (Q1=A)
- **Rule**: When `detectedNote` is non-null, render a single SVG `<text>` element centred horizontally on the active key rect, anchored near the bottom of the key
- **Position**: `x = rect.x + rect.width / 2`, `y = rect.y + rect.height - 8`
- **Content**: `detectedNote.noteName + detectedNote.octave` (e.g. "G#4", "A0", "C8")
- **Font size**: 12px for white keys, 9px for black keys (black keys are narrower)
- **Source**: VF-05

### BR-10: Overlay Hidden When detectedNote Is Null
- **Rule**: The note name `<text>` element is not rendered when `detectedNote` is null
- **Source**: VF-05

### BR-11: Neon Glow Fade on Release
- **Rule**: When `detectedNote` becomes null, the key immediately returns to default fill (no CSS transition on SVG fill). The 1-second neon fade is handled entirely by the Canvas sparkle particles (which continue until their opacity reaches 0). The SVG layer has no animated fade.
- **Rationale**: SVG CSS transitions on fill are unreliable cross-browser; Canvas animation handles the visual persistence (VF-04)
- **Source**: VF-04

---

## Canvas Sparkle Animation (VF)

### BR-12: 12 Particles Per Note Detection (Q3=B)
- **Rule**: Each new non-null `activeKeyIndex` value spawns exactly 12 new sparkle particles appended to the live array
- **Source**: Q3=B

### BR-13: Particle Spawn Position
- **Rule**: Particles spawn at `(keyRect.x + keyRect.width/2, keyRect.y + keyRect.height * 0.3)` — key centre-x, upper third of key height
- **Source**: Q3=B; VF-02

### BR-14: Particle Velocity — Gravity Arc
- **Rule**: Initial velocity: `vx = cos(randomAngle) * speed`, `vy = sin(randomAngle) * speed - 2.0` (upward bias)
  - `speed` is uniform-random in [1.5, 4.0] px/frame
  - `angle` is uniform-random in [-π, π]
  - Gravity: `vy += 0.15` per frame (downward acceleration)
- **Source**: Q3=B (gravity-affected downward arc)

### BR-15: Particle Size — 3–10px
- **Rule**: Each particle's `radius` is uniform-random in [3, 10] px, fixed at spawn time
- **Source**: Q3=B (size varies 3–10px)

### BR-16: Particle Fade — 800ms Lifetime
- **Rule**: `opacity` decrements by `1 / (0.8 × 60) ≈ 0.0208` per frame; particle removed when `opacity ≤ 0`
- **Source**: Q3=B (fades over 800ms); VF-04 (~1 second fade)

### BR-17: Dual Glow Bloom (Q3=B)
- **Rule**: Each particle draws:
  - Outer circle: `fillStyle = particle.colour` (theme `--glow-colour`), `shadowBlur = 12`, `shadowColor = particle.colour`
  - Inner core: `fillStyle = '#ffffff'`, `shadowBlur = 4`, `shadowColor = '#ffffff'`, radius = 40% of outer
- **Source**: Q3=B (inner white + outer theme colour glow bloom)

### BR-18: Animation Loop Stops When Array Empty
- **Rule**: The rAF loop is only active while `particles.length > 0`; when the last particle fades out, no further `requestAnimationFrame` is called until the next note detection
- **Source**: VF-07 (60fps without wasted frames); Q3=B

### BR-19: Canvas Dimensions Match SVG Keyboard
- **Rule**: `canvas.width` and `canvas.height` (pixel dimensions) are set to match the SVG keyboard's rendered pixel size. Updated via ResizeObserver on the shared container.
- **Rule**: Canvas is `position: absolute; top: 0; left: 0; pointer-events: none` so mouse events pass through to the SVG keys below
- **Source**: KB-06 (SVG + Canvas overlay); VF-02

### BR-20: New Note Appends to Live Particles
- **Rule**: When a second note fires while particles from the first are still fading, the new 12 particles are APPENDED to the array. Old particles continue to their natural death. No particle array reset on new detection.
- **Rationale**: Prevents abrupt visual cut on rapid note changes

---

## Theme System (VF-06)

### BR-21: Exactly 3 Themes
- **Rule**: Valid theme values are `'cyber' | 'aurora' | 'sunset'` — exactly as specified in `NeonTheme` type
- **Source**: VF-06

### BR-22: Default Theme is Cyber
- **Rule**: `uiSlice` initialises `theme: 'cyber'`; this persists for the session (no localStorage in Unit 3 — persistence is Unit 4's responsibility)
- **Source**: VF-06; ThemeSelector default selection

### BR-23: Theme Applies to CSS Root Immediately
- **Rule**: `ThemeProvider` applies the four CSS custom properties (`--neon-white-key`, `--neon-black-key`, `--glow-colour`, `--neon-accent`) to `document.documentElement.style` synchronously within the `useEffect` body; no async delay
- **Source**: VF-06

### BR-24: Theme Colour Values (Canonical)
| Theme | `--neon-white-key` | `--neon-black-key` | `--glow-colour` | `--neon-accent` |
|---|---|---|---|---|
| cyber | `#00f3ff` | `#b300ff` | `#00f3ff` | `#00f3ff` |
| aurora | `#39ff14` | `#00e5ff` | `#39ff14` | `#39ff14` |
| sunset | `#ff6b35` | `#ff2d78` | `#ff6b35` | `#ff6b35` |

---

## Teacher Demo Mode (FEAT-10)

### BR-25: Click Writes to pitchSlice.detectedNote (Q2=A)
- **Rule**: A key click constructs a synthetic `DetectedNote` and calls `setDetectedNote(note)` — the same Zustand write path as audio detection
- **Result**: Sparkle animation, key highlight, and note overlay all trigger automatically via existing subscriptions

### BR-26: Synthetic Note Frequency Calculation
- **Rule**: `frequency = 440 * Math.pow(2, (midiNote - 69) / 12)` where `midiNote = keyIndex + 21`
- **Result**: A4 (keyIndex=48) → 440.0 Hz; C4 (keyIndex=39) → ~261.63 Hz

### BR-27: Synthetic Note Clarity = 1.0
- **Rule**: Teacher clicks set `clarity = 1.0` (maximum confidence; no pitchy involvement)
- **Source**: Q2=A; no ambiguity in teacher mode

### BR-28: Teacher Clicks Do Not Update noteHistory
- **Rule**: `setNoteHistory` is called only by `usePitchDetector` (Unit 2), not by `PianoKeyboard`
- **Rationale**: History reflects detected audio notes; teacher demo clicks are ephemeral visual triggers

---

## Keyboard Scroll (KB-04)

### BR-29: Smooth Scroll with Reduced-Motion Fallback (Q4=A)
- **Rule**: Scroll behavior is `'smooth'` unless `window.matchMedia('(prefers-reduced-motion: reduce)').matches` returns true, in which case `'instant'` is used
- **Source**: KB-04; WCAG 2.3.3 Animation from Interactions

### BR-30: Scroll Only on Non-Null Note Change
- **Rule**: `containerRef.scrollTo(...)` is called only when `detectedNote` becomes non-null; no scroll when note is released (null)

### BR-31: Scroll Clamped to 0
- **Rule**: `targetScrollLeft = Math.max(0, keyMidX - containerWidth / 2)` — never scrolls to a negative position
