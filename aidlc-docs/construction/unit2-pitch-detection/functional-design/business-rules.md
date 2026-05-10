# Unit 2: Pitch Detection — Business Rules

---

## BR-01: Clarity Threshold
- **Rule**: A pitchy detection is valid only when `clarity >= 0.90`
- **Source**: Q1 answer B (medium-high confidence)
- **When violated**: Detection treated as null; debounce counter incremented (see BR-09)
- **Rationale**: PianoVora disables all browser audio processing (no AGC, no noise suppression), so the raw signal is clean enough for 0.90; stricter 0.95 could miss soft note onsets

## BR-02: Piano Frequency Range Filter
- **Rule**: Valid frequency must be within `[27.5 Hz, 4186.0 Hz]` (A0 to C8 inclusive)
- **Boundaries**: 27.5 Hz = A0 (MIDI 21); 4186.0 Hz = C8 (MIDI 108)
- **When violated**: Frequency treated as null (out-of-range harmonics or ambient noise artefacts)
- **Combined with BR-01**: Both clarity AND range must pass; either failure → null path

## BR-03: Noise Gate Integration
- **Rule**: When `audioSlice.isListening = false`, the pitch detection loop must not run
- **Implementation**: `usePitchDetector` monitors `isListening`; on false, cancel the rAF loop and write `detectedNote = null` if previously non-null
- **Source**: PD-05 (noise gate), PD-03 (client-side only)

## BR-04: Change-Only Store Writes
- **Rule**: `pitchSlice.detectedNote` is updated only when the detected `keyIndex` differs from `prevKeyIndexRef.current`
- **Source**: Q2 answer A
- **Effect**: Sustaining the same note produces zero Zustand writes per frame (no re-renders for unchanged notes)
- **Exception**: The debounce null-emission path (BR-09) does write null even though null is already the "previous" during sustained silence

## BR-05: Note History — Max 5 Entries
- **Rule**: `pitchSlice.noteHistory` holds at most 5 `DetectedNote` objects
- **Source**: UI-07 ("last 5 notes")
- **Update strategy**: On each new note emission, prepend to history and trim to 5 with `.slice(0, 5)`

## BR-06: Note History — Change-Driven Only
- **Rule**: `noteHistory` is only updated when a new (different) note is emitted
- **Effect**: Holding the same note does not add duplicate history entries
- **Follows from**: BR-04 (same note → no store write → no history update)

## BR-07: Note Release Debounce — 3 Frames
- **Rule**: `setDetectedNote(null)` is only emitted after 3 consecutive frames of null/below-threshold detection
- **Source**: Q3 answer B (~50ms debounce)
- **Counter**: `nullFrameCountRef` tracks consecutive null frames; resets to 0 on any valid detection
- **Exception for isListening=false**: Immediate null emission (BR-03 takes precedence — user stopped deliberately)

## BR-08: MIDI Mapping Formula
- **Rule**: `midiNote = Math.round(12 × log₂(frequency / 440) + 69)`
- **Reference**: A4 = 440 Hz = MIDI 69; equal temperament (12-TET)
- **Post-mapping clamp**: Result clamped to [21, 108]; any result outside this range is treated as out-of-piano-range (same as BR-02)

## BR-09: Key Index Formula
- **Rule**: `keyIndex = midiNote − 21`
- **Range**: [0, 87] where 0 = A0, 87 = C8
- **Invariant**: Valid key index is always in [0, 87]; this is a PBT-03 property-based test target

## BR-10: Black Key Identification
- **Rule**: A key is black if `(midiNote % 12)` is in `{1, 3, 6, 8, 10}`
- **Semitone map**: 0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B
- **Black semitones**: C# (1), D# (3), F# (6), G# (8), A# (10)

## BR-11: Note Name Format
- **Rule**: Display name is `noteName + octave` — e.g. `"C#4"`, `"A0"`, `"C8"`
- **Octave formula**: `Math.floor((midiNote − 12) / 12)` — yields 0 for A0, 4 for A4, 8 for C8
- **Note name array**: `['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']` indexed by `midiNote % 12`

## BR-12: Sample Rate Injection
- **Rule**: `pitchDetectorRef.findPitch(buffer, sampleRate)` must use the AudioContext's actual sample rate
- **Source**: `analyserRef.current.context.sampleRate`
- **Never hardcode**: Do not assume 44,100 Hz; some devices run at 48,000 Hz

## BR-13: PitchDetector Singleton
- **Rule**: `PitchDetector.forFloat32Array(FFT_SIZE)` is instantiated once per hook mount and stored in a ref
- **Rationale**: Creating a new PitchDetector per frame is expensive (allocates internal buffers each time)

## BR-14: White Key Count Algorithm
- **Rule**: The number of white keys from A0 (MIDI 21) up to (but not including) a given MIDI note is the spatial anchor for all key geometry calculations
- **Formula**: Count MIDI notes in range [21, midiNote) whose `note % 12` is in `{0, 2, 4, 5, 7, 9, 11}` (white semitones: C, D, E, F, G, A, B)
- **Invariant**: Total white keys across all 88 keys = 52; total black keys = 36 (PBT-03 target)

## BR-15: Black Key Geometry Centering
- **Rule**: Each black key is horizontally centred between the x-positions of its two flanking white keys
- **Formula**: `x = (leftWhiteKey.x + leftWhiteKey.width + rightWhiteKey.x) / 2 − blackKeyWidth / 2`
- **Special case**: The first key A0 and last key C8 have no black key neighbours beyond the keyboard boundary; no special casing needed as these are white keys
