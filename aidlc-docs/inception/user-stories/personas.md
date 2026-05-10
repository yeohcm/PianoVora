# PianoVora — User Personas

**Version**: 1.0  
**Date**: 2026-05-09  
**Source**: PRD v1.0 Section 4 + Requirements Analysis

---

## Persona 1: The Beginner

**Name**: Mia  
**Age**: 10  
**Context**: Learning piano for the first time, taking weekly lessons with a teacher. Practises at home on an upright acoustic piano.

| Attribute | Detail |
|---|---|
| **Technical Comfort** | Low — uses apps and YouTube but unfamiliar with browser permissions or audio settings |
| **Primary Goal** | Fun, immediate visual feedback to stay motivated during solo practice |
| **Pain Point** | Practises alone without a teacher present; struggles to know if she is hitting the right notes |
| **Device** | Family tablet (iPad, 768px width) or shared desktop |
| **Session Context** | Short 10–20 minute practice sessions after school |
| **Key Motivator** | The neon sparkle effect feels rewarding — it makes hitting a note feel like an achievement |

**Needs from PianoVora:**
- Onboarding modal that explains what to do on first visit
- Clear, friendly permission prompt for the microphone
- Immediate visual response (<100ms) to keep her engaged
- Large, readable note names on the keyboard
- No configuration required to get started

**Related Stories**: FEAT-01, FEAT-03, FEAT-04, FEAT-08, FEAT-09

---

## Persona 2: The Adult Returner

**Name**: James  
**Age**: 38  
**Context**: Played piano as a teenager, returning after a 15-year break. Practises on a digital keyboard at home in the evenings.

| Attribute | Detail |
|---|---|
| **Technical Comfort** | Medium — comfortable with browsers and apps; understands audio concepts |
| **Primary Goal** | Quick confirmation that he is hitting the right notes without a teacher |
| **Pain Point** | Self-doubt about accuracy; plays in a room with ambient noise from TV or family |
| **Device** | Laptop (1440px desktop) |
| **Session Context** | 20–40 minute evening practice sessions |
| **Key Motivator** | Objective real-time feedback restores confidence without the need for formal lessons |

**Needs from PianoVora:**
- Sensitivity slider to filter ambient noise in a busy home
- Note history panel to review his last few notes and spot patterns
- Visual confirmation that the mic is active and picking up signal
- Ability to stop/restart listening without reloading the page
- Theme options to match his personal aesthetic

**Related Stories**: FEAT-01, FEAT-02, FEAT-05, FEAT-06, FEAT-07, FEAT-09

---

## Persona 3: The Self-Taught Learner

**Name**: Priya  
**Age**: 24  
**Context**: Learning piano entirely through YouTube tutorials and apps, no formal lessons. Uses a 61-key digital keyboard in a small apartment.

| Attribute | Detail |
|---|---|
| **Technical Comfort** | High — early adopter, comfortable with browser permissions, developer-curious |
| **Primary Goal** | A free, browser-accessible practice companion that requires no download or account |
| **Pain Point** | Existing tools either require MIDI hardware or paid subscriptions; nothing works with her acoustic-style digital keyboard out of the box |
| **Device** | MacBook Pro (1280px) and occasionally phone (360px portrait) |
| **Session Context** | Long 45–90 minute sessions; experiments with settings |
| **Key Motivator** | Zero friction — open browser, grant mic, start playing |

**Needs from PianoVora:**
- No login, no install — works immediately
- Works on her phone when the laptop isn't available
- Clickable keys to test visual themes without playing
- All three neon themes to explore
- Sensitivity slider for apartment-level ambient noise control

**Related Stories**: FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05, FEAT-06, FEAT-07

---

## Persona 4: The Music Teacher

**Name**: Mr. Chen  
**Age**: 45  
**Context**: Teaches beginner piano students aged 6–14 at a music school. Uses a laptop connected to a projector during lessons.

| Attribute | Detail |
|---|---|
| **Technical Comfort** | Medium — comfortable with classroom technology but not technical configuration |
| **Primary Goal** | A visual aid to demonstrate which keys correspond to which notes during lessons |
| **Pain Point** | Students struggle to understand note positions on the full 88-key range; physical pointing at a real keyboard is hard to see from across the room |
| **Device** | Laptop (1280px) connected to projector or large monitor |
| **Session Context** | Uses during lessons to demonstrate; may not want microphone active |
| **Key Motivator** | Clicking a key on the projected keyboard lights it up with the note name — students see exactly what he means |

**Needs from PianoVora:**
- Clickable keys work without microphone (demo mode)
- Clear note name labels on illuminated keys
- Neon visuals are visible on a projected display
- No configuration or login required — must work immediately in a classroom setting

**Related Stories**: FEAT-03, FEAT-04, FEAT-09, FEAT-10

---

## Persona–Story Matrix

| Story | Mia (Beginner) | James (Adult Returner) | Priya (Self-Taught) | Mr. Chen (Teacher) |
|---|:---:|:---:|:---:|:---:|
| FEAT-01: Audio Capture | ✓ | ✓ | ✓ | — |
| FEAT-02: Pitch Detection | ✓ | ✓ | ✓ | — |
| FEAT-03: On-Screen Keyboard | ✓ | ✓ | ✓ | ✓ |
| FEAT-04: Neon Visual Feedback | ✓ | ✓ | ✓ | ✓ |
| FEAT-05: Colour Theme Selection | — | ✓ | ✓ | — |
| FEAT-06: Sensitivity Control | — | ✓ | ✓ | — |
| FEAT-07: Note History Panel | — | ✓ | ✓ | — |
| FEAT-08: Onboarding Experience | ✓ | — | — | — |
| FEAT-09: Error & Fallback | ✓ | ✓ | ✓ | ✓ |
| FEAT-10: Teacher Demonstration | — | — | — | ✓ |
