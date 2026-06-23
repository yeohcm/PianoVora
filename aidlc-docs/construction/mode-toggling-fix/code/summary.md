# Code Generation Summary - Mode Toggling Fix

## Overview
This unit corrects the behavior of toggling between Synthesizer (Oscillator-based) and Microphone (YIN Pitch Detection) inputs. It resolves a compilation/runtime reference exception (`useRef` undefined) and a state synchronization race condition where the `wasListeningRef.current` value was reset incorrectly.

## Modified Files

### [AppLayout.tsx](file:///D:/Projects/PianoVora/src/features/ui/AppLayout.tsx)
* **Imports**: Added `useRef` to React imports.
* **Hook synchronization**: Fixed dependencies in the `useEffect` block synchronizing `wasListeningRef.current` and `isListening`. Changed it to run only when `isListening` changes (not `inputMode`) to prevent updating `wasListeningRef` to `false` when entering Synth mode.

## Modified Tests

### [AppLayout.test.tsx](file:///D:/Projects/PianoVora/src/__tests__/features/ui/AppLayout.test.tsx)
* **Mock track**: Added `mockStart` and `mockStop` spies to track invocation status of `useAudioEngine` functions.
* **Auto-resume validation**: Added two mode toggle test cases verifying that `start()` is correctly called on switching back to Mic mode if audio capture was active beforehand, and is not called if capture was not active.
