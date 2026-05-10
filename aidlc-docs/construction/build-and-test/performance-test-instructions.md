# Performance Test Instructions — PianoVora

## Performance Requirements

| NFR | Requirement | Current Measurement |
|---|---|---|
| NFR-P-01 | Page load < 2s on 10Mbps | ~0.05s JS transfer (57KB gzipped at 10Mbps) |
| NFR-P-02 | Key highlight ≤ 16ms after note detection | Single React render cycle (~1–3ms in jsdom) |
| NFR-P-03 | Canvas sparkle at 60fps | rAF loop with self-termination when particles drain |

---

## Bundle Size Verification

The primary performance test for a static SPA is bundle size — it directly determines transfer time.

### Measure Bundle Size

```bash
npm run build
```

Read the Vite output summary:

```
dist/assets/index-*.js   ~173 kB │ gzip: ~57 kB
```

**Pass criteria**: gzipped JS ≤ 200KB. At 10Mbps (~1.25 MB/s), 200KB transfers in ~0.16s, well within the 2s budget for NFR-P-01.

### Detailed Bundle Analysis (optional)

```bash
npx vite-bundle-visualizer
```

Opens an interactive treemap in the browser showing which packages contribute most to bundle size. Use this if the bundle ever grows beyond the 200KB threshold to identify what to split or tree-shake.

Current major contributors (approximate):
- `react` + `react-dom`: ~45KB gzipped
- `pitchy`: ~8KB gzipped
- App code: ~4KB gzipped

---

## Runtime Performance: Key Highlight Latency

There is no dedicated automated runtime perf test. The Vitest unit tests verify correctness; latency verification is done via Chrome DevTools in a real browser.

### Manual Verification Procedure

1. Start dev server: `npm run dev`
2. Open Chrome DevTools → Performance tab
3. Start recording
4. Play A4 on a physical piano or use the on-screen keyboard demo click
5. Stop recording
6. Inspect the timeline:
   - Find the `setDetectedNote` Zustand dispatch
   - Measure time to first repaint of the highlighted key
   - **Target**: ≤ 16ms (one frame at 60fps)

**Expected**: In practice this will be < 5ms (single synchronous Zustand update → React re-render → DOM commit).

---

## Runtime Performance: Sparkle Animation Smoothness

### Manual Verification Procedure

1. Start dev server: `npm run dev`
2. Open Chrome DevTools → Rendering tab → enable "Frame Rendering Stats"
3. Click piano keys rapidly to spawn multiple sparkle bursts
4. Observe the frame rate overlay
5. **Target**: Stays at 60fps during animation; returns to idle (0fps rAF) when particles drain

**Pass criteria**: No dropped frames during normal play (≤ 12 simultaneous particles per key click × 3 concurrent notes = 36 max particles).

### Reduced-Motion Path

With `prefers-reduced-motion: reduce` set in OS/browser:
- Open DevTools → Rendering → toggle "Emulate CSS media feature prefers-reduced-motion"
- Click a key
- **Target**: Single synchronous draw + `clearRect`, no rAF scheduled (verified by unit test in `useSparkleAnimation.test.ts`)

---

## Lighthouse Audit (optional, post-deploy)

After deploying to Netlify:

```bash
npx lighthouse https://your-app.netlify.app --only-categories=performance
```

**Target scores**:
- Performance: ≥ 90
- First Contentful Paint: < 1s
- Time to Interactive: < 2s

Note: Lighthouse scores are network-condition and machine-dependent. Run from a wired connection for stable baselines.

---

## Performance Optimization (if needed)

If the bundle exceeds 200KB gzipped in the future:

1. **Vendor chunk split**: Add `manualChunks` to `vite.config.ts` to separate React and Zustand into a long-cached vendor chunk (deferred from NFR Requirements Q3=A — revisit when app code > 100KB).
2. **Dynamic import of OnboardingModal**: `React.lazy(() => import('./OnboardingModal'))` — saves a few KB from initial load since it renders only once.
3. **pitchy tree-shake check**: Verify `pitchy` is correctly tree-shaken (only `PitchDetector` is used, not the full library).
