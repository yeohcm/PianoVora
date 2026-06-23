# 🎹 PianoVora

PianoVora is a responsive, glassmorphic web application that serves as a virtual piano keyboard and audio visualizer. It provides real-time pitch detection using the microphone or synthesis tone generation using Web Audio API.

**Demo**: [https://yeohcm.github.io/PianoVora/](https://yeohcm.github.io/PianoVora/)

---

## 🌟 Key Features

### 🎙️ Dual Input Modes
* **Mic Mode**: Captures audio input from your microphone, runs it through the **YIN pitch detection algorithm**, and highlights the matching keys on the virtual keyboard.
* **Synth Mode**: Toggles a client-side monophonic synthesizer built with Web Audio API oscillators. Clicking virtual piano keys generates synth sounds using triangle waveforms and standard ADSR envelopes.
* **Auto-Resume Integration**: Automatically remembers your listening state, pausing microphone capture when transitioning to Synth mode and resuming it instantly upon switching back to Mic mode.

### 🎨 Rich Aesthetics & Visual Feedback
* **Neon Glassmorphic HUD**: Displays real-time note parameters (note name, frequency, octave, MIDI value, and detection clarity).
* **HUD Canvas Sparkles**: Renders physics-based canvas sparkles that burst outwards from the active note display, floating beyond container boundaries without clipping.
* **Dynamic Color Themes**: Supports beautiful, curated palettes (such as *Cyber*, *Aurora*, *Midnight*, and *Rainbow*). Sparkles, visualizer card borders, text shadows, and radial glows dynamically synchronize to match the current theme accent (including dynamic HSL key colors in Rainbow mode).

### 📱 Responsive & Accessible UI
* **Mobile-Responsive Drawer Menu**: Toggles configuration and inputs into an off-screen drawer layout on smaller viewports.
* **Accessibility Compliance**: Built with proper semantic HTML structures, unique testing IDs (`data-testid`), and keyboard-navigable ARIA roles (`radiogroup`, `radio`, `aria-checked`).

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 18](https://react.dev/) + [Vite](https://vite.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Slices architecture)
* **Pitch Detection**: [pitchy](https://github.com/qiao/pitchy) (YIN & McLeod algorithms)
* **Synthesizer**: Client-side monophonic Web Audio API
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) + CSS Custom Variables
* **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 📁 Code Structure

```
D:/Projects/PianoVora/
├── .aidlc-rule-details/    # Workflow configuration rule definitions
├── aidlc-docs/             # State-tracking and audit logs
├── public/                 # Static assets
└── src/
    ├── __tests__/          # Vitest unit/integration test suites
    ├── assets/             # Global styling assets
    ├── features/
    │   ├── audio/          # MediaStream capture and level metering
    │   ├── keyboard/       # SVG/Canvas piano visualizer and synthesizer
    │   ├── pitch/          # pitchy library hook integrations
    │   └── ui/             # Glassmorphic shell, themes, HUD overlays
    ├── shared/             # Constants and helper functions
    ├── store/              # Zustand app state and slices
    ├── App.tsx             # Root component entry
    └── main.tsx            # DOM bootstrapping
```

---

## 🚀 Getting Started

### 📋 Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* npm (comes bundled with Node)

### 📦 Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 💻 Running Locally
To launch the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### 🧪 Running Tests
To execute the unit and integration test suite (268 tests):
```bash
npm run test:run
```

To run the Vitest suite in watch mode:
```bash
npm run test
```

### 🏗️ Building for Production
To compile and bundle the application into the static `dist/` directory:
```bash
npm run build
```
This runs the TypeScript compiler `tsc` followed by the Vite production bundler.
