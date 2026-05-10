# Unit 4: UI Shell & Features — NFR Design Patterns

---

## Pattern 1: localStorage Fault-Tolerance Helpers

**Applies to**: `AppLayout.tsx` (module level)

**Problem**: `localStorage` throws `SecurityError` in private browsing (Safari) and enterprise environments. Every call site must be guarded without repeating try/catch.

**Pattern**: Two module-level helper functions defined before the component. They are not exported (single consumer).

```typescript
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); }
  catch { /* silently swallow — in-memory state remains correct */ }
}
```

**Usage sites in AppLayout**:
1. Theme persistence write: `useEffect(() => { safeSetItem('pianovora_theme', theme); }, [theme]);`
2. Onboarding dismiss write: `safeSetItem('pianovora_onboarding_dismissed', 'true');` in `handleDismiss`

**Note**: The initial read for onboarding and theme is handled in `createUiSlice` (Pattern 2), not in AppLayout effects.

---

## Pattern 2: Store-Initialised localStorage Read (Q2=A)

**Applies to**: `src/store/uiSlice.ts`

**Problem**: Initialising `onboardingDismissed: false` causes a one-frame flash of the OnboardingModal on returning users when AppLayout reads localStorage in a `useEffect` (after first render).

**Pattern**: Read localStorage synchronously inside `createUiSlice` at module load time. The Zustand store initialises with the correct values immediately — zero flash, no extra effect, no store-localStorage coupling at the component level.

**Decision**: Q2=A — read at module load inside the slice factory.

```typescript
function safeReadItem(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

const VALID_THEMES = new Set(['cyber', 'aurora', 'sunset']);

export const createUiSlice: StateCreator<UiState> = (set) => ({
  theme: (VALID_THEMES.has(safeReadItem('pianovora_theme') ?? '')
    ? safeReadItem('pianovora_theme')! as NeonTheme
    : 'cyber'),
  onboardingDismissed: safeReadItem('pianovora_onboarding_dismissed') === 'true',
  setTheme:               (t) => set({ theme: t }),
  setOnboardingDismissed: (v) => set({ onboardingDismissed: v }),
});
```

**Contract**:
- `safeReadItem` is defined locally in `uiSlice.ts` (not imported from AppLayout — each file owns its own guard)
- If localStorage is unavailable, `safeReadItem` returns `null` → defaults apply (`'cyber'`, `false`)
- If stored theme is unrecognised, defaults to `'cyber'`

---

## Pattern 3: Intentional Modal — Escape Suppressed (Q1=B)

**Applies to**: `OnboardingModal`

**Problem**: WCAG 2.1 recommends that dialogs close on Escape (SC 2.1.2). But the onboarding modal should require a conscious "Got it" click to ensure the user reads the content (BR-10).

**Decision**: Q1=B — Escape key is suppressed with `preventDefault()`. The user must click "Got it" to dismiss.

**Implementation**:
```typescript
function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
  if (e.key === 'Escape') {
    e.preventDefault();  // intentionally suppress — user must read content
  }
}

// Applied to the dialog container:
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="onboarding-title"
  onKeyDown={handleKeyDown}
  ...
>
```

**Rationale**: The modal is informational and shown exactly once per user. Suppressing Escape is intentional UX — not a WCAG violation under SC 2.1.2 when the reason is documented and the only interactable element (the "Got it" button) is focused on open.

---

## Pattern 4: Semantic Landmark Structure

**Applies to**: `AppLayout`

**Problem**: Screen reader users need to jump directly to regions (keyboard, controls, history) without tabbing through all elements.

**Pattern**: `AppLayout` uses native HTML landmark elements:

```
<div data-testid="app-layout">          ← layout root (no landmark role)
  <header>                              ← banner landmark
    logo, MicToggle, AudioLevelMeter, SensitivitySlider, ThemeSelector
  </header>
  <ErrorBanner role="alert" />          ← live region (not a landmark)
  <main>                                ← main landmark
    <PianoKeyboard />
  </main>
  <section aria-label="Note history">   ← named section landmark
    <NoteHistoryPanel />
  </section>
  <OnboardingModal role="dialog" />     ← dialog (not a landmark)
</div>
```

**Why `<section aria-label>` not `<footer>`**: The note history is persistent content below the keyboard, not page-level footer metadata. `<section>` with a label produces a named landmark in screen readers.

---

## Pattern 5: Alert Live Region for ErrorBanner

**Applies to**: `ErrorBanner`

**Problem**: When `permissionState` transitions to `'denied'` or `'error'`, screen readers must announce the error without the user moving focus.

**Pattern**: `role="alert"` causes the element's content to be read immediately by screen readers when it appears in the DOM (implicit `aria-live="assertive"`).

```typescript
<div role="alert" data-testid="error-banner" ...>
  <span aria-hidden="true">⚠</span>
  <p>{MESSAGES[permissionState].primary}</p>
  <p>{MESSAGES[permissionState].secondary}</p>
</div>
```

**Key constraint**: The `role="alert"` element must be *inserted* into the DOM (not pre-rendered with `display:none`) for the live region announcement to trigger. AppLayout renders `<ErrorBanner>` conditionally (`{condition && <ErrorBanner />}`) — correct pattern.

---

## Pattern 6: Responsive Header Wrap

**Applies to**: `AppLayout` header

**Problem**: At 360px viewport width, all header controls (MicToggle, AudioLevelMeter, SensitivitySlider, ThemeSelector) cannot fit on one row.

**Pattern**: `flex-wrap` on the header with natural break order. Controls with `flex-shrink-0` stay on the first row; SensitivitySlider (wider) and ThemeSelector (3 buttons) naturally wrap to a second row on narrow viewports.

```typescript
<header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/10">
  <span className="font-bold text-lg tracking-wide mr-auto">PianoVora</span>
  <MicToggle />           {/* shrink-0, stays row 1 */}
  <AudioLevelMeter />     {/* shrink-0, stays row 1 */}
  <SensitivitySlider />   {/* wraps to row 2 on narrow viewports */}
  <ThemeSelector />       {/* wraps to row 2 on narrow viewports */}
</header>
```

**Why flex-wrap over media query breakpoints**: Simpler, content-driven — wraps exactly when the container can no longer fit the elements, regardless of specific pixel breakpoints.
