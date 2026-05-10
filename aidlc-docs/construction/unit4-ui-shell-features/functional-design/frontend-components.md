# Unit 4: UI Shell & Features — Frontend Components

---

## Component 1: App

**File**: `src/App.tsx`

**Responsibility**: Root component. Wraps `ThemeProvider` (Unit 3) around `AppLayout`. No state, no effects.

**Render**:
```typescript
export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
```

**`data-testid`**: none (wrapper only)

---

## Component 2: AppLayout

**File**: `src/features/ui/AppLayout.tsx`

**Responsibility**: Composes all units into the single-column responsive layout. Hosts both hooks (`useAudioEngine`, `usePitchDetector`). Manages localStorage reads/writes for onboarding and theme persistence. Passes props to pure presentational children.

**Zustand reads**:
```typescript
const permissionState        = useAppStore((s) => s.permissionState);
const onboardingDismissed    = useAppStore((s) => s.onboardingDismissed);
const setOnboardingDismissed = useAppStore((s) => s.setOnboardingDismissed);
const noteHistory            = useAppStore((s) => s.noteHistory);
const theme                  = useAppStore((s) => s.theme);
```

**Hooks called**:
```typescript
const { analyserRef } = useAudioEngine();
usePitchDetector({ analyserRef });
```

**Effects**:
```typescript
// Read localStorage on mount — restore onboarding and theme state
useEffect(() => {
  if (localStorage.getItem('pianovora_onboarding_dismissed') === 'true') {
    setOnboardingDismissed(true);
  }
  const savedTheme = localStorage.getItem('pianovora_theme');
  if (savedTheme === 'cyber' || savedTheme === 'aurora' || savedTheme === 'sunset') {
    useAppStore.getState().setTheme(savedTheme);
  }
}, [setOnboardingDismissed]);

// Persist theme to localStorage on every change
useEffect(() => {
  localStorage.setItem('pianovora_theme', theme);
}, [theme]);
```

**Dismiss handler**:
```typescript
function handleDismiss(): void {
  setOnboardingDismissed(true);
  localStorage.setItem('pianovora_onboarding_dismissed', 'true');
}
```

**Render structure**:
```typescript
<div
  className="min-h-screen flex flex-col bg-[#0a0a0f] text-white"
  data-testid="app-layout"
>
  {/* Header */}
  <header
    className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/10"
    data-testid="app-header"
  >
    <span className="font-bold text-lg tracking-wide mr-auto">PianoVora</span>
    <MicToggle />
    <AudioLevelMeter />
    <SensitivitySlider />
    <ThemeSelector />
  </header>

  {/* Error banner (conditional) */}
  {(permissionState === 'denied' || permissionState === 'error') && (
    <ErrorBanner permissionState={permissionState} />
  )}

  {/* Main keyboard area */}
  <main className="flex-1 flex flex-col overflow-hidden" data-testid="app-main">
    <PianoKeyboard />
  </main>

  {/* Note history */}
  <NoteHistoryPanel notes={noteHistory} />

  {/* Onboarding modal (conditional) */}
  {!onboardingDismissed && (
    <OnboardingModal onDismiss={handleDismiss} />
  )}
</div>
```

**`data-testid` attributes**:
- `app-layout` — root div
- `app-header` — header element

---

## Component 3: OnboardingModal

**File**: `src/features/ui/OnboardingModal.tsx`

**Responsibility**: First-visit intro modal (Q2=A — minimal). No local state. Controlled by parent via `onDismiss` prop.

**Props**:
```typescript
interface OnboardingModalProps {
  onDismiss: () => void;
}
```

**Render structure**:
```typescript
{/* Backdrop */}
<div
  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
  data-testid="onboarding-backdrop"
>
  {/* Dialog */}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="onboarding-title"
    className="bg-[#12121e] border border-white/20 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
    data-testid="onboarding-modal"
  >
    <h2 id="onboarding-title" className="text-2xl font-bold mb-4">
      Welcome to PianoVora
    </h2>
    <ul className="space-y-2 mb-6 text-white/80">
      <li>Play a note — the matching piano key lights up in real time</li>
      <li>Click any key to try demo mode without a microphone</li>
      <li>Switch between Cyber, Aurora, and Sunset neon themes</li>
      <li>Your last 5 notes appear in the history panel below the keyboard</li>
    </ul>
    <button
      onClick={onDismiss}
      autoFocus
      className="w-full py-3 rounded-lg font-semibold bg-[var(--neon-accent)] text-black"
      data-testid="onboarding-dismiss-btn"
    >
      Got it
    </button>
  </div>
</div>
```

**Accessibility**:
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby="onboarding-title"` (BR-29)
- `autoFocus` on the dismiss button traps initial focus (BR-12)
- No backdrop click dismiss (BR-10)

**`data-testid` attributes**:
- `onboarding-backdrop` — outer overlay
- `onboarding-modal` — dialog container
- `onboarding-dismiss-btn` — "Got it" button

---

## Component 4: ErrorBanner

**File**: `src/features/ui/ErrorBanner.tsx`

**Responsibility**: Non-blocking informational banner (Q3=A). Pure presentational — no state, no effects. Receives `permissionState` as prop.

**Props**:
```typescript
interface ErrorBannerProps {
  permissionState: 'denied' | 'error';
}
```

**Message map**:
```typescript
const MESSAGES = {
  denied: {
    primary: 'Microphone access denied. Allow microphone access in your browser settings, then refresh.',
    secondary: 'You can still click the piano keys to explore in demo mode.',
  },
  error: {
    primary: 'Could not access your microphone. Check that no other app is using it, then refresh.',
    secondary: 'You can still click the piano keys to explore in demo mode.',
  },
};
```

**Render structure**:
```typescript
<div
  role="alert"
  className="px-4 py-3 bg-amber-900/40 border-b border-amber-500/40 flex items-start gap-3"
  data-testid="error-banner"
>
  <span aria-hidden="true">⚠</span>
  <div>
    <p className="font-medium">{MESSAGES[permissionState].primary}</p>
    <p className="text-sm text-white/60 mt-1">{MESSAGES[permissionState].secondary}</p>
  </div>
</div>
```

**Accessibility**: `role="alert"` announces immediately to screen readers (BR-30).

**`data-testid`**: `error-banner`

---

## Component 5: NoteHistoryPanel

**File**: `src/features/ui/NoteHistoryPanel.tsx`

**Responsibility**: Displays last 5 notes (Q4=A — note name + octave only). Pure presentational. No Zustand reads — receives data via props.

**Props**:
```typescript
interface NoteHistoryPanelProps {
  notes: DetectedNote[];   // max 5, index 0 = most recent
}
```

**Render structure**:
```typescript
<section
  aria-label="Note history"
  className="px-4 py-3 border-t border-white/10 flex items-center gap-4"
  data-testid="note-history-panel"
>
  <span className="text-xs text-white/40 uppercase tracking-widest shrink-0">
    History
  </span>

  {notes.length === 0 ? (
    <span
      className="text-sm text-white/30 italic"
      data-testid="history-empty-state"
    >
      Play a note to see history
    </span>
  ) : (
    <ol className="flex gap-3 list-none">
      {notes.map((note, i) => (
        <li
          key={i}
          className="text-lg font-mono font-bold"
          style={{ opacity: 1 - i * 0.15 }}
          data-testid={`history-item-${i}`}
        >
          {note.noteName}{note.octave}
        </li>
      ))}
    </ol>
  )}
</section>
```

**Fading opacity**: Each successive note fades slightly (`opacity: 1 - i * 0.15`) to indicate recency — most recent is fully opaque.

**`data-testid` attributes**:
- `note-history-panel` — section wrapper
- `history-empty-state` — placeholder when empty
- `history-item-{0..4}` — individual note items (index 0 = most recent)

---

## Component Interaction Summary

```
App
  └── ThemeProvider (reads uiSlice.theme; writes CSS vars)
        └── AppLayout
              ├── useAudioEngine() → analyserRef (Unit 1)
              ├── usePitchDetector({ analyserRef }) (Unit 2)
              │
              ├── [header]
              │     ├── MicToggle (Unit 1) — reads/writes audioSlice.isListening
              │     ├── AudioLevelMeter (Unit 1) — reads audioSlice.audioLevel
              │     ├── SensitivitySlider (Unit 1) — reads/writes audioSlice.noiseGateThreshold
              │     └── ThemeSelector (Unit 3) — reads/writes uiSlice.theme
              │
              ├── ErrorBanner? — prop: permissionState ('denied'|'error')
              │
              ├── [main]
              │     └── PianoKeyboard (Unit 3)
              │           └── CanvasOverlay (Unit 3)
              │
              ├── NoteHistoryPanel — prop: notes (pitchSlice.noteHistory)
              │
              └── OnboardingModal? — prop: onDismiss → sets uiSlice + localStorage
```

**localStorage keys used by Unit 4**:
- `'pianovora_onboarding_dismissed'` → `'true'` when dismissed
- `'pianovora_theme'` → `'cyber'` | `'aurora'` | `'sunset'`
