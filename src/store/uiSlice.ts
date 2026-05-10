import type { StateCreator } from 'zustand';

export type NeonTheme = 'cyber' | 'aurora' | 'sunset';

export interface UiState {
  theme:                  NeonTheme;
  onboardingDismissed:    boolean;
  setTheme:               (t: NeonTheme) => void;
  setOnboardingDismissed: (v: boolean) => void;
}

export const createUiSlice: StateCreator<UiState> = (set) => ({
  theme:                  'cyber',
  onboardingDismissed:    false,
  setTheme:               (t) => set({ theme: t }),
  setOnboardingDismissed: (v) => set({ onboardingDismissed: v }),
});
