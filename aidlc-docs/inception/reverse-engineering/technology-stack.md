# Technology Stack

## Programming Languages
- **TypeScript** - Version `^5.4.5` - Strict-mode type safety for frontend templates, canvas animations, and Web Audio API interactions.
- **JavaScript (ES Modules)** - Targets modern browser runtimes with ES Module layout.

## Frameworks
- **React** - Version `^18.3.1` - Component framework rendering interface shell and interactive components.
- **Zustand** - Version `^4.5.4` - Central state manager tracking audio levels, permissions, note history, themes, and detected pitches.

## Infrastructure
- **Browser Web Audio API** - Captures client microphone stream, hooks analyser, and calculates volume RMS.
- **GitHub Actions** - Configured workflow in `.github/workflows/deploy.yml` compiling assets and deploying onto GitHub Pages.
- **Netlify** - Alternative static deployment target defined in `netlify.toml`.

## Build Tools
- **Vite** - Version `^5.2.11` - Asset compiler and developer server.
- **PostCSS / Autoprefixer** - Transpiles styling files.

## Testing Tools
- **Vitest** - Version `^1.6.0` - Fast developer test runner.
- **React Testing Library** - Version `^16.0.0` - Renders interactive components for functional tests.
- **fast-check** - Version `^3.19.0` - Generates random test configurations for property-based testing validations (frequencies, MIDI keys).
- **Playwright** - Version `^1.44.0` - End-to-end integration tests.
