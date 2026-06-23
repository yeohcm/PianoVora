# API Documentation

## REST APIs
- *Note: None. PianoVora is a client-only static single-page application with no external backend REST interfaces.*

## Internal APIs

### Audio Engine Service
- **Methods**:
  - `start(): Promise<void>` - Requests microphone permissions and starts the Web Audio context RMS detection loop.
  - `stop(): void` - Suspends the AudioContext and cancels the RMS loop.
- **Hook Return Signature**:
  - Returns `AudioEngineResult` containing `{ start, stop, analyserRef }`.
- **Location**: `src/features/audio/useAudioEngine.ts`

### Pitch Detector Service
- **Hook Return Signature**:
  - Signature: `usePitchDetector({ analyserRef }: { analyserRef: React.MutableRefObject<AnalyserNode | null> }): void`
- **Location**: `src/features/pitch/usePitchDetector.ts`

### State Creator Slices (Zustand)
- **Audio Slice**:
  - `isListening: boolean`
  - `permissionState: PermissionState` (Values: `'prompt' | 'granted' | 'denied' | 'error'`)
  - `audioLevel: number` (Smoothed RMS volume level)
  - `noiseGateThreshold: number` (Sensitivity gate)
  - `setIsListening(v: boolean): void`
  - `setPermissionState(v: PermissionState): void`
  - `setAudioLevel(v: number): void`
  - `setNoiseGateThreshold(v: number): void`
- **Pitch Slice**:
  - `detectedNote: DetectedNote | null`
  - `noteHistory: DetectedNote[]`
  - `setDetectedNote(note: DetectedNote | null): void`
  - `setNoteHistory(history: DetectedNote[]): void`
- **UI Slice**:
  - `theme: NeonTheme` (Values: `'cyber' | 'aurora' | 'sunset' | 'rainbow'`)
  - `onboardingDismissed: boolean`
  - `setTheme(t: NeonTheme): void`
  - `setOnboardingDismissed(v: boolean): void`

## Data Models

### DetectedNote
- **Fields**:
  - `midiNote: number` - MIDI index representation of note (21 to 108).
  - `keyIndex: number` - Keyboard index mapped in range [0, 87].
  - `noteName: string` - Nominal representation of note (e.g. `'C'`, `'G#'`).
  - `octave: number` - Octave indicator (0 to 8).
  - `frequency: number` - Sound frequency (Hz).
  - `clarity: number` - Estimation confidence coefficient (0.0 to 1.0).
  - `timestamp: number` - Time of sound detection (`performance.now()`).
- **Location**: `src/shared/types.ts`
