# Unit 4: UI Shell & Features — NFR Design Plan

## Unit Context

**NFR requirements source**: `aidlc-docs/construction/unit4-ui-shell-features/nfr-requirements/`

**Design areas**:
- localStorage fault-tolerance pattern (safeGetItem/safeSetItem)
- OnboardingModal Escape key / focus management
- Mount-time localStorage read timing (flash-of-modal prevention)
- Semantic landmark structure in AppLayout
- ErrorBanner alert announcement pattern

---

## NFR Design Steps

- [x] Analyse NFR requirements artifacts
- [x] Identify design patterns
- [x] Generate questions
- [x] Collect answers
- [x] Generate nfr-design-patterns.md
- [x] Generate logical-components.md

---

## Open Questions

---

### Question 1
**Accessibility Pattern — OnboardingModal Escape key behaviour**

BR-10 specifies no backdrop-click dismiss. WCAG 2.1 (Success Criterion 2.1.2) recommends that dialogs close on Escape key. These two rules are in tension.

A) **Escape closes the modal** — `onKeyDown` listener on the modal container closes on `e.key === 'Escape'`. Consistent with WCAG dialog pattern; users who accidentally open the modal can close it quickly. Overrides BR-10's intent (which was about backdrop *click* only, not Escape).

B) **Escape ignored — "Got it" only** — The modal is intentionally shown once to introduce the app; requiring a conscious button click ensures the user reads the content. Escape is suppressed with `e.preventDefault()` on `keydown` in the modal.

C) **Escape ignored — no preventDefault** — Escape press does nothing (default browser behaviour for non-native dialogs). No special handling needed; the button is the only dismiss path.

[Answer]: B

---

### Question 2
**Resilience Pattern — localStorage read timing (flash-of-modal prevention)**

`uiSlice` initialises `onboardingDismissed: false`. On a returning user's visit, the `useEffect([], [])` in AppLayout reads localStorage and calls `setOnboardingDismissed(true)` — but this fires *after* the first render, causing a single-frame flash of the OnboardingModal before it disappears.

A) **Read localStorage in Zustand initial state** — Pass the initial `onboardingDismissed` value by reading localStorage at `createUiSlice` definition time (module load). Zero flash; no extra effect; clean pattern. Requires the store to access localStorage at import time.

B) **`useEffect([], [])` in AppLayout — accept the single re-render** — The flash is sub-frame (< 16ms on modern hardware) and invisible in practice. Avoids coupling the store to localStorage concerns.

C) **`useLayoutEffect([], [])` in AppLayout** — Runs synchronously after DOM mutations but before paint; eliminates the flash without touching the Zustand store. Acceptable in a Vite SPA (no SSR where `useLayoutEffect` causes warnings).

[Answer]: A

---
