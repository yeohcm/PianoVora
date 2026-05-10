// ── Audio Engine (Unit 1) ──────────────────────────────────────────────────

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'error';

export interface AudioEngineResult {
  start: () => Promise<void>;
  stop: () => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

export interface AudioState {
  isListening: boolean;
  permissionState: PermissionState;
  /** EMA-smoothed RMS amplitude, 0.0–1.0 */
  audioLevel: number;
  /** Noise gate threshold, 0.001–0.1 */
  noiseGateThreshold: number;
  setIsListening: (v: boolean) => void;
  setPermissionState: (v: PermissionState) => void;
  setAudioLevel: (v: number) => void;
  setNoiseGateThreshold: (v: number) => void;
}

// ── Pitch Detection (Unit 2 — stub) ───────────────────────────────────────

export interface DetectedNote {
  midiNote: number;
  keyIndex: number;
  noteName: string;
  octave: number;
  frequency: number;
  clarity: number;
  timestamp: number;
}

// ── Keyboard Geometry (Unit 2 — stub) ─────────────────────────────────────

export interface KeyRect {
  x: number;
  y: number;
  width: number;
  height: number;
  isBlack: boolean;
  keyIndex: number;
}

// ── Theme (Unit 3 — stub) ─────────────────────────────────────────────────

export type NeonTheme = 'cyber' | 'aurora' | 'sunset';
