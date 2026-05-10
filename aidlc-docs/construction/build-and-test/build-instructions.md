# Build Instructions — PianoVora

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Browser (for dev) | Chrome / Edge / Firefox (microphone access required) |

**No environment variables required.** PianoVora is a pure client-side SPA with no server-side secrets.

---

## Build Steps

### 1. Install Dependencies

```bash
npm install
```

Expected output: dependency tree resolved, no audit errors. If `npm audit` reports vulnerabilities, run `npm audit --omit=dev` to check only production dependencies.

### 2. TypeScript Check (optional pre-build)

```bash
npx tsc --noEmit
```

Expected: no output (zero errors). This is a fast check before committing a full build.

### 3. Build for Production

```bash
npm run build
```

This command runs `tsc && vite build` in sequence:
- TypeScript compiles with `strict: true`
- Vite bundles to `dist/`

Expected output:

```
vite vX.Y.Z building for production...
✓ N modules transformed.
dist/index.html         ~0.5 kB │ gzip: ~0.3 kB
dist/assets/index-*.css ~10 kB  │ gzip: ~3 kB
dist/assets/index-*.js  ~173 kB │ gzip: ~57 kB
✓ built in ~1.5s
```

**Build artifacts**:
| File | Purpose |
|---|---|
| `dist/index.html` | Entry point |
| `dist/assets/index-*.js` | Bundled app (Vite default chunking) |
| `dist/assets/index-*.css` | Tailwind CSS |

**Performance context**: At 10Mbps the 57KB gzipped JS transfers in ~0.05s — well within the NFR-P-01 target of < 2s.

### 4. Preview Production Build (optional)

```bash
npm run preview
```

Opens a local static server at `http://localhost:4173`. This serves the `dist/` folder identically to Netlify — useful for verifying the SPA routing (`_redirects`) before deploy.

---

## Deployment to Netlify

`netlify.toml` configures automatic CI/CD:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Manual deploy** (for testing):
```bash
npx netlify deploy --prod --dir=dist
```

`public/_redirects` handles SPA routing:
```
/* /index.html 200
```

---

## Troubleshooting

### TypeScript Errors on Build

- Run `npx tsc --noEmit` to see full diagnostics without running Vite
- Ensure `strict: true` is set in `tsconfig.json`

### `@/` Import Alias Not Resolving

- Verify `vite.config.ts` has `resolve.alias: { '@': path.resolve(__dirname, './src') }`
- Verify `tsconfig.json` has `paths: { "@/*": ["./src/*"] }`

### Microphone Not Working in Preview

- `npm run preview` serves over HTTP; Chrome blocks `getUserMedia` on non-localhost HTTP. Use `localhost` (not `127.0.0.1`) or serve over HTTPS.
