# Unit 2: Pitch Detection — Business Logic Model

---

## Flow 1: Pitch Detection Pipeline (per animation frame)

Executed inside `usePitchDetector`'s `requestAnimationFrame` loop. Runs only when `isListening = true`.

```
rAF callback fires
  |
  v
[Guard: isListening?]
  → false → cancel loop, ensure detectedNote = null → end
  → true  → continue
  |
  v
[Read waveform]
analyserRef.current.getFloatTimeDomainData(bufferRef.current)
  (fills pre-allocated Float32Array(2048) in-place)
  |
  v
[Run pitchy]
[frequency, clarity] = pitchDetectorRef.current.findPitch(
    bufferRef.current,
    analyserRef.current.context.sampleRate
)
  |
  v
[Validity check]
clarity >= 0.90 AND frequency in [27.5, 4186.0]?
  → no  → treat as null detection → go to Flow 3 (debounce)
  → yes → continue
  |
  v
[MIDI mapping]
midiNote = Math.round(12 × log₂(frequency / 440) + 69)
clamp midiNote to [21, 108]
  |
  v
[Key index mapping]
keyIndex = midiNote − 21            (range 0–87)
  |
  v
[Note change check (Flow 2)]
keyIndex === prevKeyIndexRef.current?
  → yes → same note sustained → reset nullFrameCount → end (no store write)
  → no  → new note detected → continue
  |
  v
[Reset debounce counter]
nullFrameCountRef.current = 0
prevKeyIndexRef.current = keyIndex
  |
  v
[Build DetectedNote]
{
  midiNote,
  keyIndex,
  noteName: keyIndexToNoteName(keyIndex),   // e.g. "C#"
  octave:   keyIndexToOctave(keyIndex),     // e.g. 4
  frequency,
  clarity,
  timestamp: performance.now()
}
  |
  v
[Write to pitchSlice]
setDetectedNote(detectedNote)
  |
  v
[Update note history (Flow 4)]
  |
  v
requestAnimationFrame(loop)   ← schedule next frame
```

---

## Flow 2: Note Change Detection

`usePitchDetector` maintains `prevKeyIndexRef` to suppress redundant store writes for sustained notes.

```
State: prevKeyIndexRef.current (number | null)

On valid detection with keyIndex K:
  IF K === prevKeyIndexRef.current:
    → same note still sounding
    → no store write
    → reset nullFrameCountRef.current = 0 (cancel any pending release)
  ELSE:
    → note changed (new note or first detection)
    → emit new DetectedNote (see Flow 1)
    → prevKeyIndexRef.current = K

On note release (null emission — see Flow 3):
    → prevKeyIndexRef.current = null
```

---

## Flow 3: Note Release Debounce (3-frame window)

Protects against single-frame detection gaps causing visual flicker. Only after 3 consecutive frames of null/below-threshold does `usePitchDetector` declare the note released.

```
State: nullFrameCountRef.current (number, starts at 0)

Each frame with null/invalid detection:
  nullFrameCountRef.current += 1

  IF nullFrameCountRef.current < 3:
    → hold last note (no store write)
    → end frame

  IF nullFrameCountRef.current >= 3:
    → note is genuinely released
    → setDetectedNote(null)         ← Zustand write
    → prevKeyIndexRef.current = null
    → nullFrameCountRef.current = 0
    → end frame

Each frame with valid detection:
  nullFrameCountRef.current = 0     ← reset counter
  → proceed to Flow 2
```

---

## Flow 4: Note History Update

Triggered whenever `setDetectedNote` is called with a non-null value. History tracks the most recent 5 unique note changes.

```
On new DetectedNote emission:
  noteHistory = [detectedNote, ...prevNoteHistory].slice(0, 5)
  setNoteHistory(noteHistory)

Result: an array of up to 5 DetectedNote objects, most recent first.
History updates only on note change (same-note sustain is not duplicated).
```

---

## Flow 5: usePitchDetector Lifecycle

```
Hook mounts
  → Create PitchDetector.forFloat32Array(FFT_SIZE)
  → Store in pitchDetectorRef (never recreated)
  → Subscribe to isListening via Zustand

isListening → true:
  → Start rAF loop (Flow 1)
  → animationFrameRef.current = requestAnimationFrame(loop)

isListening → false:
  → Cancel rAF: cancelAnimationFrame(animationFrameRef.current)
  → Emit null: setDetectedNote(null), prevKeyIndexRef = null, nullFrameCount = 0

Hook unmounts:
  → cancelAnimationFrame(animationFrameRef.current)
  → setDetectedNote(null)
```

---

## Flow 6: pianoGeometry Pure Function Data Flows

All functions in `src/shared/pianoGeometry.ts` are pure — no side effects, no React, no imports from features or store.

```
frequencyToMidiNote(frequency: number): number | null
  Input:  frequency in Hz
  Output: MIDI note number [21–108], or null if outside piano range [27.5Hz, 4186Hz]
  Formula: Math.round(12 × log₂(frequency / 440) + 69), clamp-checked

midiNoteToKeyIndex(midiNote: number): number | null
  Input:  MIDI note [21–108]
  Output: key index [0–87], or null if outside range
  Formula: midiNote − 21

keyIndexToNoteName(keyIndex: number): string
  Input:  key index [0–87]
  Output: note name without octave: 'C' | 'C#' | 'D' | ... | 'B'
  Formula: NOTE_NAMES[(keyIndex + 21) % 12]
           where NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

keyIndexToOctave(keyIndex: number): number
  Input:  key index [0–87]
  Output: octave number (A0=0, C1=1, ..., C8=8)
  Formula: Math.floor((keyIndex + 21 − 12) / 12)
           Verification: keyIndex=0 (A0, MIDI 21) → Math.floor(9/12)=0 ✓
                         keyIndex=3 (C1, MIDI 24) → Math.floor(12/12)=1 ✓
                         keyIndex=87 (C8, MIDI 108) → Math.floor(96/12)=8 ✓

isBlackKey(keyIndex: number): boolean
  Input:  key index [0–87]
  Output: true if the key is a black key
  Formula: BLACK_SEMITONES.has((keyIndex + 21) % 12)
           where BLACK_SEMITONES = new Set([1, 3, 6, 8, 10])

getKeyGeometry(keyIndex: number, totalWidth: number): KeyRect
  Input:  key index [0–87], total SVG keyboard width in pixels
  Output: KeyRect { x, y, width, height, isBlack, keyIndex }
  Algorithm:
    wkw = totalWidth / 52         (white key width)
    wkh = wkw × 6.5               (white key height — standard piano proportions)
    bkw = wkw × 0.60              (black key width)
    bkh = wkh × 0.65             (black key height)

    if white key:
      x = whiteKeysBefore(keyIndex) × wkw
      y = 0, width = wkw, height = wkh

    if black key:
      leftWhiteX  = getKeyGeometry(left white neighbour).x
      rightWhiteX = getKeyGeometry(right white neighbour).x
      x = (leftWhiteX + rightWhiteX) / 2 − bkw / 2
      y = 0, width = bkw, height = bkh

getAllKeyGeometry(totalWidth: number): KeyRect[]
  Input:  total SVG keyboard width
  Output: array of 88 KeyRect objects, indices 0–87
  Constraint: exactly 52 white key rects + 36 black key rects
```
