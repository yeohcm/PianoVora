# Integration Test Instructions — PianoVora

## Scope

PianoVora is a single-package SPA — all units share one process and communicate through Zustand. "Integration" means testing data flows across unit boundaries through the shared store, without heavy mocking of collaborators.

**Playwright e2e deferred** (NFR-Requirements Q2=C). Integration tests run in Vitest + RTL.

---

## Integration Scenarios

### Scenario 1: Pitch Detection → PianoKeyboard Highlight

**Boundary**: Unit 2 (`usePitchDetector` / `pitchSlice`) → Unit 3 (`PianoKeyboard`)

**What is tested**: When `pitchSlice.detectedNote` is set in the Zustand store, `PianoKeyboard` reads it via selector and highlights the correct key.

**Setup**: Render `PianoKeyboard` inside a container with a known width (e.g. 1200px via `ResizeObserver` mock). Set `detectedNote` directly in the store.

**Test steps**:
1. Render `<PianoKeyboard />` with mocked ResizeObserver firing `contentRect.width = 1200`
2. Call `useAppStore.getState().setDetectedNote(noteA4)` where `noteA4.keyIndex = 48`
3. Assert `screen.getByTestId('key-48')` has `fill="var(--neon-white-key)"`
4. Call `useAppStore.getState().setDetectedNote(null)`
5. Assert key-48 returns to default fill

**Expected results**: Key highlight updates within the same render cycle.

**Covered by**: `PianoKeyboard.test.tsx` "key highlighting" suite (already implemented, tests key-highlighting flow end-to-end without mocking the store).

---

### Scenario 2: Theme Selection → CSS Variable Application

**Boundary**: Unit 3 (`ThemeSelector` → `uiSlice`) → Unit 3 (`ThemeProvider` → CSS vars)

**What is tested**: Clicking a `ThemeSelector` button updates `uiSlice.theme`, which `ThemeProvider` picks up via selector and writes the corresponding CSS custom properties to `document.documentElement`.

**Setup**: Render `<ThemeProvider><ThemeSelector /></ThemeProvider>` with jsdom.

**Test steps**:
1. Render the composed tree with default theme (`cyber`)
2. Assert `document.documentElement.style.getPropertyValue('--neon-white-key')` equals `#00f3ff`
3. Simulate click on the Aurora button (testid `theme-btn-aurora`)
4. Assert `--neon-white-key` equals `#a8ff3e`
5. Assert `uiSlice.theme` is now `'aurora'`

**Expected results**: Store update and CSS vars update atomically within the same React commit.

**Covered by**: `ThemeProvider.test.tsx` and `ThemeSelector.test.tsx` (test independently with store interaction; run both to verify the full chain).

---

### Scenario 3: Onboarding Dismiss Flow

**Boundary**: Unit 4 (`AppLayout.handleDismiss`) → `uiSlice.onboardingDismissed` → `OnboardingModal` (unmounts) + `localStorage`

**What is tested**: Full dismiss lifecycle — store write, localStorage write, modal unmount — triggered by a single button click in `AppLayout`.

**Setup**: `AppLayout.test.tsx` with localStorage mocked via `vi.stubGlobal`.

**Test steps**:
1. Render `<AppLayout />` with `onboardingDismissed: false` in store
2. Assert `onboarding-modal` is visible
3. Click `onboarding-dismiss-btn`
4. Assert `useAppStore.getState().onboardingDismissed === true`
5. Assert `mockSetItem` was called with `('pianovora_onboarding_dismissed', 'true')`
6. Assert `onboarding-modal` is no longer in the DOM

**Expected results**: All three side effects (store, localStorage, DOM) occur in the same user interaction.

**Covered by**: `AppLayout.test.tsx` "dismiss flow" suite (already implemented).

---

### Scenario 4: localStorage Initialisation → Zero Flash-of-Modal

**Boundary**: `uiSlice.createUiSlice` (module load) → `AppLayout` (first render)

**What is tested**: When a returning user's localStorage has `'pianovora_onboarding_dismissed': 'true'`, the Zustand store initialises with `onboardingDismissed: true` so `AppLayout` never renders `OnboardingModal` on first paint.

**Setup**: Mock localStorage before creating the store; call `createUiSlice` directly.

**Test steps**:
1. Set up mock localStorage: `getItem('pianovora_onboarding_dismissed') → 'true'`
2. Call `createUiSlice(set, get, api)` to get initial state
3. Assert `initialState.onboardingDismissed === true`
4. Render `<AppLayout />` with a store initialised from that state
5. Assert `onboarding-modal` is never present in the DOM

**Expected results**: Modal never renders — zero flash — because the store starts with the correct value.

**Covered by**: `uiSlice.test.ts` "localStorage initialisation" suite + `AppLayout.test.tsx` "OnboardingModal conditional rendering".

---

## Running Integration Scenarios

All integration scenarios above are already covered by the existing unit test suite. Run them together:

```bash
# Run all tests that exercise cross-unit data flows
npm test -- --run --reporter=verbose src/__tests__/features/keyboard/PianoKeyboard.test.tsx src/__tests__/features/ui/AppLayout.test.tsx src/__tests__/store/uiSlice.test.ts src/__tests__/features/ui/ThemeProvider.test.tsx src/__tests__/features/ui/ThemeSelector.test.tsx
```

---

## Post-v1: Playwright End-to-End Tests

Playwright smoke tests are deferred to post-v1 (NFR-Requirements Q2=C). When implemented, the three planned tests are:

1. **Golden path**: App loads → mic mock allowed → keyboard renders → note history visible
2. **Permission denied**: ErrorBanner appears → demo click lights a key
3. **Theme switch**: Clicking Aurora button updates `--neon-white-key` CSS var on `<html>`

Reference: `aidlc-docs/construction/unit4-ui-shell-features/nfr-requirements/nfr-requirements.md` for Playwright scope details.
