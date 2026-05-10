// ── Web Audio API ─────────────────────────────────────────────────────────

export const FFT_SIZE = 2048;
export const MIN_SAMPLE_RATE = 44_100;

// ── Noise Gate ────────────────────────────────────────────────────────────

export const DEFAULT_NOISE_GATE = 0.02;
export const MIN_NOISE_GATE = 0.001;
export const MAX_NOISE_GATE = 0.1;

// ── RMS Display ───────────────────────────────────────────────────────────

/** EMA smoothing coefficient for audioLevel display (BR-08) */
export const EMA_ALPHA = 0.3;
export const PEAK_HOLD_MS = 500;
export const PEAK_DECAY_RATE = 0.02;

// ── Reconnect ─────────────────────────────────────────────────────────────

export const MAX_RECONNECT_ATTEMPTS = 3;
/** Stabilisation delay after hardware disconnect before getUserMedia retry (NFR-R-02) */
export const RECONNECT_STABILISE_MS = 200;

// ── Pitch / MIDI (Unit 2) ─────────────────────────────────────────────────

export const A4_FREQUENCY = 440.0;
export const MIDI_A4 = 69;
export const PIANO_KEY_COUNT = 88;
