# PianoVora — Requirements Verification Questions

The PRD (v1.0) is comprehensive and well-structured. The questions below address gaps and ambiguities that will directly affect implementation decisions. Please answer each question by filling in the letter choice after the `[Answer]:` tag. If none of the options match your needs, choose the last option (Other) and describe your preference.

---

## Question 1
**Language: TypeScript or JavaScript?**

The PRD specifies React 18 + Vite but does not indicate whether to use TypeScript or plain JavaScript. This decision affects type safety, tooling, and long-term maintainability.

A) TypeScript — strict typing throughout (recommended for a production-grade app with audio and canvas code)
B) JavaScript — plain JS with JSDoc comments for IDE hints
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
**Pitch Detection: Library or Custom YIN Implementation?**

The PRD specifies the YIN algorithm but does not clarify whether to use an existing open-source library or write a custom implementation.

A) Use an existing battle-tested library (e.g. `pitchy` — a lightweight YIN/McLeod browser library)
B) Implement YIN from scratch in the app codebase (full control, no external dependency)
C) Use WebAssembly port for maximum performance (e.g. aubio compiled to WASM)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
**Keyboard Rendering: SVG or HTML Canvas?**

The PRD states "SVG or HTML Canvas" for keyboard rendering (KB-06). These have different trade-offs for animation, accessibility, and interactivity.

A) HTML Canvas — single canvas for both keyboard and sparkle animations (simpler pipeline, best for 60fps effects)
B) SVG keyboard + Canvas overlay for sparkle animations (SVG gives accessible DOM nodes per key; Canvas layer handles glow effects)
C) Pure SVG with CSS animations for all effects
D) Other (please describe after [Answer]: tag below)

[Answer]: B, choose best animation effects

---

## Question 4
**State Management Approach?**

For managing audio state, detected note, theme selection, and UI state across components.

A) React Context API + useReducer (built-in, no extra dependency)
B) Zustand (lightweight external store, minimal boilerplate)
C) No formal state management — prop drilling + local state (suitable for small apps)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
**"Should Have" Features — Include in v1.0 Initial Build?**

Several requirements are marked "Should Have" (not "Must Have"). Which should be included in the initial implementation?

The Should Have items are:
- KB-05: Clickable/tappable keys for testing visuals without audio
- VF-06: Colour theme selector (3+ neon palettes: Cyber, Aurora, Sunset)
- UI-04: Sensitivity slider for noise gate threshold
- UI-06: Onboarding modal on first visit
- UI-07: Note history panel (last 5 notes)

A) Include ALL Should Have items in the initial build
B) Include only KB-05 (clickable keys) and VF-06 (theme selector) — the most user-visible
C) Include only KB-05 (clickable keys) — minimal extra scope
D) Exclude ALL Should Have items — strict Must Have only for v1.0
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
**Mobile Portrait Support for v1.0?**

The PRD scopes "responsive for desktop and tablet" (UI-05: 768px+) but also lists Mobile Safari and Chrome Android as supported browsers (Section 7.3). This creates some ambiguity about phone portrait mode.

A) Desktop and tablet only (768px+ minimum width) — as stated in UI-05
B) Include phone portrait (360px+) — full mobile-first responsive layout
C) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7
**Testing Framework?**

The PRD requires >70% code coverage (NFR) but does not specify a testing framework.

A) Vitest + React Testing Library + Playwright (recommended for Vite projects — fast unit tests + browser e2e)
B) Jest + React Testing Library (more familiar to most React developers)
C) Vitest + React Testing Library only (unit/component tests, no e2e automation)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
**Deployment Target?**

The PRD lists "Vercel / Netlify" as options. Do you have a preference?

A) Vercel (excellent Vite/React support, automatic preview deployments on PR)
B) Netlify (strong static site hosting, form handling if needed later)
C) No preference — choose whichever is simpler to configure
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 9
**Neon Colour Palette Names — Confirmed?**

VF-06 mentions palette examples "Cyber, Aurora, Sunset." Are these the confirmed theme names, or just examples?

A) Confirmed — use exactly Cyber, Aurora, and Sunset as the three palette names
B) Examples only — I will define the actual palettes and names during design
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10: Security Extension

Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 11: Property-Based Testing Extension

Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: B
