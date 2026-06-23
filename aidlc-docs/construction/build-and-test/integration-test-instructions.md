# Integration Test Instructions

## Purpose
Ensure mutual exclusions and interactive updates function correctly when multiple units (Audio Engine, Pitch Detector, Zustand Store, Keyboard component, UI Layout) interact.

## Test Scenarios

### Scenario 1: Input Mode Transition & Pipeline Suspension
- **Description**: Switching input mode to Synth mode disables and suspends the microphone capture loop.
- **Setup**: Start app, allow microphone access, and ensure microphone listener is running.
- **Test Steps**:
  1. Click the "Synth" toggle in the header.
  2. Confirm that the microphone input level meter drops and becomes inactive.
  3. Confirm that the sensitivity sliders become disabled and read-only.
- **Expected Results**: Microphone streams are completely released/stopped. Pitch detection loop suspends.

### Scenario 2: Synthesizer Playback & HUD Integration
- **Description**: Pressing virtual keys in Synth Mode plays audio notes and logs notes in history panels.
- **Setup**: Click the "Synth" toggle in the header.
- **Test Steps**:
  1. Click a virtual piano key (e.g. C4).
  2. Verify that note synthesis sound fires.
  3. Verify that the HUD standby state updates to show "C4" active.
  4. Verify that "C4" note entry is logged into the Note History panel.
- **Expected Results**: Playback occurs successfully, UI elements highlight notes dynamically, and HUD updates note info.

## Run Integration Tests

All integration test suites are written under `src/__tests__/features/ui/` and `src/__tests__/features/keyboard/` and execute as part of:
```bash
npm run test:run
```
