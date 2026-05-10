import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { useAppStore } from '@/store/appStore';
import { createUiSlice, type NeonTheme } from '@/store/uiSlice';

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

  describe('localStorage initialisation (Q2=A)', () => {
    let mockGetItem: ReturnType<typeof vi.fn>;
    let mockStorage: Storage;

    beforeEach(() => {
      mockGetItem = vi.fn().mockReturnValue(null);
      mockStorage = {
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      } as unknown as Storage;
      vi.stubGlobal('localStorage', mockStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function callFactory() {
      const set = vi.fn() as unknown as Parameters<typeof createUiSlice>[0];
      const get = vi.fn() as unknown as Parameters<typeof createUiSlice>[1];
      return createUiSlice(set, get, {} as Parameters<typeof createUiSlice>[2]);
    }

    it('defaults theme to cyber when localStorage has no stored theme', () => {
      const slice = callFactory();
      expect(slice.theme).toBe('cyber');
    });

    it('reads stored theme "aurora" from localStorage', () => {
      mockGetItem.mockImplementation((key: string) => key === 'pianovora_theme' ? 'aurora' : null);
      const slice = callFactory();
      expect(slice.theme).toBe('aurora');
    });

    it('reads stored theme "sunset" from localStorage', () => {
      mockGetItem.mockImplementation((key: string) => key === 'pianovora_theme' ? 'sunset' : null);
      const slice = callFactory();
      expect(slice.theme).toBe('sunset');
    });

    it('defaults to cyber when stored theme is unrecognised', () => {
      mockGetItem.mockImplementation((key: string) => key === 'pianovora_theme' ? 'invalid-theme' : null);
      const slice = callFactory();
      expect(slice.theme).toBe('cyber');
    });

    it('defaults onboardingDismissed to false when key is absent', () => {
      const slice = callFactory();
      expect(slice.onboardingDismissed).toBe(false);
    });

    it('sets onboardingDismissed to true when localStorage value is "true"', () => {
      mockGetItem.mockImplementation((key: string) => key === 'pianovora_onboarding_dismissed' ? 'true' : null);
      const slice = callFactory();
      expect(slice.onboardingDismissed).toBe(true);
    });

    it('keeps onboardingDismissed false when localStorage value is not "true"', () => {
      mockGetItem.mockImplementation((key: string) => key === 'pianovora_onboarding_dismissed' ? 'false' : null);
      const slice = callFactory();
      expect(slice.onboardingDismissed).toBe(false);
    });

    it('defaults both values when localStorage throws', () => {
      mockGetItem.mockImplementation(() => { throw new Error('SecurityError'); });
      const slice = callFactory();
      expect(slice.theme).toBe('cyber');
      expect(slice.onboardingDismissed).toBe(false);
    });
  });

  describe('PBT: theme transitions', () => {
    it('any sequence of setTheme calls ends with the last value set', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom<NeonTheme>('cyber', 'aurora', 'sunset', 'rainbow'), { minLength: 1, maxLength: 20 }),
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
      const validThemes: NeonTheme[] = ['cyber', 'aurora', 'sunset', 'rainbow'];
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
