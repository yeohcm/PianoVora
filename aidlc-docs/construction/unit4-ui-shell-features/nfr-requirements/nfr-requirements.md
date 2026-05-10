# Unit 4: UI Shell & Features — NFR Requirements

---

## Performance

### NFR-P1: Page Load Under 2s on 10Mbps (Q3=A)
- **Requirement**: The app shall load and render within 2 seconds on a 10Mbps connection.
- **Current state**: Build output is ~153KB gzipped (~49KB JS + ~2KB CSS). At 10Mbps that is ~0.12s transfer — well within budget.
- **Decision**: No explicit Vite `manualChunks` or lazy loading. Accept Vite defaults.
- **Monitoring**: If bundle size exceeds 500KB gzipped in future, revisit splitting.
- **Source**: NFR-P-01; Q3=A

### NFR-P2: No Blocking Renders from localStorage
- **Requirement**: localStorage reads on mount must not block the first React render.
- **Rule**: `localStorage.getItem` calls are synchronous but fast (< 1ms). They execute inside a `useEffect` that fires after the first paint — no blocking risk.
- **Source**: NFR-P-01; React render model

---

## Reliability

### NFR-R1: localStorage Fault Tolerance (Q1=A)
- **Requirement**: All `localStorage.getItem` and `localStorage.setItem` calls must be wrapped in a `try/catch`. On error, the app continues with in-memory Zustand state only — no crash, no visible error to the user.
- **Rule**:
  ```typescript
  function safeGetItem(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }
  function safeSetItem(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { /* silently swallow */ }
  }
  ```
- **Affected calls**: onboarding dismissed read/write, theme read/write (4 call sites in AppLayout).
- **Source**: Q1=A; Safari private browsing compatibility

### NFR-R2: Graceful Fallback When Mic Unavailable (NFR-R-02)
- **Requirement**: When `permissionState === 'denied'` or `'error'`, the keyboard demo mode remains fully functional. ErrorBanner renders (BR-13) but does not block interaction.
- **Rule**: `PianoKeyboard` is always rendered; teacher click writes to `pitchSlice.detectedNote` regardless of `permissionState`.
- **Source**: NFR-R-02; BR-14

---

## Accessibility

### NFR-A1: WCAG 2.1 AA — Structural Landmarks (NFR-A-01)
- **Requirement**: `AppLayout` must render semantic HTML landmarks: `<header>`, `<main>`, and a `<section>` or `<footer>` for note history.
- **Rule**: Landmark regions allow screen reader users to jump directly to the keyboard or history panel.
- **Source**: NFR-A-01; BR-31; WCAG 1.3.1

### NFR-A2: WCAG 2.1 AA — Dialog Accessibility (NFR-A-01)
- **Requirement**: `OnboardingModal` must use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and auto-focus the dismiss button on open.
- **Source**: NFR-A-01; BR-29; WCAG 4.1.2

### NFR-A3: WCAG 2.1 AA — Alert Announcement (NFR-A-01)
- **Requirement**: `ErrorBanner` must use `role="alert"` so screen readers announce errors immediately without requiring focus.
- **Source**: NFR-A-01; BR-30; WCAG 4.1.3

### NFR-A4: Keyboard Navigation Through All Controls (NFR-A-03)
- **Requirement**: All header controls (MicToggle, SensitivitySlider, ThemeSelector buttons) must be reachable and operable via Tab + Enter/Space. No keyboard traps outside the OnboardingModal.
- **Source**: NFR-A-03; WCAG 2.1.1

### NFR-A5: Focus Trap in OnboardingModal (NFR-A-03)
- **Requirement**: While `OnboardingModal` is open, Tab must cycle only within the modal. The backdrop and underlying content must not receive focus.
- **Implementation**: The modal has a single interactive element ("Got it" button), so `autoFocus` on that button is sufficient — no additional focus trap library needed.
- **Source**: NFR-A-03; BR-12; WCAG 2.1.2

---

## Testing

### NFR-T1: No Playwright E2E for v1 (Q2=C)
- **Decision**: Playwright e2e tests are deferred. Unit and component tests provide sufficient coverage for v1.
- **Rationale**: Q2=C accepted — Playwright adds CI infrastructure complexity without commensurate v1 benefit. Playwright files listed in unit-of-work.md are created as empty stubs (or omitted) in this iteration.
- **Source**: Q2=C

### NFR-T2: Component Tests Cover All Conditional Renders
- **Requirement**: Unit tests for `AppLayout` must cover:
  - ErrorBanner shown when `permissionState === 'denied'` / `'error'`; hidden otherwise
  - OnboardingModal shown when `onboardingDismissed === false`; hidden when true
  - NoteHistoryPanel receives correct `notes` prop
- **Source**: NFR-M-01 (>70% coverage)

### NFR-T3: localStorage Mock in Tests
- **Requirement**: All tests that exercise AppLayout's localStorage effects must mock `localStorage` via `vi.stubGlobal` or direct property replacement. Tests must not read/write real browser localStorage.
- **Source**: Test isolation; Vitest jsdom environment

### NFR-T4: OnboardingModal Accessibility Tested
- **Requirement**: `OnboardingModal` tests must verify `role="dialog"`, `aria-modal="true"`, and that the dismiss button has `autoFocus`.
- **Source**: NFR-A1; BR-29

---

## Maintainability

### NFR-M1: safeGetItem / safeSetItem Helpers
- **Requirement**: localStorage fault-tolerance helpers (`safeGetItem`, `safeSetItem`) are defined in `AppLayout.tsx` as module-level functions (not exported — used only by this component).
- **Rationale**: Avoids repetitive try/catch at each call site; keeps the `useEffect` bodies readable.
- **Source**: NFR-R1; Q1=A

### NFR-M2: No Playwright Stubs Committed
- **Decision**: The `src/__tests__/e2e/` directory and stub files listed in unit-of-work.md are not created in this iteration.
- **Source**: Q2=C; NFR-T1
