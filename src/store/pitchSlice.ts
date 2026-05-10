import type { StateCreator } from 'zustand';
import type { DetectedNote } from '@/shared/types';

export interface PitchState {
  detectedNote: DetectedNote | null;
  noteHistory: DetectedNote[];
  setDetectedNote: (note: DetectedNote | null) => void;
  setNoteHistory: (history: DetectedNote[]) => void;
}

export const createPitchSlice: StateCreator<PitchState> = (set) => ({
  detectedNote: null,
  noteHistory: [],
  setDetectedNote: (note) => set({ detectedNote: note }),
  setNoteHistory: (history) => set({ noteHistory: history }),
});
