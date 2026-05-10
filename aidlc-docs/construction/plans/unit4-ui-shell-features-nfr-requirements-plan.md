# Unit 4: UI Shell & Features — NFR Requirements Plan

## Unit Context

**Primary NFR concerns**:
- Page load < 2s on 10Mbps (NFR-P-01) — bundle size and Vite optimisation
- WCAG 2.1 AA compliance (NFR-A-01) — axe-core automated audit + manual keyboard navigation
- localStorage access in private browsing / restrictive environments
- Playwright e2e test scope (NFR-M-03)
- SPA routing on Netlify (NFR-S-02 HTTPS)

---

## NFR Assessment Steps

- [x] Analyse functional design artifacts
- [x] Identify NFR concerns
- [x] Generate questions
- [x] Collect answers
- [x] Generate nfr-requirements.md
- [x] Generate tech-stack-decisions.md

---

## Open Questions

---

### Question 1
**Reliability — localStorage failure handling**

Private browsing mode (Safari) and some enterprise browser policies throw `SecurityError` when `localStorage` is accessed. AppLayout reads and writes localStorage for onboarding and theme persistence.

A) **try/catch guard on all localStorage calls** — Wrap every `getItem`/`setItem` in a try/catch; on error, silently continue with in-memory state only. App functions correctly; persistence simply doesn't work in restricted environments.

B) **No guard — rely on modern browser behaviour** — All modern browsers (including Safari in private mode since 2020+) support localStorage; throws are rare in practice. Avoid defensive boilerplate for an edge case.

C) **Storage availability check once on mount** — Check `typeof window.localStorage !== 'undefined'` once; if available, use it; if not, skip all localStorage operations for the session.

[Answer]: A

---

### Question 2
**Maintainability — Playwright e2e test scope (NFR-M-03)**

Playwright tests run in a real browser against the built app. What scope is appropriate for v1?

A) **Three focused smoke tests**: (1) golden path — app loads, mic mock allowed, keyboard renders, note history visible; (2) permission denied — ErrorBanner appears, demo click lights a key; (3) theme switch — clicking Aurora updates a CSS custom property on the root.

B) **Onboarding flow only** — Playwright verifies the modal appears on first load (no localStorage key), "Got it" dismisses it, and a second load does not show it.

C) **Skip Playwright for v1** — Unit + component tests provide sufficient coverage. Playwright adds CI complexity; defer to post-v1.

[Answer]: A

---

### Question 3
**Performance — Bundle optimisation for NFR-P-01 (< 2s load on 10Mbps)**

Current build output is ~153KB gzipped (49KB JS + CSS). At 10Mbps that's ~0.12s transfer — well under budget. Should any Vite optimisation be configured?

A) **No explicit splitting — accept Vite defaults** — 153KB gzipped is far below the 2s budget. Manual `manualChunks` or lazy loading adds complexity without measurable benefit for this bundle size.

B) **Split vendor chunk** — Configure `manualChunks` in `vite.config.ts` to separate `react`, `react-dom`, `zustand` into a `vendor` chunk. Enables long-term browser caching when only app code changes.

C) **Lazy-load OnboardingModal** — `React.lazy()` + `Suspense` for the modal, saving a few KB from the initial bundle since it's only shown once.

[Answer]: B

---
