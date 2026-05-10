# Unit 3: Keyboard & Visual Feedback — NFR Design Plan

## Unit Context

**NFR requirements source**: `aidlc-docs/construction/unit3-keyboard-visual-feedback/nfr-requirements/`

**Design areas**:
- rAF animation loop pattern (start/stop, reduced-motion branch)
- useMemo for key geometry
- Canvas devicePixelRatio scaling pattern
- Cleanup (rAF + ResizeObserver)
- Zero-width keyboard guard (before first ResizeObserver fires)

---

## NFR Design Steps

- [x] Analyse NFR requirements artifacts
- [x] Identify design patterns needed
- [x] Generate NFR design questions
- [x] Collect answers
- [x] Generate nfr-design-patterns.md
- [x] Generate logical-components.md

---

## Open Questions

---

### Question 1
**Performance Pattern — Reduced-motion flash implementation**

NFR-A1 specifies: when `prefers-reduced-motion: reduce` is set, particles are "drawn once at full opacity, then the canvas is cleared immediately." The exact timing determines whether the user sees a visible flash.

A) **Two-rAF pattern** — `rAF frame 1`: draw all particles; `rAF frame 2`: `clearRect`. Particles are visible for exactly one frame (~16ms at 60fps). Browser paints between the two frames so the user sees a brief flash.

B) **Synchronous draw + clearRect** — Draw particles and call `clearRect` in the same synchronous execution context (no rAF at all). No browser paint occurs between draw and clear, so the flash is invisible. Canvas remains blank.

C) **Single rAF draw only — no clear** — Draw particles in one rAF frame; rely on the next `detectedNote` event (or component unmount) to clear the canvas. Particles remain frozen on screen until the next note.

[Answer]: B

---

### Question 2
**Resilience Pattern — Zero-width keyboard guard**

`PianoKeyboard` initialises `totalWidth = 0`. The ResizeObserver fires after the first paint, setting the real width. During this brief window (first render with `totalWidth === 0`), `getAllKeyGeometry(0)` returns rects with zero/invalid dimensions.

A) **Early return null** — `if (totalWidth === 0) return null;` at the top of the render function. The component renders nothing until the ResizeObserver provides a real width. No SVG or keys are mounted on the first render.

B) **Render container only** — When `totalWidth === 0`, render the scrollable `<div ref={containerRef}>` but omit the `<svg>` element. The ResizeObserver attaches and fires; then the SVG renders with real geometry.

C) **Eager read on mount** — In a `useLayoutEffect`, read `containerRef.current.clientWidth` synchronously before the first paint and set `totalWidth`. The ResizeObserver remains as the ongoing update mechanism. Eliminates the zero-width frame but adds a layout effect.

[Answer]: B

---
