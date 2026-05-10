import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useAppStore } from '@/store/appStore';
import type { NeonTheme } from '@/store/uiSlice';

const PBT_OPTS = { seed: 42, verbose: true };

function resetStore() {
  useAppStore.setState({
    theme:               'cyber',
    onboardingDismissed: false,
  });
}

describe('uiSlice', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('defaults theme to cyber', () => {
      expect(useAppStore.getState().theme).toBe('cyber');
    });

    it('defaults onboardingDismissed to false', () => {
      expect(useAppStore.getState().onboardingDismissed).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('updates theme to aurora', () => {
      useAppStore.getState().setTheme('aurora');
      expect(useAppStore.getState().theme).toBe('aurora');
    });

    it('updates theme to sunset', () => {
      useAppStore.getState().setTheme('sunset');
      expect(useAppStore.getState().theme).toBe('sunset');
    });

    it('updates theme to cyber', () => {
      useAppStore.getState().setTheme('aurora');
      useAppStore.getState().setTheme('cyber');
      expect(useAppStore.getState().theme).toBe('cyber');
    });
  });

  describe('setOnboardingDismissed', () => {
    it('sets to true', () => {
      useAppStore.getState().setOnboardingDismissed(true);
      expect(useAppStore.getState().onboardingDismissed).toBe(true);
    });

    it('toggles back to false', () => {
      useAppStore.getState().setOnboardingDismissed(true);
      useAppStore.getState().setOnboardingDismissed(false);
      expect(useAppStore.getState().onboardingDismissed).toBe(false);
    });
  });

  describe('PBT: theme transitions', () => {
    it('any sequence of setTheme calls ends with the last value set', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom<NeonTheme>('cyber', 'aurora', 'sunset'), { minLength: 1, maxLength: 20 }),
          (themeSequence) => {
            resetStore();
            themeSequence.forEach((t) => useAppStore.getState().setTheme(t));
            const last = themeSequence[themeSequence.length - 1];
            expect(useAppStore.getState().theme).toBe(last);
          },
        ),
        PBT_OPTS,
      );
    });

    it('theme is always a valid NeonTheme value', () => {
      const validThemes: NeonTheme[] = ['cyber', 'aurora', 'sunset'];
      fc.assert(
        fc.property(
          fc.constantFrom<NeonTheme>(...validThemes),
          (t) => {
            resetStore();
            useAppStore.getState().setTheme(t);
            expect(validThemes).toContain(useAppStore.getState().theme);
          },
        ),
        PBT_OPTS,
      );
    });
  });
});
