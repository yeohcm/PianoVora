# Integration Test Instructions

## Purpose
Verify layout rendering, theme application, and input mode state transitions work together without rendering exceptions.

## Test Scenarios

### Scenario 1: Mode Switching State Recovery
- **Description**: Verify that the application remembers the user's micro-phone capturing state when moving to synth mode and correctly resumes/halts the audio pipeline upon returning.
- **Test Command**:
  ```bash
  npm run test:run
  ```
  Runs Vitest integration tests mocking the audio graphs.
- **Expected Results**: `resumes listening when switching back to mic mode if wasListening was true` and `does not resume listening when switching back to mic mode if wasListening was false` pass.
