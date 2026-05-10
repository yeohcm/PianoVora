# Unit 4: UI Shell & Features — Business Rules

---

## Layout & Responsive Design (UI)

### BR-01: Single-Column Top-Down Layout (Q1=A)
- **Rule**: AppLayout renders in a fixed single-column structure: header row → ErrorBanner (conditional) → PianoKeyboard → NoteHistoryPanel. No sidebar.
- **Source**: Q1=A; UI-05

### BR-02: Minimum Viewport Width 360px
- **Rule**: The layout must be fully usable at 360px viewport width. Header controls wrap to a second row on viewports narrower than 600px. The keyboard scrolls horizontally internally.
- **Source**: UI-05

### BR-03: Header Controls Wrap Order
- **Rule**: When header controls wrap to a second row (< 600px), the wrap order is: Row 1: logo + MicToggle + AudioLevelMeter; Row 2: SensitivitySlider + ThemeSelector.
- **Source**: UI-05; mobile-first layout

### BR-04: Dark Theme Background
- **Rule**: The root layout background is deep navy/black (`#0a0a0f` or equivalent). This is set on `<body>` or the AppLayout root div, not via Tailwind `bg-gray-*`.
- **Source**: UI-01

### BR-05: PianoKeyboard Takes Remaining Height
- **Rule**: The keyboard section uses `flex-grow` (or equivalent) to consume available vertical space between the header and the NoteHistoryPanel, making the keyboard as tall as possible.
- **Source**: UI-01; visual design

---

## Onboarding Modal (UI-06)

### BR-06: Modal Shown Only on First Visit (Q2=A)
- **Rule**: `OnboardingModal` renders only when `uiSlice.onboardingDismissed === false`.
- **Source**: UI-06

### BR-07: localStorage Key
- **Rule**: localStorage key is `'pianovora_onboarding_dismissed'`. Value is the string `'true'` when dismissed.
- **Source**: UI-06

### BR-08: localStorage Read on Mount
- **Rule**: On `AppLayout` mount (or `App.tsx`), `localStorage.getItem('pianovora_onboarding_dismissed')` is read. If `=== 'true'`, `setOnboardingDismissed(true)` is called immediately, suppressing the modal before first render.
- **Source**: UI-06; prevents flash of modal on returning users

### BR-09: Dismiss Writes localStorage
- **Rule**: When the "Got it" button is clicked, `setOnboardingDismissed(true)` is called AND `localStorage.setItem('pianovora_onboarding_dismissed', 'true')` is written in the same handler.
- **Source**: UI-06

### BR-10: No Backdrop Dismiss
- **Rule**: Clicking outside the modal does NOT dismiss it. Only the "Got it" button dismisses.
- **Rationale**: Prevents accidental close when users are reading the content.
- **Source**: UX best practice

### BR-11: Modal Content (Q2=A — Minimal Intro)
- **Rule**: Modal contains exactly:
  - Title: "Welcome to PianoVora"
  - Bullet list (4 items): (1) real-time key detection, (2) click keys for demo mode, (3) 3 neon themes, (4) last 5 notes in history panel
  - One button: "Got it" (`data-testid="onboarding-dismiss-btn"`)
- **Source**: Q2=A

### BR-12: Modal Traps Focus
- **Rule**: When the modal is open, keyboard focus is trapped within the modal dialog. The "Got it" button receives initial focus on modal open.
- **Source**: WCAG 2.1 AA (2.1.2 No Keyboard Trap)

---

## Error Banner (UI-02/AC-03)

### BR-13: Banner Shown for Denied and Error States (Q3=A)
- **Rule**: `ErrorBanner` renders when `audioSlice.permissionState === 'denied'` OR `permissionState === 'error'`. Hidden for `'idle'` and `'granted'`.
- **Source**: AC-03; Q3=A

### BR-14: Non-Blocking Placement (Q3=A)
- **Rule**: `ErrorBanner` is placed below the header row, above the `PianoKeyboard` section. It does not overlay or block the keyboard. Demo mode remains fully accessible while banner is shown.
- **Source**: Q3=A

### BR-15: Error Messages by State
- **Rule**:
  - `'denied'`: "Microphone access denied. Allow microphone access in your browser settings, then refresh."
  - `'error'`: "Could not access your microphone. Check that no other app is using it, then refresh."
  - Both include sub-text: "You can still click the piano keys to explore in demo mode."
- **Source**: AC-03

### BR-16: No Dismiss Button on Banner
- **Rule**: The error banner has no close/dismiss button. It persists for the session while `permissionState` remains in the error state.
- **Rationale**: The error is actionable only by the user leaving and granting permission; premature dismissal would hide a persistent problem.

### BR-17: Banner Has data-testid="error-banner"
- **Rule**: The root element of `ErrorBanner` carries `data-testid="error-banner"` and `role="alert"` for screen reader announcement.
- **Source**: WCAG 2.1 AA (4.1.3 Status Messages)

---

## Note History Panel (UI-07)

### BR-18: Last 5 Notes, Most Recent First (Q4=A)
- **Rule**: `NoteHistoryPanel` displays up to 5 items from `pitchSlice.noteHistory`. The most recent note is shown first (index 0).
- **Source**: UI-07

### BR-19: Display: Note Name + Octave Only (Q4=A)
- **Rule**: Each history item shows `noteName + octave` (e.g. "G#4", "C4", "A0"). No frequency, no timestamp.
- **Source**: Q4=A

### BR-20: Empty State Placeholder
- **Rule**: When `noteHistory` is empty, the panel shows the text "Play a note to see history" (`data-testid="history-empty-state"`).
- **Source**: UI-07; UX requirement (no blank panel)

### BR-21: History Panel Has data-testid
- **Rule**: Each note item carries `data-testid="history-item-{index}"` (index 0 = most recent).
- **Source**: Test automation

### BR-22: Teacher Clicks Do Not Appear in History
- **Rule**: `NoteHistoryPanel` displays only `pitchSlice.noteHistory` which is populated by `usePitchDetector` (audio detection only). Teacher key clicks write to `detectedNote` but not `noteHistory` (BR-28 from Unit 3).
- **Source**: BR-28 (Unit 3); confirmed by Unit 2 design

---

## Theme Persistence (Unit 4 extension of Unit 3)

### BR-23: Theme Persisted to localStorage
- **Rule**: On every `setTheme(t)` call, `localStorage.setItem('pianovora_theme', t)` is written. On app mount, if `localStorage.getItem('pianovora_theme')` is a valid `NeonTheme`, `setTheme` is called with that value before first render.
- **Source**: BR-22 (Unit 3) stated persistence is Unit 4's responsibility

### BR-24: localStorage Theme Key
- **Rule**: Key is `'pianovora_theme'`. Valid stored values: `'cyber'`, `'aurora'`, `'sunset'`. Any other value is ignored (default `'cyber'` applies).
- **Source**: BR-23

---

## Deployment (Netlify)

### BR-25: SPA Routing via _redirects
- **Rule**: `public/_redirects` contains `/* /index.html 200` so all paths serve the React app (prevents 404 on direct URL access or browser refresh).
- **Source**: NFR-S-02; Netlify SPA pattern

### BR-26: netlify.toml Build Command
- **Rule**: `netlify.toml` specifies `command = "npm run build"`, `publish = "dist"`. No server-side functions.
- **Source**: NFR-S-02; Netlify static hosting

### BR-27: HTTPS Enforced by Netlify
- **Rule**: Netlify enforces HTTPS on all custom domains automatically. No additional configuration required in Unit 4 code.
- **Source**: NFR-S-02

---

## Accessibility (NFR-A)

### BR-28: All Interactive Elements Have ARIA Labels
- **Rule**: Every button, input, and interactive element in Unit 4 components has `aria-label` or visible text label. AppLayout itself has no ARIA role (it is not a landmark beyond its semantic HTML).
- **Source**: NFR-A-02; WCAG 2.1 AA

### BR-29: OnboardingModal Uses role="dialog"
- **Rule**: `OnboardingModal` root element carries `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal title's `id`.
- **Source**: WCAG 2.1 AA (4.1.2)

### BR-30: ErrorBanner Uses role="alert"
- **Rule**: `ErrorBanner` root element carries `role="alert"` so screen readers announce the error immediately when it appears.
- **Source**: WCAG 2.1 AA (4.1.3)

### BR-31: Main Landmark Structure
- **Rule**: `AppLayout` renders a `<header>`, `<main>`, and optionally a `<footer>` or `<section>` for the note history. This provides a landmark navigation structure for screen reader users.
- **Source**: WCAG 2.1 AA (1.3.1 Info and Relationships)
