# Code Generation Plan — Unit 5: Sound Synthesis & Mode Controls

This plan details the steps for implementing the key press sound synthesizer and mode toggle controls.

## Unit Context & Boundaries
- **Unit Name**: Sound Synthesis & Mode Controls (Unit 5)
- **Primary Responsibility**: Monophonic client-side note synthesis on virtual key clicks and mutual exclusion of Mic/Synth modes.
- **Stories Covered**: FEAT-11 (Sound Playback & Mode Control)
- **NFR Coverage**: NFR-P-03 (low-latency playback), NFR-A-02 (accessibility labels on Mode toggle switch)

---

## Execution Checklist

### Project Setup & State
- [x] **Step 1: Update Store Slice (`src/store/audioSlice.ts`)**
  - [x] Add `inputMode: 'mic' | 'synth'` to the slice state interface.
  - [x] Add `setInputMode: (mode: 'mic' | 'synth') => void` to slice actions.
  - [x] Initialize `inputMode` to `'mic'`.
- [x] **Step 2: Update App Store exports (`src/store/appStore.ts`)**
  - [x] Ensure slice integrations and typings compile cleanly.

### Sound Synthesis Module
- [x] **Step 3: Create Synthesizer Helper (`src/features/keyboard/synthesizer.ts`)**
  - [x] Create a client-side Web Audio API monophonic synthesizer module.
  - [x] Use a soft triangle waveform (`OscillatorNode`).
  - [x] Apply a clean envelope (fast Attack, smooth decay/sustain, and 1.5s Release).
  - [x] Maintain global references to `AudioContext`, active `OscillatorNode`, and `GainNode` to ensure monophonic voice truncation (cuts off previous note with a short 0.05s gain ramp to prevent clicks).
  - [x] Export `playNote(frequency: number)` and `stopNote()`.

### Audio Pipeline Mode Integration
- [x] **Step 4: Integrate Mode Switch in Audio Engine (`src/features/audio/useAudioEngine.ts`)**
  - [x] Read `inputMode` inside `useAudioEngine`.
  - [x] Add a `useEffect` reactive loop: if `inputMode === 'synth'`, automatically trigger the `stop()` method to release/suspend the active browser microphone stream.
- [x] **Step 5: Integrate Mode Switch in Pitch Detector (`src/features/pitch/usePitchDetector.ts`)**
  - [x] Read `inputMode` inside `usePitchDetector`.
  - [x] If `inputMode === 'synth'`, halt the pitch detection loop, reset `detectedNote` to `null`, and clear internal frame references.

### Keyboard Playback Integration
- [x] **Step 6: Trigger Sound Playback in Keyboard (`src/features/keyboard/PianoKeyboard.tsx`)**
  - [x] Read `inputMode` in `PianoKeyboard`.
  - [x] Inside `handleKeyClick`, if `inputMode === 'synth'`, trigger `playNote(note.frequency)` from the synthesizer module.
  - [x] Inside `handleKeyKeyDown`, if `inputMode === 'synth'` and focused Space/Enter is pressed, trigger `playNote(frequency)`.

### UI Layout Controls
- [x] **Step 7: Render Mode Toggle in App Header (`src/features/ui/AppLayout.tsx`)**
  - [x] Read `inputMode` and `setInputMode` in `AppLayout`.
  - [x] Add a prominent, styled Mode Toggle segmented switch button in the header (styled with neon active borders, matching standard aesthetics). Add test IDs: `data-testid="mode-toggle-mic"` and `data-testid="mode-toggle-synth"`. Add accessibility tags.
  - [x] If `inputMode === 'synth'`, render the Mic Toggle button and sensitivity slider in a disabled, low-opacity state (or completely bypassed) to prevent confusion.
  - [x] Update the HUD standby text to read `"Synth Mode Active. Click a key to play sound."` when in Synth mode.

### Verification and Regression Testing
- [x] **Step 8: Write Synthesizer Unit Tests (`src/__tests__/features/keyboard/synthesizer.test.ts`)**
  - [x] Create tests mocking browser AudioContext, OscillatorNode, and GainNode to assert that calling `playNote` creates oscillators and gain envelopes.
- [x] **Step 9: Update AppLayout Integration Tests (`src/__tests__/features/ui/AppLayout.test.tsx`)**
  - [x] Verify switching modes updates the store state and disables mic widgets.
- [x] **Step 10: Update Keyboard Integration Tests (`src/__tests__/features/keyboard/PianoKeyboard.test.tsx`)**
  - [x] Verify clicking key in Synth mode triggers note synthesis and updates detectedNote HUD.
- [x] **Step 11: Run Full Test Suite Regression**
  - [x] Run `npm run test:run` and verify all 260+ tests pass successfully.
