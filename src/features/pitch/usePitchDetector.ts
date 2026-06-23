import { useEffect, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import { useAppStore } from '@/store/appStore';
import {
  frequencyToMidiNote,
  midiNoteToKeyIndex,
  keyIndexToNoteName,
  keyIndexToOctave,
} from '@/shared/pianoGeometry';
import { FFT_SIZE } from '@/shared/constants';
import type { DetectedNote } from '@/shared/types';

interface PitchDetectorOptions {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}

export function usePitchDetector({ analyserRef }: PitchDetectorOptions): void {
  const isListening = useAppStore((s) => s.isListening);
  const inputMode = useAppStore((s) => s.inputMode);
  const setDetectedNote = useAppStore((s) => s.setDetectedNote);
  const setNoteHistory = useAppStore((s) => s.setNoteHistory);

  // Owned refs — never trigger re-renders
  const pitchDetectorRef = useRef<ReturnType<typeof PitchDetector.forFloat32Array> | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
  const animationFrameRef = useRef<number>(0);
  const lastDetectionTimeRef = useRef<number>(0);
  const prevKeyIndexRef = useRef<number | null>(null);
  const nullFrameCountRef = useRef<number>(0);

  // Create PitchDetector singleton once on mount (BR-13)
  useEffect(() => {
    pitchDetectorRef.current = PitchDetector.forFloat32Array(FFT_SIZE);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      setDetectedNote(null);
    };
  }, [setDetectedNote]);

  // rAF detection loop — starts/stops with isListening (NFR-R-03, BR-03)
  useEffect(() => {
    if (!isListening || inputMode === 'synth') {
      cancelAnimationFrame(animationFrameRef.current);
      setDetectedNote(null);
      prevKeyIndexRef.current = null;
      nullFrameCountRef.current = 0;
      return;
    }

    let cancelled = false;

    // Debounce coordinator: 3-frame hold before emitting null (BR-07, NFR-R-02)
    const handleNullFrame = (): void => {
      nullFrameCountRef.current += 1;
      if (nullFrameCountRef.current >= 3) {
        if (prevKeyIndexRef.current !== null) {
          setDetectedNote(null);
          prevKeyIndexRef.current = null;
        }
        nullFrameCountRef.current = 0;
      }
    };

    const loop = (): void => {
      if (cancelled) return;

      // Timestamp frame gate: enforce ≥33ms between pitchy calls (~30fps, NFR-P-03)
      const now = performance.now();
      if (now - lastDetectionTimeRef.current < 33) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      lastDetectionTimeRef.current = now;

      // Null guard: skip frame if analyser not yet available (NFR-R-01)
      if (!analyserRef.current || !pitchDetectorRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Fill pre-allocated buffer and run pitchy (NFR-P-02, BR-12)
      analyserRef.current.getFloatTimeDomainData(bufferRef.current);
      const [frequency, clarity] = pitchDetectorRef.current.findPitch(
        bufferRef.current as unknown as Float32Array,
        analyserRef.current.context.sampleRate,
      );

      // Validity check: clarity threshold (BR-01) and piano frequency range (BR-02)
      if (clarity < 0.9 || frequency < 27.5 || frequency > 4186.0) {
        handleNullFrame();
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // MIDI mapping (BR-08)
      const midiNote = frequencyToMidiNote(frequency);
      if (midiNote === null) {
        // Defensive path: frequency checks above should prevent this
        handleNullFrame();
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Key index mapping (BR-09)
      const keyIndex = midiNoteToKeyIndex(midiNote)!; // safe: midiNote validated above

      // Note change emitter: suppress store writes for sustained notes (BR-04)
      if (keyIndex === prevKeyIndexRef.current) {
        nullFrameCountRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // New note detected — build and emit
      nullFrameCountRef.current = 0;
      prevKeyIndexRef.current = keyIndex;

      const note: DetectedNote = {
        midiNote,
        keyIndex,
        noteName: keyIndexToNoteName(keyIndex)!, // safe: keyIndex in [0,87]
        octave: keyIndexToOctave(keyIndex)!,      // safe: keyIndex in [0,87]
        frequency,
        clarity,
        timestamp: performance.now(),
      };

      setDetectedNote(note);

      // Prepend to history, cap at 5 (BR-05, BR-06)
      const prevHistory = useAppStore.getState().noteHistory;
      setNoteHistory([note, ...prevHistory].slice(0, 5));

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isListening, inputMode, analyserRef, setDetectedNote, setNoteHistory]);
}
