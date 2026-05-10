# PianoVora — Product Requirements Document

**Version:** 1.0
**Status:** Draft
**Date:** May 2026
**Author:** Product Team
**Classification:** Internal — Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Objectives](#2-goals--objectives)
3. [Problem Statement](#3-problem-statement)
4. [Users & Target Personas](#4-users--target-personas)
5. [Scope](#5-scope)
6. [Features & Requirements](#6-features--requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [UX Design Principles](#8-ux-design-principles)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Phased Roadmap](#10-phased-roadmap)
11. [Assumptions & Constraints](#11-assumptions--constraints)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Launch Acceptance Criteria](#13-launch-acceptance-criteria)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

PianoVora is a browser-based web application designed to enhance the piano practice experience through real-time audio analysis and immersive visual feedback. The application listens to notes played on any acoustic or digital piano via the device microphone, identifies the pitch using audio signal processing, and displays the corresponding piano key on an animated on-screen keyboard with sparkling neon colour effects.

The product targets beginner to intermediate piano learners who benefit from immediate, engaging visual reinforcement as they practise. PianoVora requires no hardware beyond a browser-enabled device with a microphone and delivers a zero-install, accessible experience.

---

## 2. Goals & Objectives

### 2.1 Business Goals

- Establish PianoVora as a leading free-to-use piano practice companion tool.
- Build a user base of piano learners as a foundation for premium feature monetisation.
- Demonstrate product-market fit within three months of launch via active user retention.

### 2.2 Product Objectives

- Deliver sub-100ms note detection latency for a responsive, real-time feel.
- Achieve >95% accuracy for single-note recognition across the standard 88-key piano range.
- Provide a visually compelling neon keyboard display that functions across all modern browsers.
- Ensure the app is accessible and functional on both desktop and mobile devices.

### 2.3 Success Metrics

| Metric | Target | Timeframe |
|---|---|---|
| Note detection accuracy (single notes) | >95% | At launch |
| Average latency (mic to visual feedback) | <100ms | At launch |
| Browser compatibility | Chrome, Firefox, Safari, Edge | At launch |
| Session duration (avg) | >10 minutes | Month 1 |
| Monthly active users | 5,000+ | Month 3 |
| User-reported satisfaction (CSAT) | >4.0 / 5.0 | Month 3 |

---

## 3. Problem Statement

Piano learners — particularly beginners — often practise in isolation without access to real-time feedback from an instructor. Traditional practice relies on sheet music and self-assessment, which can be slow and discouraging. Existing apps focus primarily on guided lessons or MIDI-based tools that require specialised hardware.

There is no widely available, browser-native tool that listens to an acoustic or standard digital piano and provides immediate, visually engaging key-highlighting feedback without MIDI cables or app downloads. PianoVora fills this gap.

---

## 4. Users & Target Personas

| Persona | Description | Primary Need |
|---|---|---|
| **The Beginner** | Age 7–16, learning piano for the first time with or without a teacher. | Fun, immediate feedback to stay motivated. |
| **The Adult Returner** | Age 25–45, picking up piano again after a break. | Quick confirmation they are hitting the right notes. |
| **The Self-Taught Learner** | Age 18–35, learning via YouTube or apps without formal tuition. | A free, browser-accessible practice companion. |
| **The Music Teacher** | Teaches beginner students; looking for tools to use in lessons. | A visual aid to demonstrate note positions interactively. |

---

## 5. Scope

### 5.1 In Scope (v1.0)

- Real-time microphone audio capture via Web Audio API.
- Pitch detection using autocorrelation or YIN algorithm (no server-side processing).
- Full 88-key on-screen piano keyboard rendering.
- Neon sparkling visual animation on detected key(s).
- Display of note name (e.g. C4, F#3) alongside the highlighted key.
- Support for single-note recognition.
- Microphone permission request and error handling.
- Responsive layout for desktop and tablet.
- Browser-based: no installation, no login required.

### 5.2 Out of Scope (v1.0)

- Polyphonic (chord) recognition — deferred to v2.
- Sheet music display or score following.
- MIDI device input (USB/Bluetooth) — deferred to v2.
- Practice session recording or history.
- User accounts or cloud sync.
- Gamification or scoring engine.
- Native mobile application (iOS/Android).

---

## 6. Features & Requirements

### 6.1 Audio Capture & Permissions

| ID | Requirement | Priority |
|---|---|---|
| AC-01 | The app shall request microphone access via the browser's getUserMedia API on load. | Must Have |
| AC-02 | A clear permission prompt and explanation must appear before access is requested. | Must Have |
| AC-03 | If permission is denied, the app shall display a helpful error message with instructions. | Must Have |
| AC-04 | Audio capture shall run at a minimum sample rate of 44,100 Hz. | Must Have |
| AC-05 | The user shall be able to stop and restart audio capture from the UI. | Must Have |

### 6.2 Pitch Detection Engine

| ID | Requirement | Priority |
|---|---|---|
| PD-01 | The app shall detect the fundamental frequency of incoming audio in real time. | Must Have |
| PD-02 | Detection shall cover the full piano range: A0 (27.5 Hz) to C8 (4,186 Hz). | Must Have |
| PD-03 | Pitch detection shall execute entirely client-side with no server round-trip. | Must Have |
| PD-04 | Detection latency from audio input to visual output shall be under 100ms. | Must Have |
| PD-05 | The engine shall apply a noise gate to suppress ambient noise below a configurable threshold. | Must Have |
| PD-06 | Accuracy shall exceed 95% for clean single-note input in normal room conditions. | Must Have |
| PD-07 | The detected frequency shall be mapped to the nearest equal-temperament MIDI note. | Must Have |

### 6.3 On-Screen Piano Keyboard

| ID | Requirement | Priority |
|---|---|---|
| KB-01 | The app shall render a full 88-key piano keyboard spanning A0 to C8. | Must Have |
| KB-02 | White and black keys shall be visually accurate in proportion and layout. | Must Have |
| KB-03 | Octave markers (C1–C8) shall be displayed below the corresponding C keys. | Must Have |
| KB-04 | The keyboard shall scroll horizontally on smaller screens; the active key shall remain centred. | Must Have |
| KB-05 | Keys shall be clickable/tappable so users can test visuals without audio input. | Should Have |
| KB-06 | The keyboard shall be rendered using SVG or HTML Canvas for smooth animation. | Must Have |

### 6.4 Neon Visual Feedback

| ID | Requirement | Priority |
|---|---|---|
| VF-01 | When a note is detected, the corresponding key shall immediately illuminate with a neon colour. | Must Have |
| VF-02 | The neon effect shall include an animated sparkle/glow animation (CSS or Canvas-based). | Must Have |
| VF-03 | White keys and black keys shall use distinct neon colour palettes (e.g. cyan vs magenta). | Must Have |
| VF-04 | The neon glow shall fade out smoothly within ~1 second after the note stops sounding. | Must Have |
| VF-05 | The detected note name and octave (e.g. G#4) shall appear as an overlay on the lit key. | Must Have |
| VF-06 | A colour theme selector shall offer at least 3 neon palette options (e.g. Cyber, Aurora, Sunset). | Should Have |
| VF-07 | Animations shall run at 60fps without frame drops on modern hardware. | Must Have |

### 6.5 User Interface & Experience

| ID | Requirement | Priority |
|---|---|---|
| UI-01 | The interface shall use a dark theme to maximise neon visual contrast. | Must Have |
| UI-02 | A prominent on/off toggle shall control microphone listening. | Must Have |
| UI-03 | A real-time audio level meter shall indicate that the microphone is active. | Must Have |
| UI-04 | A sensitivity slider shall allow adjustment of the noise gate threshold. | Should Have |
| UI-05 | The layout shall be responsive and usable on screens from 768px width upward. | Must Have |
| UI-06 | An onboarding modal shall introduce features on first visit. | Should Have |
| UI-07 | The app shall display the note history (last 5 notes) in a sidebar or panel. | Should Have |

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend Framework | React 18 + Vite | Fast HMR, component model suits keyboard UI. |
| Audio Processing | Web Audio API (native browser) | Low-latency, no server round-trip. |
| Pitch Detection | YIN algorithm (client-side JS) | High accuracy, open-source, real-time capable. |
| Visualisation | HTML Canvas / CSS animations | 60fps rendering; sparkle effects via Canvas. |
| Styling | Tailwind CSS + custom CSS vars | Rapid dark-theme development; neon palettes via CSS custom properties. |
| Deployment | Static hosting (Vercel / Netlify) | Zero-server cost; global CDN. |

### 7.2 Audio Processing Pipeline

The audio pipeline operates entirely in-browser through the following stages:

1. Microphone input captured via `getUserMedia()` at 44.1kHz.
2. Audio routed through an `AnalyserNode` with an FFT size of 2048.
3. Time-domain waveform buffer extracted per animation frame (~60fps).
4. RMS amplitude checked against noise gate threshold.
5. YIN pitch detection run on the buffer to extract fundamental frequency.
6. Frequency converted to MIDI note number (A4 = 440Hz reference).
7. MIDI note mapped to piano key index and octave.
8. Key highlight and sparkle animation triggered on Canvas layer.

### 7.3 Browser Compatibility

| Browser | Min Version | Web Audio API | getUserMedia | Status |
|---|---|---|---|---|
| Chrome | 90+ | Full | Full | ✅ Supported |
| Firefox | 90+ | Full | Full | ✅ Supported |
| Safari | 14.1+ | Partial | Full (HTTPS only) | ✅ Supported |
| Edge (Chromium) | 90+ | Full | Full | ✅ Supported |
| Mobile Safari (iOS) | 14.5+ | Partial | HTTPS only | ✅ Supported |
| Chrome Android | 90+ | Full | Full | ✅ Supported |

---

## 8. UX Design Principles

- **Dark-first design:** deep navy/black background to maximise neon contrast and reduce eye strain during practice.
- **Zero friction:** no sign-up, no install. The user arrives and begins practising immediately.
- **Delight through motion:** the neon sparkle effect should feel celebratory — it reinforces the note hit.
- **Clarity over clutter:** one keyboard, one note at a time. The UI steps back so the music takes centre stage.
- **Accessible audio cues:** visual fallback descriptions for users with colour vision deficiencies.

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Page load under 2 seconds on a 10Mbps connection. Audio pipeline initialises within 500ms of permission grant. |
| **Security** | No audio data transmitted off-device. HTTPS required for all deployments (getUserMedia constraint). |
| **Privacy** | No microphone data stored or logged. Privacy policy to clearly state audio is processed locally only. |
| **Accessibility** | WCAG 2.1 AA compliance. Keyboard navigable. Screen reader labels on all interactive elements. |
| **Reliability** | App shall remain functional if audio input drops transiently; auto-reconnect within 1 second. |
| **Scalability** | Static deployment — scales to unlimited concurrent users without infrastructure changes. |
| **Maintainability** | Code coverage >70%. Modular audio and UI components with documented interfaces. |

---

## 10. Phased Roadmap

| Phase | Version | Features | Target |
|---|---|---|---|
| Foundation | v1.0 | Single-note detection, full 88-key neon keyboard, dark UI, colour themes. | Month 1–2 |
| Expansion | v1.5 | Note history panel, sensitivity controls, onboarding modal, mobile optimisation. | Month 3 |
| Chords & MIDI | v2.0 | Polyphonic chord detection, MIDI USB/BLE input, chord name display. | Month 4–6 |
| Practice Tools | v2.5 | Scale highlighter, practice mode with target notes, session stats. | Month 7–9 |
| Social & Premium | v3.0 | User accounts, session recordings, shareable clips, premium themes. | Month 10–12 |

---

## 11. Assumptions & Constraints

### 11.1 Assumptions

- Users will access the app over HTTPS (required for microphone access on most browsers).
- The acoustic environment will have moderate ambient noise; professional isolation is not assumed.
- Users are playing a standard equal-temperament piano tuned to A4 = 440Hz.
- The device microphone is positioned within 1–3 metres of the piano.

### 11.2 Constraints

- Web Audio API availability limits some features on older Safari versions.
- Client-side pitch detection has inherent limitations with polyphonic audio; chords deferred to v2.
- No budget for external audio ML APIs in v1 — all processing must be client-side.
- HTTPS is mandatory; HTTP deployments will not support microphone access.

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| High ambient noise degrades detection accuracy. | Medium | High | Configurable noise gate; onboarding guidance on mic placement. |
| Safari Audio API limitations cause inconsistent behaviour. | Medium | Medium | Safari-specific polyfills; prominent browser compatibility warning. |
| 60fps Canvas animations cause performance issues on low-end devices. | Low | Medium | Reduced-motion mode; CSS fallback animations. |
| Users expect chord detection in v1. | High | Low | Clear roadmap communication on landing page. |
| Microphone permission refusal blocks core functionality. | Medium | High | Clear permission UX; graceful fallback to manual keyboard demo mode. |

---

## 13. Launch Acceptance Criteria

The following criteria must be met before v1.0 production release:

1. Note detection accuracy tested on 50 standard piano notes achieves >95% correct identification.
2. End-to-end latency from key strike to neon highlight measured at <100ms on Chrome/desktop.
3. Full 88-key keyboard renders correctly and is scrollable on a 768px-wide viewport.
4. Neon sparkle animation runs at sustained 60fps on a mid-range laptop (2020 or newer).
5. App passes WCAG 2.1 AA automated accessibility audit (axe or similar).
6. Privacy review confirms zero audio data leaves the device.
7. Successful end-to-end testing on Chrome 110+, Firefox 110+, Safari 16+, Edge 110+.
8. User acceptance testing with 5 piano learners confirms intuitive use without instruction.

---

## 14. Appendix

### A. Glossary

| Term | Definition |
|---|---|
| **Pitch Detection** | The process of identifying the fundamental frequency of an audio signal. |
| **YIN Algorithm** | A widely used time-domain pitch estimation algorithm well-suited for monophonic instruments. |
| **MIDI Note Number** | A numeric code (0–127) representing musical notes; Middle C (C4) = 60. |
| **Web Audio API** | A browser-native API for audio processing and synthesis without plugins. |
| **Neon Effect** | CSS/Canvas glow, bloom, and sparkle animations that simulate luminous neon lighting. |
| **Noise Gate** | A signal processing technique that silences audio below a defined amplitude threshold. |
| **Polyphonic** | Audio containing multiple simultaneous notes (e.g. chords). |
| **Monophonic** | Audio containing a single note at a time — the v1.0 detection target. |

### B. Reference Documents

- Web Audio API Specification — W3C
- YIN: A Fundamental Frequency Estimator for Speech and Music (de Cheveigne & Kawahara, 2002)
- MIDI Tuning Standard — MIDI Manufacturers Association
- WCAG 2.1 Accessibility Guidelines — W3C

---

*End of Document — PianoVora PRD v1.0*
