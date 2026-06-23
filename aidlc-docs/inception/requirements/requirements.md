# Requirements - Mode Toggling Fix

## Intent Analysis Summary
- **User Request**: "switching from synth back to mic mode, it is not working"
- **Request Type**: Bug Fix
- **Scope Estimate**: Single Component (`src/features/ui/AppLayout.tsx`)
- **Complexity Estimate**: Simple / Trivial

## Functional Requirements
1. Switching from Synth Mode back to Mic Mode must automatically resume microphone capture if it was active beforehand.
2. If microphone capture was not active before switching to Synth Mode, it should not automatically start when switching back to Mic Mode.
3. The component must import and use React's `useRef` properly without runtime compilation or execution errors.
4. The hook dependencies in `AppLayout.tsx` must be constructed to prevent dependency race conditions that overwrite `wasListeningRef.current` during input mode transitions.

## Non-Functional Requirements
1. **Performance**: No additional garbage collection pressure or lag when toggling modes.
2. **Robustness**: Prevent unhandled React exceptions (e.g. `ReferenceError: useRef is not defined`).
