# Unit 4: UI Shell & Features — Domain Entities

---

## Entity 1: UiState (Zustand slice — completed)

`onboardingDismissed` was scaffolded in Unit 3 with a stub default of `false`. Unit 4 completes it with localStorage read/write logic.

**No change to the slice interface** — `uiSlice.ts` already has the correct shape:
```typescript
export interface UiState {
  theme:                  NeonTheme;
  onboardingDismissed:    boolean;
  setTheme:               (t: NeonTheme) => void;
  setOnboardingDismissed: (v: boolean) => void;
}
```

**Unit 4 adds**: localStorage read on mount (in `AppLayout`) and localStorage write in `OnboardingModal`'s dismiss handler. The slice itself is unchanged.

---

## Entity 2: AppLayout Internal State

`AppLayout` is a stateless layout container — it reads from Zustand and renders child components. It has no local React state.

**Zustand reads**:
```typescript
const permissionState      = useAppStore((s) => s.permissionState);
const onboardingDismissed  = useAppStore((s) => s.onboardingDismissed);
const setOnboardingDismissed = useAppStore((s) => s.setOnboardingDismissed);
const theme                = useAppStore((s) => s.theme);
const setTheme             = useAppStore((s) => s.setTheme);
```

**Refs**:
```typescript
const analyserRef = useRef<AnalyserNode | null>(null);
```
— passed from `useAudioEngine` to `usePitchDetector` to connect Units 1 and 2.

**Effects in AppLayout**:
1. `useEffect([], [])` — Read `localStorage` on mount; call `setOnboardingDismissed(true)` if key present.
2. `useEffect([theme], [theme])` — Write `localStorage.setItem('pianovora_theme', theme)` on every theme change.

---

## Entity 3: OnboardingModal Internal State

`OnboardingModal` is a controlled component — it has no local state. Its visibility is driven entirely by `uiSlice.onboardingDismissed`.

**Props**:
```typescript
interface OnboardingModalProps {
  onDismiss: () => void;
}
```

**Visibility**: Rendered conditionally by `AppLayout` — `{!onboardingDismissed && <OnboardingModal onDismiss={handleDismiss} />}`.

**`handleDismiss`** (in AppLayout):
```typescript
function handleDismiss(): void {
  setOnboardingDismissed(true);
  localStorage.setItem('pianovora_onboarding_dismissed', 'true');
}
```

---

## Entity 4: ErrorBanner Props

`ErrorBanner` is a pure presentational component — no local state, no Zustand reads. Receives `permissionState` as a prop from `AppLayout`.

```typescript
interface ErrorBannerProps {
  permissionState: 'denied' | 'error';
}
```

`AppLayout` renders `ErrorBanner` only when `permissionState === 'denied' || permissionState === 'error'`:
```typescript
{(permissionState === 'denied' || permissionState === 'error') && (
  <ErrorBanner permissionState={permissionState} />
)}
```

---

## Entity 5: NoteHistoryPanel Props

`NoteHistoryPanel` is a pure presentational component — reads `noteHistory` as a prop from AppLayout (not directly from Zustand), making it easily testable without store setup.

```typescript
interface NoteHistoryPanelProps {
  notes: DetectedNote[];   // max 5, most recent first
}
```

`AppLayout` passes:
```typescript
const noteHistory = useAppStore((s) => s.noteHistory);
// ...
<NoteHistoryPanel notes={noteHistory} />
```

---

## Entity 6: Netlify Configuration Files

**`netlify.toml`** (workspace root):
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**`public/_redirects`**:
```
/* /index.html 200
```

These are static configuration files with no runtime behaviour. They ensure:
- Netlify runs `npm run build` to produce the `dist/` folder
- All SPA routes (direct URL access, browser refresh) serve `index.html`

---

## Entity 7: Application Root Composition

**`src/main.tsx`**:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**`src/App.tsx`**:
```typescript
import { ThemeProvider } from './features/ui/ThemeProvider';
import { AppLayout } from './features/ui/AppLayout';

export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
```

`ThemeProvider` is placed at the root so CSS custom properties are applied to `document.documentElement` before any child renders.

---

## Relationship Summary

```
main.tsx
  └── App.tsx
        └── ThemeProvider (Unit 3) — wraps all; applies CSS vars
              └── AppLayout (Unit 4) — composes everything
                    ├── useAudioEngine() hook (Unit 1) — analyserRef
                    ├── usePitchDetector({ analyserRef }) hook (Unit 2)
                    ├── [header]
                    │     ├── MicToggle (Unit 1)
                    │     ├── AudioLevelMeter (Unit 1)
                    │     ├── SensitivitySlider (Unit 1)
                    │     └── ThemeSelector (Unit 3)
                    ├── ErrorBanner? (Unit 4) — when permissionState ∈ {denied, error}
                    ├── [main]
                    │     └── PianoKeyboard (Unit 3)
                    └── NoteHistoryPanel (Unit 4) — reads noteHistory prop
                    └── OnboardingModal? (Unit 4) — when !onboardingDismissed
```
