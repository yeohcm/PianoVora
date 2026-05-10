import { create } from 'zustand';
import { createAudioSlice } from './audioSlice';
import type { AudioState } from './audioSlice';
import { createPitchSlice } from './pitchSlice';
import type { PitchState } from './pitchSlice';
import { createUiSlice } from './uiSlice';
import type { UiState } from './uiSlice';

export type AppState = AudioState & PitchState & UiState;

export const useAppStore = create<AppState>()((...a) => ({
  ...createAudioSlice(...a),
  ...createPitchSlice(...a),
  ...createUiSlice(...a),
}));
