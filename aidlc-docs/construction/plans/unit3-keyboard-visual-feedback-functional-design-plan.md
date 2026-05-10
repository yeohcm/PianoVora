# Unit 3: Keyboard & Visual Feedback — Functional Design Plan

## Unit Context

**Purpose**: Render the full 88-key SVG keyboard, display the Canvas sparkle/glow animation at the detected key, provide the neon theme system (Cyber/Aurora/Sunset) via CSS custom properties.

**Stories**: FEAT-03 (On-Screen Keyboard), FEAT-04 (Neon Visual Feedback), FEAT-05 (Colour Theme Selection), FEAT-10 (Teacher Demonstration)

**PRD Requirements**: KB-01 through KB-06, VF-01 through VF-07

**Components to design**:
- `PianoKeyboard.tsx` — SVG 88-key keyboard
- `CanvasOverlay.tsx` — Canvas sparkle/glow host
- `useSparkleAnimation.ts` — rAF animation loop
- `ThemeProvider.tsx` — CSS custom property injector
- `ThemeSelector.tsx` — theme picker UI
- `uiSlice.ts` — theme Zustand slice (scaffolded here; onboarding completed in Unit 4)

---

## Open Questions

---

### Question 1
**VF-05 — Note name overlay location**

When a note is active, where should the note name (e.g. "G#4") be rendered?

A) **SVG `<text>` inside PianoKeyboard** — positioned on the active key rect; rendered in the same SVG coordinate space as the key; automatically aligns with the key geometry; simpler but pushes text into the SVG layer

B) **Absolutely-positioned HTML `<div>` above the Canvas layer** — positioned via key geometry (x, y, width from `getKeyGeometry`); fully CSS-styleable; sits above both SVG and Canvas layers

C) **Canvas text in CanvasOverlay/useSparkleAnimation** — drawn alongside the sparkle effect each frame; no separate DOM element; but requires redrawing every frame even when text is static

[Answer]: A

---

### Question 2
**FEAT-10 — Teacher click effect on the Zustand store**

When a keyboard key is clicked in teacher demo mode, what should happen in the store?

A) **Write to `pitchSlice.detectedNote`** — click triggers the same state path as audio detection (sparkle, note history update, highlight, note label all trigger automatically via existing Zustand subscriptions)

B) **Call `onKeyClick(keyIndex)` prop only** — PianoKeyboard emits the click upward; parent (AppLayout in Unit 4) decides what to write. PianoKeyboard does not write to the store directly.

C) **Local visual state only** — `PianoKeyboard` maintains its own `clickedKeyIndex` state; visual highlight shows without touching Zustand

[Answer]: A

---

### Question 3
**VF-02/VF-04/VF-07 — Sparkle particle system parameters**

Choose the particle system design for the Canvas sparkle/glow animation:

A) **Simple glow + 8 particles** — On new note: spawn 8 particles at key centre; each has random upward/spread velocity; opacity fades from 1.0 to 0 over 1 second; size 4–8px circles; canvas shadow blur for glow bloom effect; 60fps rAF loop

B) **Rich burst + 12 particles** — On new note: spawn 12 particles; gravity-affected downward arc; opacity fades over 800ms; size varies 3–10px; distinct inner (white) + outer (theme colour) glow bloom

C) Other — please describe after [Answer]:

[Answer]: B

---

### Question 4
**KB-04 — Active key scroll behaviour**

When the detected note changes, how should the keyboard scroll to centre the active key?

A) **Smooth scroll** — `scrollIntoView({ behavior: 'smooth', inline: 'center' })` on every note change; animated; respects `prefers-reduced-motion` by falling back to instant

B) **Instant scroll** — `scrollIntoView({ behavior: 'instant', inline: 'center' })` on every note change; no animation; guaranteed to land before the next animation frame

C) **Lazy scroll** — scroll only when the active key is partially outside the visible scroll area

[Answer]: A

---

## Functional Design Artifact Checklist (executed after answers)

- [x] Generate `aidlc-docs/construction/unit3-keyboard-visual-feedback/functional-design/business-logic-model.md`
  - [x] Flow: SVG keyboard rendering pipeline
  - [x] Flow: Key highlighting on note detection
  - [x] Flow: Canvas sparkle animation lifecycle
  - [x] Flow: Theme application via CSS custom properties
  - [x] Flow: Teacher mode click propagation
  - [x] Flow: Keyboard scroll-to-centre
- [x] Generate `aidlc-docs/construction/unit3-keyboard-visual-feedback/functional-design/business-rules.md`
  - [x] All KB-* and VF-* derived rules
- [x] Generate `aidlc-docs/construction/unit3-keyboard-visual-feedback/functional-design/domain-entities.md`
  - [x] SparkleParticle, ThemeDefinition, UiState
- [x] Generate `aidlc-docs/construction/unit3-keyboard-visual-feedback/functional-design/frontend-components.md`
  - [x] PianoKeyboard (props, state, interactions)
  - [x] CanvasOverlay (props, canvas lifecycle)
  - [x] useSparkleAnimation (refs, animation state)
  - [x] ThemeProvider (CSS property mapping)
  - [x] ThemeSelector (UI, store writes)
