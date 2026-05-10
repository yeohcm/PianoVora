# Unit 3: Keyboard & Visual Feedback — NFR Requirements Plan

## Unit Context

**Components**: PianoKeyboard, CanvasOverlay, useSparkleAnimation, ThemeProvider, ThemeSelector, uiSlice

**Primary NFR Concerns**:
- Canvas rAF animation must sustain 60fps without wasted frames
- SVG with 88 keys re-renders on every `detectedNote` change — memoisation opportunity
- ResizeObserver fires continuously during resize — must not cause layout thrash
- Accessibility: reduced-motion preference affects both scroll (already decided BR-29) and canvas animation (gap)
- Canvas particle memory must drain cleanly with no rAF leak on unmount

---

## NFR Assessment Steps

- [x] Analyse functional design artifacts
- [x] Identify performance-critical paths
- [x] Identify accessibility gaps
- [x] Generate NFR questions
- [x] Collect answers
- [x] Generate nfr-requirements.md
- [x] Generate tech-stack-decisions.md

---

## Open Questions

---

### Question 1
**Accessibility — prefers-reduced-motion for sparkle animation**

BR-29 already applies `prefers-reduced-motion` to keyboard scroll. The canvas sparkle animation (useSparkleAnimation) currently has no reduced-motion handling. When `prefers-reduced-motion: reduce` is set:

A) **Disable particle spawning entirely** — `useSparkleAnimation` checks the media query before spawning; no particles are created; canvas stays blank. Maximum motion reduction.

B) **Skip the rAF fade loop; particles appear then vanish instantly** — Spawn particles at full opacity but skip the animation loop; a single `clearRect` on the next frame removes them. Visual "flash" acknowledges the note without animated motion.

C) **No change — canvas animation is exempt** — Sparkles are an optional visual embellishment, not a functional animation; `prefers-reduced-motion` compliance is met by the scroll fallback alone.

[Answer]: B

---

### Question 2
**Performance — ResizeObserver update strategy**

When the browser window is resized, ResizeObserver fires continuously (many events per second). Each callback updates `totalWidth` React state, which triggers a full 88-key geometry recompute and SVG re-render.

A) **Immediate — update on every ResizeObserver callback** — React 18 automatic batching limits re-render cost; geometry compute is O(88) and fast; no debounce added.

B) **rAF-batched — schedule state update inside a `requestAnimationFrame`** — Coalesces multiple ResizeObserver events within one frame into a single state update; prevents mid-resize jank; adds one frame of latency.

C) **Debounce — 100ms trailing debounce on the ResizeObserver callback** — Defers update until resize settles; produces a visible reflow "snap" after resize stops.

[Answer]: A

---

### Question 3
**Performance — Tab visibility guard for rAF loop**

When the user switches to another browser tab, `requestAnimationFrame` is throttled by the browser to ~1fps or paused entirely. Active sparkle particles would take up to 48 seconds to drain at 1fps.

A) **Add `document.visibilitychange` listener — cancel rAF when hidden, resume when visible** — Prevents any background rAF calls; particle array is preserved and resumes on tab focus.

B) **No guard — rely on browser throttling** — At 1fps, 800ms-lifetime particles drain in ~48 frames (~48 seconds background); negligible CPU cost at 1fps; simpler code.

C) **Clear particle array on tab hide** — When tab becomes hidden, clear `particlesRef.current = []` and cancel rAF; on return the canvas is blank (no resume).

[Answer]: B

---

### Question 4
**Performance — SVG key re-render memoisation**

`PianoKeyboard` re-renders whenever `detectedNote` changes (Zustand selector). The render loops over all 88 `KeyRect` objects to compute fills and build `<rect>` JSX. This is O(88) on every note change.

A) **No memoisation — inline O(88) loop per render** — Acceptable: 88 iterations of simple comparisons is sub-millisecond; React's virtual DOM diff is the real cost, not the JS loop; keep code simple.

B) **Memoize the static key rects** — Use `useMemo` to compute `allKeyRects` only when `totalWidth` changes; the highlighted fill is derived inline per render. Reduces geometry recomputation on note changes.

C) **Split into two components** — `PianoKeyboardStatic` (renders 88 rects, memoized, updates only on width change) + `ActiveKeyOverlay` (renders only the highlight rect + label, updates on note change). Minimizes DOM diff cost.

[Answer]: B

---
