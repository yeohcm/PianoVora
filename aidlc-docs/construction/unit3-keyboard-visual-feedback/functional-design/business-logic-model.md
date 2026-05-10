# Unit 3: Keyboard & Visual Feedback — Business Logic Model

---

## Flow 1: SVG Keyboard Rendering Pipeline

Executed once on `PianoKeyboard` mount and whenever the container width changes (ResizeObserver).

```
PianoKeyboard mounts
  |
  v
[Measure container]
containerRef.current.clientWidth → totalWidth
  |
  v
[Compute all key geometry]
getAllKeyGeometry(totalWidth) → KeyRect[88]
  |
  v
[Render white keys first]
For each KeyRect where isBlack === false:
  <rect x y width height fill="var(--key-white)" aria-label="[noteName][octave]" />
  If (keyIndex + 21) % 12 === 0 AND midiNote >= 24:  // C keys (C1–C8)
    <text x=centreX y=belowKeyY>[octave]</text>       // Octave marker
  |
  v
[Render black keys on top]
For each KeyRect where isBlack === true:
  <rect x y width height fill="var(--key-black)" aria-label="[noteName][octave]" />
  |
  v
[SVG keyboard fully rendered — all 88 keys visible]
```

**Container**: `<div ref={containerRef} style={{ overflowX: 'auto' }}>`

**SVG dimensions**: `width={totalWidth}`, `height={whiteKeyHeight}` (from `getKeyGeometry(0, totalWidth).height`)

**ResizeObserver**: Updates `totalWidth` state → triggers re-render with new geometry

---

## Flow 2: Key Highlighting on Note Detection

Triggered whenever `pitchSlice.detectedNote` changes (Zustand subscription).

```
detectedNote changes in Zustand
  |
  v
[Determine active key]
activeKeyIndex = detectedNote?.keyIndex ?? null
  |
  v
[Apply fill to each key rect via derived className or inline style]

For each key rect in render:
  if keyIndex === activeKeyIndex:
    isBlack → fill = "var(--neon-black-key)"
    else    → fill = "var(--neon-white-key)"
  else:
    isBlack → fill = "var(--key-black)"
    else    → fill = "var(--key-white)"
  |
  v
[Note name overlay — SVG <text> on active key]
if activeKeyIndex !== null:
  rect = getKeyGeometry(activeKeyIndex, totalWidth)
  <text
    x = rect.x + rect.width / 2      (horizontal centre)
    y = rect.y + rect.height - 8      (near bottom of key)
    textAnchor="middle"
    fill="var(--key-label-colour)"
    fontSize={isBlack ? 9 : 12}
  >
    {detectedNote.noteName + detectedNote.octave}
  </text>
  |
  v
[Scroll to centre (Flow 6)]
```

**Trigger**: Zustand selector `useAppStore((s) => s.detectedNote)` — component re-renders only when this value changes (zero re-renders for sustained notes via BR-04 in Unit 2).

---

## Flow 3: Canvas Sparkle Animation Lifecycle

`useSparkleAnimation` hook, owned by `CanvasOverlay`. Driven by changes to `activeKeyIndex`.

```
New non-null activeKeyIndex received
  |
  v
[Compute spawn position]
rect = getKeyGeometry(activeKeyIndex, keyboardWidth)
spawnX = rect.x + rect.width / 2    (key centre, canvas coordinates)
spawnY = rect.y + rect.height * 0.3 (upper third of key)
  |
  v
[Spawn 12 particles]
For i in 0..11:
  angle = random(-π, π)              (full spread)
  speed = random(1.5, 4.0)          (px/frame)
  particle = {
    x:       spawnX,
    y:       spawnY,
    vx:      Math.cos(angle) * speed,
    vy:      Math.sin(angle) * speed - 2.0,   (biased upward)
    radius:  random(3, 10),
    opacity: 1.0,
    colour:  getComputedStyle(document.documentElement)
               .getPropertyValue('--glow-colour').trim()
  }
  particles.push(particle)
  |
  v
[Start/continue rAF loop if not already running]
animationFrameRef.current = requestAnimationFrame(animationLoop)
```

**Animation loop** (runs at 60fps):
```
animationLoop(timestamp):
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  |
  v
  For each particle:
    particle.vy += GRAVITY          (GRAVITY = 0.15 px/frame² — downward arc)
    particle.x  += particle.vx
    particle.y  += particle.vy
    particle.opacity -= FADE_RATE   (FADE_RATE = 1.0 / (0.8 × 60) ≈ 0.021/frame for 800ms)
    |
    [Draw particle if opacity > 0]
    ctx.save()
    ctx.globalAlpha = Math.max(0, particle.opacity)
    // Outer glow (theme colour)
    ctx.shadowBlur = 12
    ctx.shadowColor = particle.colour
    ctx.fillStyle = particle.colour
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.radius, 0, 2π)
    ctx.fill()
    // Inner bright core (white)
    ctx.shadowBlur = 4
    ctx.shadowColor = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.radius * 0.4, 0, 2π)
    ctx.fill()
    ctx.restore()
  |
  v
  [Remove dead particles]
  particles = particles.filter(p => p.opacity > 0)
  |
  v
  if particles.length > 0:
    animationFrameRef.current = requestAnimationFrame(animationLoop)
  else:
    animationFrameRef.current = 0   (loop stops — no idle CPU usage, BR-14)
```

**New note mid-animation**: New particles are APPENDED to the existing array (old particles continue fading while new ones spawn). Previous key's particles keep running to natural death.

---

## Flow 4: Theme Application via CSS Custom Properties

Executed by `ThemeProvider` on mount and whenever `uiSlice.theme` changes.

```
theme value changes in Zustand (or on mount)
  |
  v
[Look up ThemeDefinition]
def = THEME_DEFINITIONS[theme]
  |
  v
[Apply CSS custom properties to document root]
document.documentElement.style.setProperty('--neon-white-key', def['--neon-white-key'])
document.documentElement.style.setProperty('--neon-black-key', def['--neon-black-key'])
document.documentElement.style.setProperty('--glow-colour',   def['--glow-colour'])
document.documentElement.style.setProperty('--neon-accent',   def['--neon-accent'])
  |
  v
[CSS cascade propagates instantly]
All SVG fills, canvas colours, ThemeSelector accents update without re-render
```

**THEME_DEFINITIONS** (defined in `ThemeProvider.tsx`, TypeScript constant):
```
cyber:  { --neon-white-key: '#00f3ff', --neon-black-key: '#b300ff', --glow-colour: '#00f3ff', --neon-accent: '#00f3ff' }
aurora: { --neon-white-key: '#39ff14', --neon-black-key: '#00e5ff', --glow-colour: '#39ff14', --neon-accent: '#39ff14' }
sunset: { --neon-white-key: '#ff6b35', --neon-black-key: '#ff2d78', --glow-colour: '#ff6b35', --neon-accent: '#ff6b35' }
```

**Additional static variables** (defined in `src/index.css`, not overwritten by theme):
```
--key-white: #f5f5f0        (unlit white key)
--key-black: #1a1a1a        (unlit black key)
--key-label-colour: #000000 (note name text on white keys)
```

---

## Flow 5: Teacher Mode Click Propagation

Triggered by a user click/tap on any SVG key rect in `PianoKeyboard`.

```
User clicks key rect at keyIndex K
  |
  v
[Build synthetic DetectedNote (Q2=A — same path as audio detection)]
midiNote  = K + 21
noteName  = keyIndexToNoteName(K)!
octave    = keyIndexToOctave(K)!
frequency = 440 * Math.pow(2, (midiNote - 69) / 12)   // inverse MIDI formula
note = {
  midiNote,
  keyIndex:  K,
  noteName,
  octave,
  frequency,
  clarity:   1.0,          // synthetic — maximum confidence
  timestamp: performance.now()
}
  |
  v
[Write to Zustand pitchSlice]
setDetectedNote(note)
  |
  v
[All existing consumers react automatically]
→ PianoKeyboard: key K highlighted, note label shown, scroll triggered
→ CanvasOverlay: 12 particles spawned at key K
→ Unit 4 NoteHistoryPanel: note prepended to history (via pitchSlice BR-05)

Note: noteHistory is NOT updated by teacher clicks — setNoteHistory is only called
by usePitchDetector (Unit 2). Teacher clicks write only detectedNote.
```

**Wait — does teacher click update noteHistory?** Per Q2=A, teacher click writes to `pitchSlice.detectedNote`. The `noteHistory` is updated by `usePitchDetector` (Unit 2) only. So teacher clicks do NOT update `noteHistory`. This is intentional — history reflects detected audio notes, not teacher demonstrations.

---

## Flow 6: Keyboard Scroll-to-Centre

Triggered after a new `detectedNote` is set (audio or teacher click). Part of `PianoKeyboard`.

```
detectedNote changes to non-null (keyIndex K)
  |
  v
[Check prefers-reduced-motion]
reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
scrollBehavior = reducedMotion ? 'instant' : 'smooth'
  |
  v
[Compute target scroll position from geometry]
rect = getKeyGeometry(K, totalWidth)
keyMidX = rect.x + rect.width / 2
containerWidth = containerRef.current.clientWidth
targetScrollLeft = keyMidX - containerWidth / 2
  |
  v
[Apply scroll]
containerRef.current.scrollTo({
  left: Math.max(0, targetScrollLeft),
  behavior: scrollBehavior
})
```

**Why container.scrollTo vs scrollIntoView**: `scrollTo` with a computed offset is more reliable for SVG `<rect>` elements across all browsers; avoids `scrollIntoView` inconsistencies on SVG nodes.
