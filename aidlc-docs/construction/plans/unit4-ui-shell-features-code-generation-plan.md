# Unit 4: UI Shell & Features — Code Generation Plan

## Unit Context

**Source artifacts**:
- `aidlc-docs/construction/unit4-ui-shell-features/functional-design/`
- `aidlc-docs/construction/unit4-ui-shell-features/nfr-requirements/`
- `aidlc-docs/construction/unit4-ui-shell-features/nfr-design/`

**Key NFR decisions**:
- Q1=B (NFR Design): OnboardingModal Escape suppressed with `e.preventDefault()`
- Q2=A (NFR Design): `createUiSlice` reads localStorage at factory call time (zero flash-of-modal)
- Q1=A (NFR Requirements): localStorage wrapped in try/catch helpers
- Q2=C (NFR Requirements): No Playwright tests for v1
- Q3=A (NFR Requirements): No vite.config manualChunks

---

## Step 1 — Planning

- [x] Read existing source files (uiSlice.ts, App.tsx, main.tsx, MicToggle.tsx, useAudioEngine.ts)
- [x] Read functional design artifacts (frontend-components.md)
- [x] Read NFR design artifacts (nfr-design-patterns.md, logical-components.md)
- [x] Read tech-stack-decisions.md
- [x] Create this plan

---

## Step 2 — Source Code

### Modifications

- [x] `src/store/uiSlice.ts` — add `safeReadItem` helper; initialise `theme` and `onboardingDismissed` from localStorage at factory call time (Q2=A)
- [x] `src/App.tsx` — replace stub with `ThemeProvider` + `AppLayout` composition
- [x] `src/main.tsx` — remove stub comment

### New Files

- [x] `src/features/ui/AppLayout.tsx` — full layout; `safeSetItem` helper; `useEffect([theme])` persistence; `handleDismiss`; all child components composed
- [x] `src/features/ui/NoteHistoryPanel.tsx` — last-5-notes display; opacity fade; empty state
- [x] `src/features/ui/OnboardingModal.tsx` — first-visit modal; `handleKeyDown` suppresses Escape (Q1=B); `autoFocus` on "Got it"
- [x] `src/features/ui/ErrorBanner.tsx` — `role="alert"` banner; denied/error message map

### Deployment

- [x] `netlify.toml` — `command = "npm run build"`, `publish = "dist"`
- [x] `public/_redirects` — `/* /index.html 200`

---

## Step 3 — Tests

### Modifications

- [x] `src/__tests__/store/uiSlice.test.ts` — add localStorage initialisation tests (stored theme, stored onboarding dismissed, invalid/missing values)

### New Test Files

- [x] `src/__tests__/features/ui/AppLayout.test.tsx` — renders landmark regions; ErrorBanner conditional; OnboardingModal conditional; dismiss flow; theme persistence effect
- [x] `src/__tests__/features/ui/NoteHistoryPanel.test.tsx` — empty state; 1–5 notes; opacity fade; testids
- [x] `src/__tests__/features/ui/OnboardingModal.test.tsx` — renders with ARIA; "Got it" calls onDismiss; Escape does NOT call onDismiss; autoFocus
- [x] `src/__tests__/features/ui/ErrorBanner.test.tsx` — role=alert; denied message; error message

---

## Step 4 — Quality Gates

- [x] `tsc --noEmit` — zero TypeScript errors
- [x] `npm run lint` — zero ESLint errors
- [x] `npm run build` — clean production build (173KB / 57KB gzipped)
- [x] `npm test` — 214/214 tests passing (16 test files)

---

## Step 5 — Completion

- [x] Update plan checkboxes
- [x] Update `aidlc-state.md`
- [x] Append to `audit.md`
- [x] Present completion message
