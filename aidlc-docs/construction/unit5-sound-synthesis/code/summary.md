# Unit 5 Code Generation Summary — Sound Synthesis & Mode Controls

This unit implements the client-side Monophonic synthesizer and Mode Toggle controls.

## Application Code Modifications

### 1. `src/shared/types.ts`
- Added `inputMode: 'mic' | 'synth'` to the shared `AudioState` interface.
- Added `setInputMode` setter function.

### 2. `src/store/audioSlice.ts`
- Initialized state with `inputMode: 'mic'`.
- Implemented `setInputMode(mode)` reducer to update the current input mode in the Zustand store.

### 3. `src/features/keyboard/synthesizer.ts` (Created)
- Implements lazy AudioContext instantiation on user gesture to conform to autoplay regulations.
- Generates a soft triangle wave matching warm/piano-like synthesizer tones.
- Applies an ADSR envelope (Fast attack, quick decay, 0.08 sustain, and 1.5s exponential release).
- Enforces monophony: dynamically truncates overlapping notes with a 0.05s gain release ramp to prevent audio pops/clicks.

### 4. `src/features/audio/useAudioEngine.ts`
- Subscribes to `inputMode`.
- Automatically calls `stop()` on the microphone stream and suspends the AudioContext if input mode switches to `'synth'`, preventing acoustic feedback loop risks.

### 5. `src/features/pitch/usePitchDetector.ts`
- Halts the pitch detection requestAnimationFrame loop and resets the active detected note in the Zustand store immediately when the mode is switched to `'synth'`.

### 6. `src/features/keyboard/PianoKeyboard.tsx`
- Retrieves `inputMode` and handles key presses accordingly:
  - Space/Enter and Touch/Mouse clicks trigger `playNote()` on the synthesizer if `'synth'` mode is active.
  - Releasing key focuses or releasing Touch/Mouse triggers `stopNote()`.
  - Prevents standard double-triggering by utilizing `e.preventDefault()`.

### 7. `src/features/ui/AppLayout.tsx`
- Renders the Input Mode segmented switch button in the header.
- Lowers opacity and disables pointer-events for the microphone input toggle and sensitivity sliders when `'synth'` mode is active.
- Updates the standby HUD to instruct the user: `"Press a key to play"` / `"Synthesizer active…"`.
- Switches the standby HUD illustration from a microphone to a music note symbol when in synthesizer mode.

## Test Verification

### 1. Synthesizer Unit Tests (`src/__tests__/features/keyboard/synthesizer.test.ts`)
- Mocks AudioContext, OscillatorNode, and GainNode API responses.
- Asserts correct ADSR values and network routing.
- Verifies polyphonic overlapping truncation and stop node schedules.
- Dynamically resets Vitest module caches between tests to avoid persistent caching issues.

### 2. AppLayout Integration Tests (`src/__tests__/features/ui/AppLayout.test.tsx`)
- Verifies mode button rendering, default states, store updates, and HUD text updates.

### 3. Keyboard Integration Tests (`src/__tests__/features/keyboard/PianoKeyboard.test.tsx`)
- Mocks synthesizer import to isolate DOM interactions.
- Asserts that mouse, touch, and space/enter key actions trigger correct synth plays and stops in Synth Mode.
