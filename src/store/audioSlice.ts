import type { StateCreator } from 'zustand';
import type { AudioState, PermissionState } from '@/shared/types';
import { DEFAULT_NOISE_GATE } from '@/shared/constants';

export type { AudioState };

export const createAudioSlice: StateCreator<AudioState> = (set) => ({
  isListening: false,
  permissionState: 'prompt' as PermissionState,
  audioLevel: 0,
  noiseGateThreshold: DEFAULT_NOISE_GATE,
  inputMode: 'mic',

  setIsListening: (v) => set({ isListening: v }),
  setPermissionState: (v) => set({ permissionState: v }),
  setAudioLevel: (v) => set({ audioLevel: v }),
  setNoiseGateThreshold: (v) => set({ noiseGateThreshold: v }),
  setInputMode: (v) => set({ inputMode: v }),
});
