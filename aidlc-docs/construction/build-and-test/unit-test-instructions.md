# Unit Test Execution — PianoVora

## Test Stack

| Tool | Purpose |
|---|---|
| Vitest | Test runner + assertion library |
| React Testing Library | Component rendering and interaction |
| fast-check | Property-Based Testing (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09) |
| jsdom | Browser-environment simulation |

---

## Run All Unit Tests

### Standard Run (non-watch)

```bash
npm test -- --run
```

Expected output:
```
Test Files  16 passed (16)
     Tests  214 passed (214)
```

### Verbose Run (shows each test name)

```bash
npm test -- --reporter=verbose --run
```

### Watch Mode (for development)

```bash
npm test
```

Vitest watches for file changes and reruns relevant tests automatically.

### Run a Single Test File

```bash
npm test -- --run src/__tests__/features/ui/AppLayout.test.tsx
```

---

## Test Coverage by Unit

### Unit 1: Audio Engine

| File | Tests | Coverage areas |
|---|---|---|
| `useAudioEngine.test.ts` | 11 | start/stop, permission states, reconnect, circuit breaker, RMS noise gate |
| `MicToggle.test.tsx` | 9 | mic states, aria-label, keyboard activation |
| `AudioLevelMeter.test.tsx` | 6 | bar fill, peak, aria attributes |
| `SensitivitySlider.test.tsx` | 8 | inverted mapping, store write, aria |

### Unit 2: Pitch Detection

| File | Tests | Coverage areas |
|---|---|---|
| `usePitchDetector.test.ts` | 14 | rAF lifecycle, timestamp gate, clarity threshold, debounce, history |
| `pianoGeometry.test.ts` | 36 | frequency→MIDI, key index, geometry, PBT invariants |

### Unit 3: Keyboard & Visual Feedback

| File | Tests | Coverage areas |
|---|---|---|
| `PianoKeyboard.test.tsx` | 18 | 88-key render, highlight, note label, teacher click, scroll, reduced motion |
| `CanvasOverlay.test.tsx` | 5 | DPR scaling, aria-hidden, pointer-events |
| `useSparkleAnimation.test.ts` | 9 | spawn, rAF loop, reduced-motion branch, cleanup |
| `ThemeProvider.test.tsx` | 7 | CSS var application, theme switching |
| `ThemeSelector.test.tsx` | 8 | aria-pressed, setTheme calls, labels |
| `uiSlice.test.ts` (base) | 14 | state transitions, PBT theme sequences |

### Unit 4: UI Shell & Features

| File | Tests | Coverage areas |
|---|---|---|
| `uiSlice.test.ts` (new) | 8 | localStorage init, stored theme, invalid values, SecurityError |
| `AppLayout.test.tsx` | 17 | landmarks, ErrorBanner conditional, OnboardingModal conditional, dismiss, theme persistence |
| `OnboardingModal.test.tsx` | 11 | ARIA dialog, Escape suppressed, "Got it" click, content |
| `ErrorBanner.test.tsx` | 6 | role=alert, denied/error messages |
| `NoteHistoryPanel.test.tsx` | 7 | empty state, 5-note render, opacity, testids |

**Total: 214 tests across 16 files**

---

## Property-Based Tests (PBT)

PBT is enabled for selected rules (PBT-02, PBT-03, PBT-07, PBT-08, PBT-09):

| Location | PBT Rule | Property Tested |
|---|---|---|
| `pianoGeometry.test.ts` | PBT-02 | Frequency → MIDI round-trip within ±50 cents |
| `pianoGeometry.test.ts` | PBT-03 | `midiNoteToKeyIndex` always in [0, 87] for valid input |
| `pianoGeometry.test.ts` | PBT-03 | `getAllKeyGeometry` always 88 rects, 52 white, 36 black |
| `pianoGeometry.test.ts` | PBT-03/07 | Out-of-range inputs always return null, never throw |
| `uiSlice.test.ts` | PBT-03 | Any theme sequence ends with last value; theme always valid NeonTheme |

Fixed seed (`seed: 42`) for reproducible CI runs.

---

## Fix Failing Tests

If tests fail:

1. Read the test output — Vitest shows the failing assertion, expected vs received, and stack trace.
2. For component tests: ensure mocks in `src/__tests__/setup.ts` are correct (ResizeObserver, matchMedia, etc.).
3. For localStorage tests: verify `vi.stubGlobal` / `vi.unstubAllGlobals` pairing in `beforeEach`/`afterEach`.
4. For PBT failures: Vitest will print the failing example. Add it as a deterministic test case before fixing the property.
