# PianoVora — User Stories

**Version**: 1.0  
**Date**: 2026-05-09  
**Organisation**: Feature-Based  
**Acceptance Criteria Format**: Given / When / Then (Gherkin-style)  
**Granularity**: Medium (one story per feature area)  
**INVEST**: All stories verified against Independent, Negotiable, Valuable, Estimable, Small, Testable criteria

---

## FEAT-01: Audio Capture & Permissions

**Story**
> As a piano learner, I want to grant microphone access and control when the app listens, so that I can start and stop my practice session without reloading the page.

**Personas**: Mia (Beginner), James (Adult Returner), Priya (Self-Taught)

**PRD Coverage**: AC-01, AC-02, AC-03, AC-04, AC-05, UI-02, UI-03

**Acceptance Criteria**

*Scenario 1 — Permission prompt on load*
```
Given I open PianoVora for the first time
When the page loads
Then I see a clear explanation of why microphone access is needed
And the browser's microphone permission dialog is triggered
```

*Scenario 2 — Permission granted*
```
Given the microphone permission dialog is shown
When I click Allow
Then the audio capture begins at a sample rate of at least 44,100 Hz
And a real-time audio level meter becomes visible, indicating an active signal
And the on/off toggle shows a listening-active state
```

*Scenario 3 — Permission denied*
```
Given the microphone permission dialog is shown
When I click Deny (or Block)
Then the app displays a clear, friendly error message
And the error message includes step-by-step instructions to grant access via browser settings
And the keyboard is still visible and clickable (demo mode remains available)
```

*Scenario 4 — Stop and restart listening*
```
Given the app is currently listening (audio capture active)
When I click the on/off toggle
Then audio capture stops immediately
And the audio level meter becomes inactive
When I click the toggle again
Then audio capture resumes without requiring a page reload
```

**INVEST Notes**: Independently deployable as the microphone permission flow. Estimable at ~3 story points. Testable via Playwright (browser permission API mocking).

---

## FEAT-02: Pitch Detection

**Story**
> As a piano learner, I want the app to detect the note I'm playing in real time, so that I receive immediate visual feedback as I practise without needing any cables or special hardware.

**Personas**: Mia (Beginner), James (Adult Returner), Priya (Self-Taught)

**PRD Coverage**: PD-01, PD-02, PD-03, PD-04, PD-05, PD-06, PD-07

**Acceptance Criteria**

*Scenario 1 — Note detected within latency target*
```
Given the app is listening and my piano is within 1–3 metres of the microphone
When I press a single piano key clearly
Then the corresponding key on the on-screen keyboard is highlighted within 100ms
```

*Scenario 2 — Full piano range covered*
```
Given the app is listening
When I play any note from A0 (27.5 Hz) to C8 (4,186 Hz)
Then the correct key is identified and highlighted
```

*Scenario 3 — Noise gate suppresses ambient sound*
```
Given the noise gate threshold is set to its default value
When ambient room noise is present but no piano key is pressed
Then no key is highlighted on-screen
And no spurious note detection occurs
```

*Scenario 4 — Note mapped to correct pitch class and octave*
```
Given a C4 (middle C, 261.63 Hz) is played clearly
When the pitch detection runs
Then the app highlights C4 specifically (not B3 or C5)
And the note label reads "C4"
```

**INVEST Notes**: Detection engine isolated from rendering — independently testable with unit tests against the pitchy library. PBT-02 and PBT-03 apply (frequency-to-MIDI round-trip and range invariants).

---

## FEAT-03: On-Screen Keyboard

**Story**
> As a piano learner, I want to see a full 88-key piano keyboard on screen with accurate key proportions, so that I can visually understand note positions and the keyboard feels like a real piano.

**Personas**: Mia (Beginner), James (Adult Returner), Priya (Self-Taught), Mr. Chen (Teacher)

**PRD Coverage**: KB-01, KB-02, KB-03, KB-04, KB-05, KB-06

**Acceptance Criteria**

*Scenario 1 — Full keyboard rendered*
```
Given the app loads successfully
When the keyboard component renders
Then all 88 keys are visible (52 white, 36 black)
And white keys and black keys are proportionally accurate in width and height
And octave markers C1 through C8 appear below the corresponding C keys
```

*Scenario 2 — Active key stays in view on small screens*
```
Given the viewport is 360px wide
When a note is detected (or a key is clicked)
Then the keyboard scrolls horizontally so the active key is centred in view
And no keys are clipped or hidden behind UI elements
```

*Scenario 3 — Key is clickable without audio*
```
Given the app is in demo mode (microphone not active)
When I tap or click any key on the keyboard
Then that key illuminates with the neon visual effect
And the note name overlay appears on that key
```

*Scenario 4 — Keyboard renders across supported viewports*
```
Given any viewport width from 360px to 2560px
When the keyboard renders
Then it is visible and scrollable without layout breakage
And controls above or below the keyboard remain accessible
```

**INVEST Notes**: SVG rendering independent of audio pipeline. Valuable as a standalone visual component usable in demo mode.

---

## FEAT-04: Neon Visual Feedback

**Story**
> As a piano learner, I want the key I play to immediately light up with a neon glow and sparkle effect and show the note name, so that I get engaging, celebratory visual reinforcement every time I hit a note correctly.

**Personas**: Mia (Beginner), James (Adult Returner), Priya (Self-Taught), Mr. Chen (Teacher)

**PRD Coverage**: VF-01, VF-02, VF-03, VF-04, VF-05, VF-07

**Acceptance Criteria**

*Scenario 1 — Key illuminates on detection*
```
Given the app is listening and a note is detected
When the pitch detection identifies the note
Then the corresponding key on the SVG keyboard illuminates with the active theme's neon colour immediately
And a sparkle/glow animation plays on the Canvas overlay at the key's position
```

*Scenario 2 — White and black keys use distinct neon colours*
```
Given the Cyber theme is active
When a white key is detected
Then it illuminates with the white-key neon colour for Cyber (e.g. cyan)
When a black key is detected
Then it illuminates with the black-key neon colour for Cyber (e.g. magenta)
```

*Scenario 3 — Note name overlay appears*
```
Given a key is illuminated
When the glow animation plays
Then the note name and octave (e.g. "G#4") appears as a legible text overlay on or above the lit key
```

*Scenario 4 — Glow fades after note stops*
```
Given a key is illuminated and the note has stopped sounding
When approximately 1 second elapses with no signal detected for that note
Then the neon glow fades out smoothly over ~300ms
And the key returns to its resting (unlit) state
```

*Scenario 5 — Animation performance*
```
Given a mid-range laptop (2020 or newer) is running the app in Chrome
When notes are being detected and animations are running
Then the Canvas animation sustains at least 60fps as measured by the browser's performance tools
```

**INVEST Notes**: Animation layer (Canvas) is separate from detection logic and keyboard SVG — independently developable and testable. Negotiable: sparkle particle count/style can be adjusted without changing the story contract.

---

## FEAT-05: Colour Theme Selection

**Story**
> As a piano learner, I want to choose between three neon colour themes, so that I can personalise my practice environment to match my mood or preference.

**Personas**: James (Adult Returner), Priya (Self-Taught)

**PRD Coverage**: VF-06, UI-01

**Accepted Themes**: Cyber, Aurora, Sunset

**Acceptance Criteria**

*Scenario 1 — Theme selector is visible and functional*
```
Given the app is loaded
When I look at the UI controls
Then I can see a theme selector offering three options: Cyber, Aurora, Sunset
When I select a different theme
Then the neon colour palette applied to key illumination and sparkle effects changes immediately
```

*Scenario 2 — Selected theme persists within session*
```
Given I have selected the Aurora theme
When I stop and restart audio capture
Then the Aurora theme remains active (not reset to default)
```

*Scenario 3 — Themes are visually distinct*
```
Given any two of the three themes
When I switch between them
Then the key illumination colour is noticeably different between themes
And both white-key and black-key neon colours differ per theme
```

**INVEST Notes**: Purely a UI/CSS concern — independent of audio pipeline. Small enough for a single sprint. Testable via visual snapshot tests (Playwright screenshot comparison).

---

## FEAT-06: Sensitivity Control

**Story**
> As a piano learner practising in a noisy environment, I want to adjust the microphone sensitivity threshold, so that background noise doesn't trigger false note detections while I practise.

**Personas**: James (Adult Returner), Priya (Self-Taught)

**PRD Coverage**: PD-05, UI-04

**Acceptance Criteria**

*Scenario 1 — Slider is visible and labelled*
```
Given the app is loaded with microphone active
When I look at the UI controls
Then I can see a sensitivity slider with a clear label
And the slider has a visible current value indicator
```

*Scenario 2 — Increasing threshold suppresses noise*
```
Given the sensitivity slider is at a high threshold value
When ambient noise (below piano volume) is present
Then no key illuminates due to the ambient noise
```

*Scenario 3 — Decreasing threshold picks up quieter notes*
```
Given the sensitivity slider is at a low threshold value
When I play a soft piano note
Then the note is detected and the key illuminates
```

*Scenario 4 — Adjustment is real-time*
```
Given the app is listening
When I move the sensitivity slider
Then the noise gate threshold updates immediately without requiring a restart
```

**INVEST Notes**: Thin UI slice connecting a slider value to the existing noise gate parameter. Independently shippable. Estimable at ~2 points.

---

## FEAT-07: Note History Panel

**Story**
> As a piano learner, I want to see the last 5 notes I have played displayed in a panel, so that I can track my recent note sequence and notice patterns in my playing.

**Personas**: James (Adult Returner), Priya (Self-Taught)

**PRD Coverage**: UI-07

**Acceptance Criteria**

*Scenario 1 — History panel is visible*
```
Given the app is loaded
When I look at the UI
Then I can see a note history panel showing up to 5 entries
And each entry displays the note name and octave (e.g. "C4")
```

*Scenario 2 — Panel updates on each detection*
```
Given the history panel is visible and the app is listening
When a new note is detected
Then the new note appears at the top (or bottom) of the history panel immediately
And if there are already 5 entries, the oldest entry is removed
```

*Scenario 3 — Panel is empty before first note*
```
Given the app has just loaded and no notes have been played
When I look at the history panel
Then it shows an empty state (e.g. "No notes yet" or blank entries)
```

**INVEST Notes**: Isolated UI component reading from shared Zustand state. No dependency on audio pipeline implementation details. Testable with RTL component tests.

---

## FEAT-08: Onboarding Experience

**Story**
> As a first-time visitor, I want to see a helpful introduction to the app when I first open it, so that I understand what PianoVora does and how to get started without reading any documentation.

**Personas**: Mia (Beginner)

**PRD Coverage**: UI-06

**Acceptance Criteria**

*Scenario 1 — Modal shown on first visit*
```
Given I am opening PianoVora for the very first time (no prior visit recorded in localStorage)
When the page loads
Then an onboarding modal appears before the microphone permission prompt
And the modal explains the key features: mic access, keyboard visualisation, neon feedback, and themes
```

*Scenario 2 — Modal can be dismissed*
```
Given the onboarding modal is visible
When I click a "Get Started" or "Dismiss" button
Then the modal closes
And the app proceeds normally (microphone permission prompt appears next)
```

*Scenario 3 — Modal not shown on repeat visits*
```
Given I have previously dismissed the onboarding modal
When I return to PianoVora (same browser, localStorage intact)
Then the onboarding modal does not appear
And the app loads directly to the main interface
```

**INVEST Notes**: Self-contained modal component + localStorage flag. No coupling to audio or keyboard code. Independently developable and testable.

---

## FEAT-09: Error & Fallback Handling

**Story**
> As a piano learner, I want the app to handle audio problems gracefully, so that I can still explore and use the keyboard even when microphone access is unavailable or interrupted.

**Personas**: Mia (Beginner), James (Adult Returner), Priya (Self-Taught), Mr. Chen (Teacher)

**PRD Coverage**: AC-03, AC-05, NFR-R-01, NFR-R-02

**Acceptance Criteria**

*Scenario 1 — Microphone permission permanently denied*
```
Given I have denied microphone access in the browser settings
When PianoVora loads
Then a clear error banner or message explains that microphone access is blocked
And instructions are shown for how to enable access in browser settings
And the keyboard remains visible and fully clickable (demo mode)
```

*Scenario 2 — Audio input drops transiently*
```
Given the app is listening and detecting notes normally
When the microphone input drops (e.g. device sleeps briefly or USB mic disconnects)
Then the app attempts to reconnect automatically within 1 second
And a transient status indicator shows the reconnection attempt
```

*Scenario 3 — Reconnection succeeds*
```
Given the app lost audio input and is attempting reconnection
When the audio device becomes available again within 1 second
Then normal pitch detection resumes automatically
And no user action is required
```

*Scenario 4 — Demo mode fully functional without microphone*
```
Given no microphone is available or permission is denied
When I click any key on the SVG keyboard
Then the neon visual feedback plays as normal (key illuminates, sparkle animation, note name)
And all UI controls (theme selector, note history, sensitivity slider) remain functional
```

**INVEST Notes**: Orthogonal to audio pipeline internals — tests the boundary between the browser API and the app's error handling layer. Covers the microphone-denied UX and the auto-reconnect mechanism.

---

## FEAT-10: Music Teacher Demonstration

**Story**
> As a music teacher, I want to use the interactive on-screen keyboard as a demonstration aid during lessons, so that I can show my students exactly which keys correspond to which notes in an engaging, projected visual format.

**Personas**: Mr. Chen (Music Teacher)

**PRD Coverage**: KB-05, VF-01, VF-02, VF-05

**Acceptance Criteria**

*Scenario 1 — Keys clickable without microphone*
```
Given PianoVora is open on a classroom laptop with no microphone active
When Mr. Chen clicks any key on the SVG keyboard
Then that key illuminates with the active neon theme immediately
And the sparkle animation plays on the Canvas overlay
And the note name and octave label appears on the lit key
```

*Scenario 2 — Multiple keys demonstrable in sequence*
```
Given the keyboard is in demo (click) mode
When Mr. Chen clicks a sequence of keys (e.g. C4, E4, G4)
Then each key illuminates when clicked and fades after ~1 second
And the note history panel records each clicked note in order
```

*Scenario 3 — Visuals legible on projected display*
```
Given the app is displayed on a projector at 1024x768 resolution
When a key is illuminated with the neon effect
Then the key highlight colour and note label are clearly visible from across a classroom
(Acceptance verified via visual review during UAT)
```

*Scenario 4 — Theme can be changed to suit classroom preference*
```
Given the teacher is demonstrating in the classroom
When Mr. Chen selects a different theme (e.g. switches from Cyber to Aurora)
Then the new theme's colours apply immediately to subsequent key clicks
```

**INVEST Notes**: This story reuses FEAT-03 (clickable keys) and FEAT-04 (visual feedback) capabilities — it does not require new backend logic, only the absence of a microphone requirement for the interaction. Valuable as a distinct use case for the teacher persona.

---

## FEAT-11: Sound Playback & Mode Control

**Story**
> As a piano learner or instructor, I want to toggle between listening mode and synthesizer mode so that I can click/press on-screen keys to play synthesized notes client-side without microphone feedback interference.

**Personas**: Mia (Beginner), James (Adult Returner), Priya (Self-Taught), Mr. Chen (Teacher)

**PRD Coverage**: SP-01, SP-02, SP-03, SP-04, SP-05, SP-06

**Acceptance Criteria**

*Scenario 1 — Switching to Synth Mode halts Microphone Listening*
```
Given the application is currently in Mic Mode (microphone active, pitch detection running)
When I click the Mode Toggle to switch to "Synth" Mode
Then the microphone stream is immediately closed or suspended
And the level meter becomes flat/inactive
And the app displays "Synth Mode" active in the UI
```

*Scenario 2 — Playing sounds in Synth Mode*
```
Given the application is in Synth Mode
When I click or focus and press Enter/Space on any virtual keyboard key (e.g. A0)
Then the app synthesizes a monophonic tone corresponding to the key's frequency client-side using Web Audio oscillators
And the key lights up with neon feedback and triggers sparkles on the canvas overlay
And the HUD text overlay displays the note name and frequency
```

*Scenario 3 — Monophonic tone release*
```
Given a note (e.g. C4) is currently playing in Synth Mode
When I click another note (e.g. E4) OR release the clicked key
Then the tone for C4 immediately stops or releases smoothly to avoid audio pops
And the tone for E4 starts playing
```

*Scenario 4 — Mic Mode disables key click sounds*
```
Given the application is in Mic Mode
When I click or focus and press Enter/Space on any virtual keyboard key
Then the key highlights visually on screen
But no synthesized tone is played (remains silent)
```

**INVEST Notes**: Independently testable using standard Vitest mock environments for Web Audio oscillators. Small enough to implement within a single unit.

---

## Story Summary

| ID | Feature Area | Personas | PRD Requirements | Priority |
|---|---|---|---|---|
| FEAT-01 | Audio Capture & Permissions | Beginner, Adult Returner, Self-Taught | AC-01–05, UI-02, UI-03 | Must Have |
| FEAT-02 | Pitch Detection | Beginner, Adult Returner, Self-Taught | PD-01–07 | Must Have |
| FEAT-03 | On-Screen Keyboard | All | KB-01–06 | Must Have |
| FEAT-04 | Neon Visual Feedback | All | VF-01–05, VF-07 | Must Have |
| FEAT-05 | Colour Theme Selection | Adult Returner, Self-Taught | VF-06, UI-01 | Must Have |
| FEAT-06 | Sensitivity Control | Adult Returner, Self-Taught | PD-05, UI-04 | Must Have |
| FEAT-07 | Note History Panel | Adult Returner, Self-Taught | UI-07 | Must Have |
| FEAT-08 | Onboarding Experience | Beginner | UI-06 | Must Have |
| FEAT-09 | Error & Fallback Handling | All | AC-03, NFR-R-01, NFR-R-02 | Must Have |
| FEAT-10 | Music Teacher Demonstration | Music Teacher | KB-05, VF-01, VF-02, VF-05 | Must Have |
| FEAT-11 | Sound Playback & Mode Control | All | SP-01–06 | Must Have |

**Total**: 11 stories | 4 personas | All requirements covered

