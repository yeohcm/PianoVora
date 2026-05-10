# Unit 4: UI Shell & Features — Logical Components

---

## Component 1: LocalStorageGuard

**Lives in**: `uiSlice.ts` (module-level `safeReadItem`) + `AppLayout.tsx` (module-level `safeGetItem` / `safeSetItem`)

**Responsibility**: Isolates all localStorage access behind try/catch. Two independent instances — one in the slice for initial reads, one in AppLayout for runtime writes.

**uiSlice instance** (read-only, used at store initialisation):
```typescript
function safeReadItem(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}
```

**AppLayout instance** (read + write, used in effects and handlers):
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

**Contract**: Returns `null` on any storage error; callers treat `null` as "not set" and apply defaults.

**NFR link**: NFR-R1; Pattern 1 + 2

---

## Component 2: StoreInitialisedFromStorage

**Lives in**: `uiSlice.ts` — initial values read inside `createUiSlice` factory (Q2=A)

**Responsibility**: Ensures the Zustand store initialises with persisted user preferences (theme, onboarding state) before the first React render. Eliminates the flash-of-modal for returning users.

**Initialisation logic**:
```typescript
const VALID_THEMES = new Set(['cyber', 'aurora', 'sunset']);
const storedTheme  = safeReadItem('pianovora_theme');
const initialTheme = VALID_THEMES.has(storedTheme ?? '') ? storedTheme! as NeonTheme : 'cyber';
const initialOnboardingDismissed =
  safeReadItem('pianovora_onboarding_dismissed') === 'true';
```

**Contract**: Executes once at module load. Safe under React Strict Mode (synchronous, no side effects beyond reading storage). If localStorage is unavailable, initialises with defaults (`'cyber'`, `false`).

**NFR link**: NFR-R1; Pattern 2

---

## Component 3: ThemePersistenceEffect

**Lives in**: `AppLayout.tsx` — `useEffect([theme])`

**Responsibility**: Writes the current theme to localStorage on every theme change so the preference survives page reload.

```typescript
useEffect(() => {
  safeSetItem('pianovora_theme', theme);
}, [theme]);
```

**Contract**: Fires on mount (writes current theme) and on every `setTheme` call. If storage fails, the in-memory theme state remains correct; only persistence is lost.

**NFR link**: BR-23; Pattern 1

---

## Component 4: OnboardingDismissHandler

**Lives in**: `AppLayout.tsx` — `handleDismiss` function + `OnboardingModal` `onDismiss` prop

**Responsibility**: Orchestrates the two writes required to dismiss onboarding: Zustand state update + localStorage write.

```typescript
function handleDismiss(): void {
  setOnboardingDismissed(true);
  safeSetItem('pianovora_onboarding_dismissed', 'true');
}
```

**Contract**: Called exactly once (when user clicks "Got it"). After this call, `onboardingDismissed === true` in Zustand → modal unmounts → returning users see the store initialised with `true` on next visit.

**NFR link**: BR-09; Pattern 1

---

## Component 5: EscapeSuppressor

**Lives in**: `OnboardingModal.tsx` — `handleKeyDown` on the dialog container (Q1=B)

**Responsibility**: Prevents Escape key from closing the modal. The user must explicitly click "Got it".

```typescript
function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
  if (e.key === 'Escape') e.preventDefault();
}
```

**Contract**: Applied to `onKeyDown` on the dialog `<div>`. Does not affect Tab or other keys. `autoFocus` on the "Got it" button still applies.

**NFR link**: BR-10; Pattern 3; Q1=B

---

## Component 6: LandmarkLayout

**Lives in**: `AppLayout.tsx` render structure

**Responsibility**: Provides semantic HTML landmark regions so screen reader users can jump between major sections.

| Element | Landmark | Content |
|---|---|---|
| `<header>` | Banner | Logo, MicToggle, AudioLevelMeter, SensitivitySlider, ThemeSelector |
| `<main>` | Main | PianoKeyboard |
| `<section aria-label="Note history">` | Named section | NoteHistoryPanel |
| `ErrorBanner role="alert"` | Live region | Conditional error message |
| `OnboardingModal role="dialog"` | Dialog | Onboarding content |

**NFR link**: NFR-A1; BR-31; Pattern 4

---

## Component 7: AlertLiveRegion

**Lives in**: `ErrorBanner.tsx`

**Responsibility**: Ensures screen readers announce the permission error immediately when it appears in the DOM, without requiring focus movement.

**Contract**: `role="alert"` must be on the *root element* of `ErrorBanner`. The component must be *conditionally rendered* (not hidden with CSS) so the DOM insertion triggers the live region announcement.

```typescript
{(permissionState === 'denied' || permissionState === 'error') && (
  <ErrorBanner permissionState={permissionState} />   // inserted → role=alert fires
)}
```

**NFR link**: NFR-A3; BR-30; Pattern 5

---

## Interaction Summary

```
uiSlice.ts (module load)
  └── StoreInitialisedFromStorage
        reads: localStorage → initialTheme, initialOnboardingDismissed
        writes: Zustand initial state (before first render)

AppLayout (mount)
  └── ThemePersistenceEffect
        reads: uiSlice.theme
        writes: localStorage 'pianovora_theme' via safeSetItem

AppLayout → OnboardingModal (if !onboardingDismissed)
  └── EscapeSuppressor (onKeyDown)
  └── OnboardingDismissHandler (onDismiss prop)
        writes: uiSlice.onboardingDismissed = true
        writes: localStorage 'pianovora_onboarding_dismissed' via safeSetItem

AppLayout → ErrorBanner (if permissionState ∈ {denied, error})
  └── AlertLiveRegion (role="alert" → screen reader announcement)

AppLayout render
  └── LandmarkLayout
        <header> | <main> | <section aria-label="Note history">
```
