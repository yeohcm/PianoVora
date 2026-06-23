# Build Instructions

## Prerequisites
- **Build Tool**: Vite 5.2.x + TypeScript 5.2.x
- **Dependencies**: Node.js v18+ and NPM v9+ (as managed in [package.json](file:///D:/Projects/PianoVora/package.json))
- **Environment Variables**: None required
- **System Requirements**: OS: Windows/macOS/Linux, Memory: 4GB+ RAM, Disk Space: 500MB+

## Build Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
No environment variables or API keys are required for local build.

### 3. Build All Units
```bash
npm run build
```

### 4. Verify Build Success
- **Expected Output**: 
  - Compilation of TypeScript assets.
  - Production static bundle built into the `dist/` directory.
- **Build Artifacts**:
  - `dist/index.html` (entrypoint)
  - `dist/assets/` (bundled JS, CSS, and SVG resources)
- **Common Warnings**: None expected.

## Troubleshooting

### Build Fails with Dependency Errors
- **Cause**: Outdated package-lock.json or npm cached issues.
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again.

### Build Fails with Compilation Errors
- **Cause**: Strict TypeScript validation failed.
- **Solution**: Run `npx tsc --noEmit` locally to identify type safety errors in components.
