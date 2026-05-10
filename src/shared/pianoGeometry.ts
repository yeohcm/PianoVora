import type { KeyRect } from './types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

// Number of white keys from A0 (keyIndex=0) up to but not including each keyIndex.
// Precomputed so getKeyGeometry is O(1) with no per-call iteration.
const WHITE_KEYS_BEFORE: readonly number[] = (() => {
  const arr: number[] = [];
  let count = 0;
  for (let i = 0; i < 88; i++) {
    arr.push(count);
    if (!BLACK_SEMITONES.has((i + 21) % 12)) count++;
  }
  return arr;
})();

export function frequencyToMidiNote(frequency: number): number | null {
  if (frequency < 27.5 || frequency > 4186.0) return null;
  const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
  if (midi < 21 || midi > 108) return null;
  return midi;
}

export function midiNoteToKeyIndex(midiNote: number): number | null {
  if (midiNote < 21 || midiNote > 108) return null;
  return midiNote - 21;
}

export function keyIndexToNoteName(keyIndex: number): string | null {
  if (keyIndex < 0 || keyIndex > 87) return null;
  return NOTE_NAMES[(keyIndex + 21) % 12];
}

export function keyIndexToOctave(keyIndex: number): number | null {
  if (keyIndex < 0 || keyIndex > 87) return null;
  return Math.floor((keyIndex + 21 - 12) / 12);
}

export function isBlackKey(keyIndex: number): boolean | null {
  if (keyIndex < 0 || keyIndex > 87) return null;
  return BLACK_SEMITONES.has((keyIndex + 21) % 12);
}

export function getKeyGeometry(keyIndex: number, totalWidth: number): KeyRect | null {
  if (keyIndex < 0 || keyIndex > 87 || totalWidth <= 0) return null;

  const whiteKeyWidth = totalWidth / 52;
  const whiteKeyHeight = whiteKeyWidth * 6.5;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyHeight = whiteKeyHeight * 0.65;
  const black = BLACK_SEMITONES.has((keyIndex + 21) % 12);

  if (!black) {
    return {
      x: WHITE_KEYS_BEFORE[keyIndex] * whiteKeyWidth,
      y: 0,
      width: whiteKeyWidth,
      height: whiteKeyHeight,
      isBlack: false,
      keyIndex,
    };
  }

  // No two adjacent black keys exist in the chromatic scale, so keyIndex±1 are always white.
  // Centre the black key on the boundary between its flanking white keys (BR-15).
  const leftX = WHITE_KEYS_BEFORE[keyIndex - 1] * whiteKeyWidth;
  const rightX = WHITE_KEYS_BEFORE[keyIndex + 1] * whiteKeyWidth;
  return {
    x: (leftX + whiteKeyWidth + rightX) / 2 - blackKeyWidth / 2,
    y: 0,
    width: blackKeyWidth,
    height: blackKeyHeight,
    isBlack: true,
    keyIndex,
  };
}

export function getAllKeyGeometry(totalWidth: number): KeyRect[] {
  if (totalWidth <= 0) return [];
  return Array.from({ length: 88 }, (_, i) => getKeyGeometry(i, totalWidth)!);
}
