# PianoVora — Story Generation Plan

## Context
- **Source**: Requirements document at `aidlc-docs/inception/requirements/requirements.md`
- **PRD**: `docs/PianoVora_PRD_v1.0.md`
- **Personas (from PRD)**: The Beginner (7–16), The Adult Returner (25–45), The Self-Taught Learner (18–35), The Music Teacher
- **Scope**: All Must Have + all Should Have features approved in requirements

---

## Planning Questions

Please answer each question by filling in the letter after the `[Answer]:` tag.

---

### Question 1
**Story Organisation Approach**

How should user stories be organised?

A) Feature-Based — stories grouped by system feature (Audio Capture, Pitch Detection, Keyboard Display, Visual Feedback, UI Controls). Easiest to map to implementation units.
B) Persona-Based — stories grouped by user type (stories for Beginner, for Adult Returner, etc.). Keeps user motivation central.
C) User Journey-Based — stories follow the end-to-end user flow (arrive → grant permission → practice → see feedback → adjust settings). Best for UAT.
D) Epic-Based — high-level epics (e.g. "Audio Pipeline", "Visual Experience") containing sub-stories. Best for sprint planning.
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
**Acceptance Criteria Format**

What format should acceptance criteria use?

A) Given / When / Then (Gherkin-style) — structured, directly usable as Playwright test scenarios
B) Bullet-point checklist — simpler, easier to read but less structured
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3
**Story Granularity**

How fine-grained should individual stories be?

A) Fine-grained — one story per discrete user action or outcome (e.g. separate stories for "see note name on key" and "see glow fade out"). More stories, easier to estimate and test.
B) Medium — one story per feature area (e.g. one story covers the entire neon visual feedback experience). Fewer stories, broader scope per story.
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 4
**Music Teacher Persona**

The PRD defines the Music Teacher as a persona. Should dedicated stories be written for the teacher use case, or should teacher scenarios be covered within the existing learner-focused stories?

A) Dedicated teacher stories — write separate stories from the teacher's perspective (e.g. "As a music teacher, I want to use the visual keyboard as a demonstration aid in lessons")
B) Learner stories only — the teacher uses the app in the same way as learners; no separate teacher-specific stories needed for v1.0
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Story Generation Checklist (Part 2 — executed after plan approval)

- [x] Step 1: Generate `aidlc-docs/inception/user-stories/personas.md`
  - [x] The Beginner persona
  - [x] The Adult Returner persona
  - [x] The Self-Taught Learner persona
  - [x] The Music Teacher persona (if Q4 = A)
- [x] Step 2: Generate `aidlc-docs/inception/user-stories/stories.md`
  - [x] Organise by approach chosen in Q1 (Feature-Based)
  - [x] Apply acceptance criteria format from Q2 (Given/When/Then)
  - [x] Apply granularity from Q3 (Medium — one story per feature area)
  - [x] Cover all Must Have features: Audio Capture (AC-01–05), Pitch Detection (PD-01–07), Keyboard (KB-01–06), Visual Feedback (VF-01–07), UI (UI-01–03, UI-05)
  - [x] Cover all Should Have features promoted to Must Have: UI-04 (sensitivity slider), UI-06 (onboarding modal), UI-07 (note history), KB-05 (clickable keys), VF-06 (theme selector)
  - [x] Cover error/edge-case user flows: microphone denied, audio dropout, low-signal noise gate
  - [x] Verify each story meets INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable)
  - [x] Map personas to each story
- [x] Step 3: Update `aidlc-docs/aidlc-state.md` — mark User Stories complete
- [x] Step 4: Update `aidlc-docs/audit.md` with completion log entry
