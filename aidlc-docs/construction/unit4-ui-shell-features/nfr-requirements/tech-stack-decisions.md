# Unit 4: UI Shell & Features — Tech Stack Decisions

---

## Layout & Styling

### TD-01: Tailwind CSS for Layout, CSS Custom Properties for Theme Colours
- **Decision**: AppLayout uses Tailwind utility classes for layout (flexbox, spacing, responsive wrapping). Neon colours and key fills are CSS custom properties set by ThemeProvider — not Tailwind colour classes — so they update without React re-renders.
- **Pattern**: `bg-[#0a0a0f]` for static dark background; `bg-[var(--neon-accent)]` for theme-reactive elements like the OnboardingModal dismiss button.
- **Source**: UI-01; TD-02 from Unit 3

### TD-02: Semantic HTML Landmarks
- **Decision**: `AppLayout` uses `<header>`, `<main>`, and `<section aria-label="Note history">` rather than generic `<div>` elements for the three primary regions.
- **Rationale**: Landmark regions enable screen reader navigation without additional ARIA roles; aligns with WCAG 1.3.1.
- **Source**: NFR-A1; BR-31

---

## State & Persistence

### TD-03: localStorage Helpers in AppLayout (Q1=A)
- **Decision**: Two module-level helper functions in `AppLayout.tsx`:
  ```typescript
  function safeGetItem(key: string): string | null {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }
  function safeSetItem(key: string, value: string): void {
    try { localStorage.setItem(key, value); }
    catch { /* silently swallow */ }
  }
  ```
- **Usage**: Called at 4 sites — onboarding read, onboarding write, theme read, theme write.
- **Source**: NFR-R1; Q1=A

### TD-04: No Router
- **Decision**: No React Router or client-side routing. Single-page application with one view. `public/_redirects` handles Netlify SPA routing at the CDN layer.
- **Rationale**: PianoVora has no multi-page navigation requirements; a router would add bundle weight for zero benefit.
- **Source**: unit-of-work.md ("No router" note)

---

## Build & Deployment

### TD-05: Vite Default Bundle Configuration (Q3=A)
- **Decision**: No `manualChunks` configuration in `vite.config.ts`. Vite's default chunking strategy is retained.
- **Rationale**: Current build is ~153KB gzipped. At 10Mbps this transfers in ~0.12s — 16× below the 2s budget. Manual splitting at this size adds configuration complexity with no measurable benefit.
- **Source**: NFR-P1; Q3=A

### TD-06: Netlify Static Hosting
- **Decision**: Deployment via `netlify.toml` (`command = "npm run build"`, `publish = "dist"`) + `public/_redirects` (`/* /index.html 200`).
- **HTTPS**: Enforced automatically by Netlify on all custom domains; no app-level HTTPS redirect needed.
- **Source**: NFR-S-02; BR-25, BR-26, BR-27

---

## Testing

### TD-07: Vitest + RTL for Component Tests (Q2=C — No Playwright)
- **Decision**: All Unit 4 tests use Vitest + React Testing Library. Playwright is deferred to post-v1.
- **localStorage mocking**: `vi.stubGlobal('localStorage', mockStorage)` in `beforeEach`; restored in `afterEach`.
- **Source**: NFR-T1; Q2=C

### TD-08: axe-core Not Integrated in Automated Tests
- **Decision**: WCAG compliance is verified by structural assertions in RTL tests (role presence, aria attributes) rather than axe-core automated audit. A manual axe browser extension audit is the recommended pre-deploy check.
- **Rationale**: axe-core in Vitest/jsdom produces false positives due to missing computed styles; useful in real-browser Playwright context which is deferred.
- **Source**: NFR-A-01; Q2=C
