import type { StateCreator } from 'zustand';

export type NeonTheme = 'cyber' | 'aurora' | 'sunset' | 'rainbow';

export interface UiState {
  theme:                  NeonTheme;
  onboardingDismissed:    boolean;
  setTheme:               (t: NeonTheme) => void;
  setOnboardingDismissed: (v: boolean) => void;
}

function safeReadItem(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

const VALID_THEMES = new Set(['cyber', 'aurora', 'sunset', 'rainbow']);

export const createUiSlice: StateCreator<UiState> = (set) => {
  const storedTheme = safeReadItem('pianovora_theme');
  const initialTheme: NeonTheme = VALID_THEMES.has(storedTheme ?? '') ? (storedTheme as NeonTheme) : 'cyber';
  const initialOnboardingDismissed = safeReadItem('pianovora_onboarding_dismissed') === 'true';

  return {
    theme:                  initialTheme,
    onboardingDismissed:    initialOnboardingDismissed,
    setTheme:               (t) => set({ theme: t }),
    setOnboardingDismissed: (v) => set({ onboardingDismissed: v }),
  };
};
