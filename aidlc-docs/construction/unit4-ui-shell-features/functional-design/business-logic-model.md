# Unit 4: UI Shell & Features — Business Logic Model

---

## Flow 1: Application Bootstrap

Executed once on page load in `main.tsx` and `App.tsx`.

```
Browser loads index.html → Vite serves main.tsx bundle
  |
  v
[React.StrictMode renders App]
App.tsx:
  ThemeProvider              ← wraps entire tree; applies CSS vars on mount
    AppLayout                ← renders full UI shell
      |
      ├── usePitchDetector() ← started inside AppLayout (reads audioSlice.isListening)
      ├── useAppStore reads  ← onboardingDismissed, permissionState, noteHistory, theme
      |
      v
[Check localStorage on mount]
if localStorage.getItem('pianovora_onboarding_dismissed') === 'true':
  setOnboardingDismissed(true)   ← suppress modal on return visit
else:
  onboardingDismissed remains false → OnboardingModal renders
```

**Entry point**: `src/main.tsx` — creates React root, renders `<App />`
**Root component**: `src/App.tsx` — wraps `<ThemeProvider>` around `<AppLayout>`
**No router**: single-page, no client-side routing needed

---

## Flow 2: Single-Column Layout Composition (Q1=A)

`AppLayout` renders in a fixed top-down single-column structure regardless of viewport width. The keyboard section scrolls horizontally internally (handled by `PianoKeyboard`).

```
AppLayout (full viewport height, dark background)
  |
  ├── [Header row] — flex row, wraps on narrow viewports
  │     ├── Logo / App name
  │     ├── MicToggle (Unit 1)
  │     ├── AudioLevelMeter (Unit 1)
  │     ├── SensitivitySlider (Unit 1)
  │     └── ThemeSelector (Unit 3)
  |
  ├── [ErrorBanner] — conditionally rendered (permissionState === 'denied' | 'error')
  |
  ├── [PianoKeyboard section] — flex-grow, takes remaining vertical space
  │     PianoKeyboard (Unit 3) — full width; internal horizontal scroll
  |
  └── [NoteHistoryPanel] — fixed height strip below keyboard
        Last 5 notes from pitchSlice.noteHistory
```

**Responsive rule**: Header controls wrap into 2 rows on viewports < 600px; keyboard and note panel remain single-column throughout.

---

## Flow 3: Onboarding Modal Lifecycle (Q2=A)

```
App mounts
  |
  v
[Read localStorage]
key: 'pianovora_onboarding_dismissed'
  |
  ├── value === 'true' → setOnboardingDismissed(true) → modal suppressed
  └── value absent / other → onboardingDismissed remains false → modal shown
        |
        v
      [OnboardingModal renders as a centred dialog overlay]
      Content:
        Title: "Welcome to PianoVora"
        Bullets:
          • Play a note — your piano key lights up in real time
          • Click any key to try demo mode without a microphone
          • Switch neon themes: Cyber, Aurora, Sunset
          • Last 5 notes appear in the history panel below
        Button: "Got it"
        |
        v
      [User clicks "Got it"]
      setOnboardingDismissed(true)
      localStorage.setItem('pianovora_onboarding_dismissed', 'true')
      → modal unmounts
```

**Modal closes on**: "Got it" button click only. No backdrop click dismiss (prevents accidental close).
**Persistence**: localStorage key survives page reload; Zustand state is ephemeral but re-synced from localStorage on next mount.

---

## Flow 4: ErrorBanner Display Logic (Q3=A)

```
permissionState changes in audioSlice (Zustand)
  |
  ├── 'idle' | 'granted' → ErrorBanner not rendered
  ├── 'denied' → ErrorBanner renders with:
  │     Icon: ⚠ (warning)
  │     Message: "Microphone access denied. To use PianoVora with audio, allow microphone
  │              access in your browser settings, then refresh the page."
  │     Sub-message: "You can still click the piano keys to explore in demo mode."
  │     data-testid: "error-banner"
  └── 'error'  → ErrorBanner renders with:
        Icon: ⚠ (warning)
        Message: "Could not access your microphone. Check that no other app is using it,
                 then refresh the page."
        Sub-message: "You can still click the piano keys to explore in demo mode."
        data-testid: "error-banner"
```

**Placement**: Fixed non-blocking banner directly below the header row, above the keyboard section.
**No dismiss button**: Banner persists for the session as long as `permissionState` remains 'denied'/'error'; it disappears if the user refreshes and grants permission.
**Keyboard stays usable**: `PianoKeyboard` teacher-click mode remains fully functional when the banner is shown (Q2=A answer confirms demo mode is always available).

---

## Flow 5: Note History Panel Update

```
pitchSlice.noteHistory changes in Zustand (written by usePitchDetector in Unit 2)
  |
  v
NoteHistoryPanel re-renders with up to 5 items
  |
  For each DetectedNote in noteHistory (most recent first):
    display: noteName + octave (e.g. "G#4")   ← Q4=A: note name + octave only
  |
  If noteHistory is empty:
    display placeholder: "Play a note to see history"
```

**Data source**: `pitchSlice.noteHistory` — already maintained as a max-5 circular buffer by `usePitchDetector` (Unit 2).
**NoteHistoryPanel does not write to the store**: read-only consumer.
**Teacher clicks** (from PianoKeyboard) do NOT appear in history — this is intentional per BR-28 from Unit 3.

---

## Flow 6: Microphone Toggle Interaction

Already implemented in Unit 1 (`useAudioEngine`, `MicToggle`). Unit 4 wires it into `AppLayout`.

```
User clicks MicToggle
  |
  ├── isListening === false → useAudioEngine.start() → getUserMedia → audioSlice updates
  └── isListening === true  → useAudioEngine.stop()  → suspend context → audioSlice updates
        |
        v
  [usePitchDetector] reads isListening (Zustand) → starts/stops rAF loop automatically
```

**`usePitchDetector` mount location**: Inside `AppLayout`. It receives `analyserRef` from a ref passed down from `useAudioEngine` (or reads it from a shared ref). This is the composition point where Units 1 and 2 connect.

---

## Flow 7: localStorage Persistence for Theme (deferred to Unit 4)

Per BR-22 in Unit 3: theme is not persisted in Unit 3. Unit 4 adds optional localStorage persistence for the theme.

```
On app mount (App.tsx or AppLayout):
  savedTheme = localStorage.getItem('pianovora_theme')
  if savedTheme is valid NeonTheme:
    setTheme(savedTheme)

On theme change (ThemeSelector click):
  setTheme(t)                              ← Zustand (already done in Unit 3)
  localStorage.setItem('pianovora_theme', t)  ← Unit 4 adds this
```

**Implementation**: A `useEffect` on `theme` in `AppLayout` (or `App.tsx`) writes to localStorage on every theme change.
