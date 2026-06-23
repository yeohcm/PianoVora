# Code Generation Plan - Mode Toggling Fix

This plan is the single source of truth for Code Generation.

## Unit Context
- **Unit Name**: Mode Toggling Fix
- **Target Component**: `src/features/ui/AppLayout.tsx`
- **Dependencies**: React, useAudioEngine
- **Stories/Features**:
  - Automatically resume microphone capture on toggling mode back to Mic if previously active.
  - Fix missing React imports (`useRef` undefined reference).

## Execution Steps

- [x] **Step 1: Fix React Imports in AppLayout.tsx**
  - Path: `src/features/ui/AppLayout.tsx`
  - Action: Update line 1 of `src/features/ui/AppLayout.tsx` to include `useRef` in imports from `'react'`.
  - Traceability: Bug fix for compilation/runtime ReferenceError.

- [x] **Step 2: Correct Hook Dependencies and wasListeningRef Logic**
  - Path: `src/features/ui/AppLayout.tsx`
  - Action: Change the `useEffect` that synchronizes `wasListeningRef.current` with `isListening` to only depend on `isListening` changes (not `inputMode` changes), and add `// eslint-disable-next-line react-hooks/exhaustive-deps` to bypass ESLint.
  - Traceability: Fixes the race condition where `wasListeningRef.current` was overwritten with `false` when switching `inputMode`.

- [x] **Step 3: Run Vitest Suite to Verify Tests**
  - Action: Run `npm run test:run` to verify that `AppLayout.test.tsx` and all other tests compile and run successfully.
  - Traceability: Regression testing.
