import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  frequencyToMidiNote,
  midiNoteToKeyIndex,
  keyIndexToNoteName,
  keyIndexToOctave,
  isBlackKey,
  getKeyGeometry,
  getAllKeyGeometry,
} from '@/shared/pianoGeometry';

// ── frequencyToMidiNote ───────────────────────────────────────────────────────

describe('frequencyToMidiNote', () => {
  it('maps A4 (440 Hz) to MIDI 69', () => {
    expect(frequencyToMidiNote(440)).toBe(69);
  });

  it('maps A0 boundary (27.5 Hz) to MIDI 21', () => {
    expect(frequencyToMidiNote(27.5)).toBe(21);
  });

  it('maps C8 boundary (4186 Hz) to MIDI 108', () => {
    expect(frequencyToMidiNote(4186.0)).toBe(108);
  });

  it('returns null below piano range (20 Hz)', () => {
    expect(frequencyToMidiNote(20)).toBeNull();
  });

  it('returns null above piano range (5000 Hz)', () => {
    expect(frequencyToMidiNote(5000)).toBeNull();
  });

  it('returns null for zero', () => {
    expect(frequencyToMidiNote(0)).toBeNull();
  });

  it('returns null for negative frequency', () => {
    expect(frequencyToMidiNote(-440)).toBeNull();
  });
});

// ── midiNoteToKeyIndex ────────────────────────────────────────────────────────

describe('midiNoteToKeyIndex', () => {
  it('maps MIDI 21 (A0) to key index 0', () => {
    expect(midiNoteToKeyIndex(21)).toBe(0);
  });

  it('maps MIDI 108 (C8) to key index 87', () => {
    expect(midiNoteToKeyIndex(108)).toBe(87);
  });

  it('maps MIDI 69 (A4) to key index 48', () => {
    expect(midiNoteToKeyIndex(69)).toBe(48);
  });

  it('returns null below range (MIDI 20)', () => {
    expect(midiNoteToKeyIndex(20)).toBeNull();
  });

  it('returns null above range (MIDI 109)', () => {
    expect(midiNoteToKeyIndex(109)).toBeNull();
  });
});

// ── keyIndexToNoteName ────────────────────────────────────────────────────────

describe('keyIndexToNoteName', () => {
  it('keyIndex 0 → A (A0)', () => {
    expect(keyIndexToNoteName(0)).toBe('A');
  });

  it('keyIndex 3 → C (C1)', () => {
    expect(keyIndexToNoteName(3)).toBe('C');
  });

  it('keyIndex 4 → C# (C#1)', () => {
    expect(keyIndexToNoteName(4)).toBe('C#');
  });

  it('keyIndex 48 → A (A4)', () => {
    expect(keyIndexToNoteName(48)).toBe('A');
  });

  it('keyIndex 87 → C (C8)', () => {
    expect(keyIndexToNoteName(87)).toBe('C');
  });

  it('returns null for keyIndex -1', () => {
    expect(keyIndexToNoteName(-1)).toBeNull();
  });

  it('returns null for keyIndex 88', () => {
    expect(keyIndexToNoteName(88)).toBeNull();
  });
});

// ── keyIndexToOctave ──────────────────────────────────────────────────────────

describe('keyIndexToOctave', () => {
  it('keyIndex 0 → octave 0 (A0)', () => {
    expect(keyIndexToOctave(0)).toBe(0);
  });

  it('keyIndex 3 → octave 1 (C1)', () => {
    expect(keyIndexToOctave(3)).toBe(1);
  });

  it('keyIndex 48 → octave 4 (A4)', () => {
    expect(keyIndexToOctave(48)).toBe(4);
  });

  it('keyIndex 87 → octave 8 (C8)', () => {
    expect(keyIndexToOctave(87)).toBe(8);
  });

  it('returns null for keyIndex -1', () => {
    expect(keyIndexToOctave(-1)).toBeNull();
  });

  it('returns null for keyIndex 88', () => {
    expect(keyIndexToOctave(88)).toBeNull();
  });
});

// ── isBlackKey ────────────────────────────────────────────────────────────────

describe('isBlackKey', () => {
  it('A0 (keyIndex 0) is white', () => {
    expect(isBlackKey(0)).toBe(false);
  });

  it('A#0 (keyIndex 1) is black', () => {
    expect(isBlackKey(1)).toBe(true);
  });

  it('C1 (keyIndex 3) is white', () => {
    expect(isBlackKey(3)).toBe(false);
  });

  it('C#1 (keyIndex 4) is black', () => {
    expect(isBlackKey(4)).toBe(true);
  });

  it('C8 (keyIndex 87) is white', () => {
    expect(isBlackKey(87)).toBe(false);
  });

  it('returns null for keyIndex -1', () => {
    expect(isBlackKey(-1)).toBeNull();
  });

  it('returns null for keyIndex 88', () => {
    expect(isBlackKey(88)).toBeNull();
  });
});

// ── getKeyGeometry ────────────────────────────────────────────────────────────

describe('getKeyGeometry', () => {
  const W = 520; // 52 white keys × 10px each

  it('A0 (first white key) starts at x=0', () => {
    const rect = getKeyGeometry(0, W)!;
    expect(rect.x).toBe(0);
    expect(rect.width).toBeCloseTo(10);
    expect(rect.height).toBeCloseTo(65);
    expect(rect.isBlack).toBe(false);
    expect(rect.keyIndex).toBe(0);
  });

  it('C8 (last white key, keyIndex 87) has x > 0', () => {
    const rect = getKeyGeometry(87, W)!;
    expect(rect.x).toBeGreaterThan(0);
    expect(rect.isBlack).toBe(false);
  });

  it('A#0 (first black key, keyIndex 1) is positioned correctly', () => {
    const rect = getKeyGeometry(1, W)!;
    expect(rect.isBlack).toBe(true);
    expect(rect.width).toBeCloseTo(6);          // 10 * 0.6
    expect(rect.height).toBeCloseTo(42.25);     // 65 * 0.65
    expect(rect.x).toBeGreaterThan(0);
  });

  it('returns null for keyIndex -1', () => {
    expect(getKeyGeometry(-1, W)).toBeNull();
  });

  it('returns null for keyIndex 88', () => {
    expect(getKeyGeometry(88, W)).toBeNull();
  });

  it('returns null for totalWidth 0', () => {
    expect(getKeyGeometry(0, 0)).toBeNull();
  });

  it('returns null for negative totalWidth', () => {
    expect(getKeyGeometry(0, -100)).toBeNull();
  });
});

// ── getAllKeyGeometry ─────────────────────────────────────────────────────────

describe('getAllKeyGeometry', () => {
  it('returns exactly 88 rects for valid width', () => {
    expect(getAllKeyGeometry(1040)).toHaveLength(88);
  });

  it('returns exactly 52 white keys', () => {
    const rects = getAllKeyGeometry(1040);
    expect(rects.filter((r) => !r.isBlack)).toHaveLength(52);
  });

  it('returns exactly 36 black keys', () => {
    const rects = getAllKeyGeometry(1040);
    expect(rects.filter((r) => r.isBlack)).toHaveLength(36);
  });

  it('returns [] for totalWidth 0', () => {
    expect(getAllKeyGeometry(0)).toHaveLength(0);
  });

  it('returns [] for negative totalWidth', () => {
    expect(getAllKeyGeometry(-1)).toHaveLength(0);
  });

  it('every rect has a non-negative x', () => {
    const rects = getAllKeyGeometry(1040);
    rects.forEach((r) => expect(r.x).toBeGreaterThanOrEqual(0));
  });
});

// ── Property-Based Tests (fast-check) ────────────────────────────────────────

const PBT_OPTS = { seed: 42, verbose: true };

describe('PBT: frequencyToMidiNote round-trip (PBT-02)', () => {
  it('inverse frequency is within ±50 cents of original for any in-range frequency', () => {
    fc.assert(
      fc.property(fc.float({ min: 27.5, max: 4186.0 }), (frequency) => {
        if (!Number.isFinite(frequency)) return;
        const midi = frequencyToMidiNote(frequency);
        // In-range frequencies should always return a valid MIDI note
        expect(midi).not.toBeNull();
        if (midi === null) return;
        // Inverse: compute the exact frequency for this MIDI note
        const roundTrippedFreq = 440 * Math.pow(2, (midi - 69) / 12);
        // Rounding guarantees ≤50 cents error
        const centsDiff = Math.abs(1200 * Math.log2(roundTrippedFreq / frequency));
        expect(centsDiff).toBeLessThanOrEqual(50);
      }),
      PBT_OPTS,
    );
  });
});

describe('PBT: midiNoteToKeyIndex invariant (PBT-03)', () => {
  it('output is always in [0, 87] for inputs in [21, 108]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 21, max: 108 }), (midiNote) => {
        const keyIndex = midiNoteToKeyIndex(midiNote);
        expect(keyIndex).not.toBeNull();
        expect(keyIndex).toBeGreaterThanOrEqual(0);
        expect(keyIndex).toBeLessThanOrEqual(87);
      }),
      PBT_OPTS,
    );
  });

  it('returns null for any integer outside [21, 108]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -10000, max: 20 }),
          fc.integer({ min: 109, max: 10000 }),
        ),
        (midiNote) => {
          expect(midiNoteToKeyIndex(midiNote)).toBeNull();
        },
      ),
      PBT_OPTS,
    );
  });
});

describe('PBT: getAllKeyGeometry invariants (PBT-03)', () => {
  it('always returns 88 rects, 52 white and 36 black for valid width', () => {
    fc.assert(
      fc.property(fc.float({ min: 100, max: 4000 }), (totalWidth) => {
        if (!Number.isFinite(totalWidth) || totalWidth <= 0) return;
        const rects = getAllKeyGeometry(totalWidth);
        expect(rects).toHaveLength(88);
        expect(rects.filter((r) => !r.isBlack)).toHaveLength(52);
        expect(rects.filter((r) => r.isBlack)).toHaveLength(36);
      }),
      PBT_OPTS,
    );
  });

  it('all rects have x >= 0, width > 0, height > 0', () => {
    fc.assert(
      fc.property(fc.float({ min: 100, max: 4000 }), (totalWidth) => {
        if (!Number.isFinite(totalWidth) || totalWidth <= 0) return;
        const rects = getAllKeyGeometry(totalWidth);
        rects.forEach((r) => {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.width).toBeGreaterThan(0);
          expect(r.height).toBeGreaterThan(0);
        });
      }),
      PBT_OPTS,
    );
  });
});

describe('PBT: out-of-range inputs always return null, never throw (PBT-03, PBT-07)', () => {
  it('keyIndexToNoteName: arbitrary integers outside [0, 87] return null', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -10000, max: -1 }),
          fc.integer({ min: 88, max: 10000 }),
        ),
        (keyIndex) => {
          expect(keyIndexToNoteName(keyIndex)).toBeNull();
        },
      ),
      PBT_OPTS,
    );
  });

  it('keyIndexToOctave: arbitrary integers outside [0, 87] return null', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -10000, max: -1 }),
          fc.integer({ min: 88, max: 10000 }),
        ),
        (keyIndex) => {
          expect(keyIndexToOctave(keyIndex)).toBeNull();
        },
      ),
      PBT_OPTS,
    );
  });

  it('isBlackKey: arbitrary integers outside [0, 87] return null', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -10000, max: -1 }),
          fc.integer({ min: 88, max: 10000 }),
        ),
        (keyIndex) => {
          expect(isBlackKey(keyIndex)).toBeNull();
        },
      ),
      PBT_OPTS,
    );
  });

  it('getKeyGeometry: arbitrary integers outside [0, 87] return null', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -10000, max: -1 }),
          fc.integer({ min: 88, max: 10000 }),
        ),
        (keyIndex) => {
          expect(getKeyGeometry(keyIndex, 1040)).toBeNull();
        },
      ),
      PBT_OPTS,
    );
  });
});
