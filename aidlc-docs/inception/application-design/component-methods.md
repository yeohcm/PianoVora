# PianoVora — Component Method Signatures

**Version**: 1.0 | **Date**: 2026-05-09  
**Note**: Detailed business logic and implementation rules are defined in Functional Design (per-unit, CONSTRUCTION phase). This document captures public interfaces only.

---

## shared/types.ts

```typescript
export type NeonTheme = 'cyber' | 'aurora' | 'sunset';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'error';

export interface KeyRect {
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
}

export interface DetectedNote {
  frequency: number;      // Hz
  midiNote: number;       // 21–108
  keyIndex: number;       // 0–87
  noteName: string;       // e.g. "G#4"
  octave: number;         // 0–8
  timestamp: number;      // performance.now()
}
```

---

## shared/constants.ts

```typescript
export const MIDI_NOTE_MIN = 21;          // A0
export const MIDI_NOTE_MAX = 108;         // C8
export const FREQ_MIN_HZ = 27.5;         // A0
export const FREQ_MAX_HZ = 4186.0;       // C8
export const A4_FREQUENCY = 440.0;
export const A4_MIDI_NOTE = 69;
export const FFT_SIZE = 2048;
export const SAMPLE_RATE = 44100;
export const DEFAULT_NOISE_GATE = 0.02;  // RMS amplitude threshold (0–1)
export const NOTE_HISTORY_MAX = 5;
export const SPARKLE_FADE_MS = 1000;     // glow fade duration
export const TARGET_FPS = 60;
```

---

## shared/pianoGeometry.ts

```typescript
/**
 * Returns the canvas/SVG rect for a key at the given index (0 = A0, 87 = C8).
 * Positions are relative to the full keyboard width passed in.
 */
export function getKeyGeometry(keyIndex: number, totalWidth: number): KeyRect;

/**
 * Returns true if the key at keyIndex is a black key.
 */
export function isBlackKey(keyIndex: number): boolean;

/**
 * Maps a MIDI note number (21–108) to a key index (0–87).
 * Returns null for notes outside the piano range.
 */
export function midiNoteToKeyIndex(midiNote: number): number | null;

/**
 * Maps a frequency (Hz) to the nearest MIDI note number.
 * Returns null if frequency is outside the A0–C8 range.
 */
export function frequencyToMidiNote(frequency: number): number | null;

/**
 * Returns the note name and octave string for a key index (e.g. "G#4").
 */
export function keyIndexToNoteName(keyIndex: number): string;

/**
 * Returns the octave number for a key index.
 */
export function keyIndexToOctave(keyIndex: number): number;

/**
 * Returns geometry for all 88 keys in a single pass (for SVG rendering).
 */
export function getAllKeyGeometry(totalWidth: number): KeyRect[];
```

---

## store/appStore.ts

```typescript
interface AudioSlice {
  isListening: boolean;
  permissionState: PermissionState;
  audioLevel: number;             // 0–1 RMS amplitude
  noiseGateThreshold: number;     // 0–1
  setListening: (value: boolean) => void;
  setPermissionState: (state: PermissionState) => void;
  setAudioLevel: (level: number) => void;
  setNoiseGateThreshold: (threshold: number) => void;
}

interface PitchSlice {
  detectedNote: DetectedNote | null;
  noteHistory: DetectedNote[];    // max NOTE_HISTORY_MAX entries
  setDetectedNote: (note: DetectedNote | null) => void;
  addToHistory: (note: DetectedNote) => void;
  clearHistory: () => void;
}

interface UISlice {
  theme: NeonTheme;
  onboardingDismissed: boolean;
  setTheme: (theme: NeonTheme) => void;
  dismissOnboarding: () => void;
}

type AppStore = AudioSlice & PitchSlice & UISlice;

export const useAppStore: UseBoundStore<StoreApi<AppStore>>;
```

---

## features/audio/useAudioEngine.ts

```typescript
interface AudioEngineResult {
  analyserNode: React.RefObject<AnalyserNode | null>;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Manages the microphone capture lifecycle.
 * Writes isListening, permissionState, audioLevel to the Zustand store.
 * Exposes analyserNode ref for usePitchDetector.
 */
export function useAudioEngine(): AudioEngineResult;
```

---

## features/pitch/usePitchDetector.ts

```typescript
interface PitchDetectorOptions {
  analyserNode: React.RefObject<AnalyserNode | null>;
}

/**
 * Runs the pitch detection loop using the pitchy library.
 * Reads the waveform buffer from analyserNode each frame.
 * Writes detectedNote and noteHistory to the Zustand store.
 * Stops when isListening is false.
 */
export function usePitchDetector(options: PitchDetectorOptions): void;
```

---

## features/keyboard/PianoKeyboard.tsx

```typescript
interface PianoKeyboardProps {
  onKeyClick?: (keyIndex: number) => void;  // demo/teacher mode
}

/**
 * Renders the full 88-key SVG keyboard.
 * Reads detectedNote from Zustand to highlight the active key.
 * Scrolls to centre the active key automatically.
 */
export function PianoKeyboard(props: PianoKeyboardProps): JSX.Element;
```

---

## features/keyboard/CanvasOverlay.tsx

```typescript
interface CanvasOverlayProps {
  activeKeyIndex: number | null;
  totalKeyboardWidth: number;
}

/**
 * Absolutely-positioned canvas over the SVG keyboard.
 * Delegates animation to useSparkleAnimation.
 */
export function CanvasOverlay(props: CanvasOverlayProps): JSX.Element;
```

---

## features/keyboard/useSparkleAnimation.ts

```typescript
interface SparkleAnimationOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeKeyIndex: number | null;
  totalKeyboardWidth: number;
}

/**
 * Manages the requestAnimationFrame sparkle/glow animation loop.
 * Spawns particles at the active key's geometry position.
 * Fades particles over SPARKLE_FADE_MS milliseconds.
 */
export function useSparkleAnimation(options: SparkleAnimationOptions): void;
```

---

## features/ui/ThemeProvider.tsx

```typescript
/**
 * Reads uiSlice.theme and applies the corresponding CSS custom properties
 * to document.documentElement. Renders children unchanged.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element;
```

---

## features/ui/ThemeSelector.tsx

```typescript
/**
 * Button group for Cyber / Aurora / Sunset theme selection.
 * Writes to uiSlice.theme.
 */
export function ThemeSelector(): JSX.Element;
```

---

## features/ui/NoteHistoryPanel.tsx

```typescript
/**
 * Displays the last NOTE_HISTORY_MAX detected notes from pitchSlice.noteHistory.
 * Shows empty state when history is empty.
 */
export function NoteHistoryPanel(): JSX.Element;
```

---

## features/ui/OnboardingModal.tsx

```typescript
/**
 * First-visit modal. Checks uiSlice.onboardingDismissed.
 * Persists dismissal to localStorage.
 */
export function OnboardingModal(): JSX.Element | null;
```

---

## features/audio/MicToggle.tsx

```typescript
/**
 * On/off toggle button. Calls useAudioEngine start/stop.
 * Reflects audioSlice.isListening state.
 */
export function MicToggle(): JSX.Element;
```

---

## features/audio/AudioLevelMeter.tsx

```typescript
/**
 * Animated bar visualising audioSlice.audioLevel (0–1).
 * Indicates that the microphone is active and receiving signal.
 */
export function AudioLevelMeter(): JSX.Element;
```

---

## features/audio/SensitivitySlider.tsx

```typescript
/**
 * Range input for the noise gate threshold.
 * Reads and writes audioSlice.noiseGateThreshold.
 */
export function SensitivitySlider(): JSX.Element;
```

---

## features/ui/ErrorBanner.tsx

```typescript
/**
 * Reads audioSlice.permissionState.
 * Renders a dismissible error banner with instructions when state is 'denied' or 'error'.
 */
export function ErrorBanner(): JSX.Element | null;
```
