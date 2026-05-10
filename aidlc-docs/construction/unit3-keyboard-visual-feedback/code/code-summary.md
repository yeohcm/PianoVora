# Unit 3: Keyboard & Visual Feedback — Code Summary

## Source Files

| File | Type | Purpose |
|---|---|---|
| `src/store/uiSlice.ts` | Created | NeonTheme type, UiState interface, createUiSlice |
| `src/store/appStore.ts` | Modified | Extended AppState to include UiState, composed createUiSlice |
| `src/features/ui/ThemeProvider.tsx` | Created | THEME_DEFINITIONS constant; applies 4 CSS vars to document.documentElement |
| `src/features/ui/ThemeSelector.tsx` | Created | 3 theme buttons with aria-pressed; writes uiSlice.setTheme |
| `src/features/keyboard/PianoKeyboard.tsx` | Created | 88-key SVG keyboard; key highlighting; note label overlay; teacher click; scroll |
| `src/features/keyboard/CanvasOverlay.tsx` | Created | Canvas host; DPR-scaled ResizeObserver; delegates to useSparkleAnimation |
| `src/features/keyboard/useSparkleAnimation.ts` | Created | rAF loop; 12-particle spawn; gravity arc; reduced-motion branch; cleanup |

## Test Files

| File | Tests |
|---|---|
| `src/__tests__/store/uiSlice.test.ts` | Default state, setTheme transitions, PBT theme sequences |
| `src/__tests__/features/ui/ThemeProvider.test.tsx` | CSS var application for all 3 themes, children rendering |
| `src/__tests__/features/ui/ThemeSelector.test.tsx` | Button render, aria-pressed, click handler, labels |
| `src/__tests__/features/keyboard/PianoKeyboard.test.tsx` | Zero-width guard, 88 keys, highlight, label, teacher click, scroll, reduced motion |
| `src/__tests__/features/keyboard/CanvasOverlay.test.tsx` | Canvas mount, aria-hidden, pointer-events, DPR sizing |
| `src/__tests__/features/keyboard/useSparkleAnimation.test.ts` | Spawn, loop, reduced-motion, cleanup |

## Key NFR Patterns Implemented

| Pattern | Location |
|---|---|
| Self-terminating rAF loop | `useSparkleAnimation.ts` |
| Reduced-motion sync draw+clearRect (Q1=B) | `useSparkleAnimation.ts` spawn effect |
| Key geometry useMemo([totalWidth]) (Q4=B) | `PianoKeyboard.tsx` |
| Zero-width guard — render container only (Q2=B) | `PianoKeyboard.tsx` |
| Canvas DPR scaling — Math.round(px × dpr) | `CanvasOverlay.tsx` |
| ResizeObserver cleanup on unmount | `PianoKeyboard.tsx`, `CanvasOverlay.tsx` |
| Zustand selector isolation | All components |

## data-testid Attributes

| Attribute | Element |
|---|---|
| `piano-keyboard-container` | Scrollable wrapper div |
| `piano-keyboard-svg` | SVG element |
| `key-{0..87}` | Each key rect |
| `active-key-label` | Note name SVG text overlay |
| `canvas-overlay` | Canvas element |
| `theme-selector` | Theme button group |
| `theme-btn-cyber` / `theme-btn-aurora` / `theme-btn-sunset` | Individual theme buttons |

## Stories Implemented

| Story | Description | Files |
|---|---|---|
| FEAT-03 | On-Screen Keyboard | PianoKeyboard.tsx |
| FEAT-04 | Neon Visual Feedback | PianoKeyboard.tsx, CanvasOverlay.tsx, useSparkleAnimation.ts |
| FEAT-05 | Colour Theme Selection | uiSlice.ts, appStore.ts, ThemeProvider.tsx, ThemeSelector.tsx |
| FEAT-10 | Teacher Demonstration | PianoKeyboard.tsx (handleKeyClick) |
