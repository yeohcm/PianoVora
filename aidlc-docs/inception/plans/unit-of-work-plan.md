# PianoVora — Unit of Work Plan

## Context Already Determined (Prior Stages)

The following decomposition decisions are already resolved and do not require further questions:

| Category | Decision | Source |
|---|---|---|
| Story grouping | Feature-based, 4 units matching 10 stories | Workflow Planning + Application Design |
| Unit boundaries | Audio Engine, Pitch Detection, Keyboard & Visual Feedback, UI Shell & Features | Workflow Planning |
| Dependencies | Sequential: Unit 1 → 2 → 3 → 4 | component-dependency.md |
| Team alignment | Single developer (no team coordination needed) | PRD — no team structure mentioned |
| Business domain | Piano practice app — single bounded context | PRD Section 1 |
| Folder structure | Feature-based: `src/features/{audio,pitch,keyboard,ui}/` + `src/shared/` | Application Design (Q4) |
| Shared code | `pianoGeometry.ts` and `types.ts` in `src/shared/` | component-dependency.md |

---

## Remaining Questions

Two decisions affect code generation planning and have not yet been explicitly resolved.

---

### Question 1
**Package Structure**

A Vite React app can be structured as a single package or a monorepo.

A) **Single package** — one `package.json` at the root. All 4 units live in `src/features/` subfolders. Standard for a Vite SPA of this size.
B) **Monorepo** — separate packages per unit (e.g. using pnpm workspaces), each with its own `package.json`. More complex setup; suited for independent deployability.
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 2
**Test File Location**

A) **Colocated** — test files live next to the source files they test: `src/features/audio/useAudioEngine.test.ts`, `src/shared/pianoGeometry.test.ts`. Easy to find; common in Vite/Vitest projects.
B) **Centralised** — all tests in a top-level `src/__tests__/` folder, mirroring the source tree.
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Generation Checklist (Part 2 — executed after plan approval)

- [x] Generate `aidlc-docs/inception/application-design/unit-of-work.md`
  - [x] Unit 1: Audio Engine — scope, components, dependencies, code paths
  - [x] Unit 2: Pitch Detection — scope, components, dependencies, code paths
  - [x] Unit 3: Keyboard & Visual Feedback — scope, components, dependencies, code paths
  - [x] Unit 4: UI Shell & Features — scope, components, dependencies, Netlify config
  - [x] Code organisation strategy (folder layout, shared module rules)
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
  - [x] Dependency matrix (unit-to-unit)
  - [x] Build/test order
  - [x] Shared artefacts list
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
  - [x] Map all 10 stories to their owning unit
  - [x] Map PRD requirement IDs to units
- [x] Update `aidlc-docs/aidlc-state.md`
- [x] Update `aidlc-docs/audit.md`
