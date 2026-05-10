import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAppStore } from '@/store/appStore';

vi.mock('@/features/audio/useAudioEngine', () => ({
  useAudioEngine: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    analyserRef: { current: null },
  }),
}));

vi.mock('@/features/pitch/usePitchDetector', () => ({
  usePitchDetector: () => undefined,
}));

vi.mock('@/features/keyboard/PianoKeyboard', () => ({
  PianoKeyboard: () => <div data-testid="piano-keyboard-mock" />,
}));

vi.mock('@/features/audio/MicToggle', () => ({
  default: ({ onStart, onStop }: { onStart: () => void; onStop: () => void }) => (
    <button data-testid="mic-toggle-mock" onClick={onStart} onBlur={onStop}>Mic</button>
  ),
}));

vi.mock('@/features/audio/AudioLevelMeter', () => ({
  default: () => <div data-testid="audio-level-meter-mock" />,
}));

vi.mock('@/features/audio/SensitivitySlider', () => ({
  default: () => <div data-testid="sensitivity-slider-mock" />,
}));

vi.mock('@/features/ui/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector-mock" />,
}));

import AppLayout from '@/features/ui/AppLayout';

const mockSetItem = vi.fn();
const mockGetItem = vi.fn(() => null);
const mockLocalStorage = { setItem: mockSetItem, getItem: mockGetItem, removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };

function resetStore(overrides: Record<string, unknown> = {}) {
  useAppStore.setState({
    permissionState:     'prompt',
    onboardingDismissed: false,
    noteHistory:         [],
    theme:               'cyber',
    isListening:         false,
    audioLevel:          0,
    noiseGateThreshold:  0.01,
    detectedNote:        null,
    ...overrides,
  });
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockSetItem.mockClear();
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('landmark structure', () => {
    it('renders app-layout root', () => {
      render(<AppLayout />);
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    it('renders header landmark', () => {
      render(<AppLayout />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders main landmark', () => {
      render(<AppLayout />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders note history region landmark', () => {
      render(<AppLayout />);
      expect(screen.getByRole('region', { name: 'Note history' })).toBeInTheDocument();
    });

    it('renders PianoVora logo text in header', () => {
      render(<AppLayout />);
      expect(screen.getByText('PianoVora')).toBeInTheDocument();
    });
  });

  describe('ErrorBanner conditional rendering', () => {
    it('does NOT render ErrorBanner when permissionState is prompt', () => {
      resetStore({ permissionState: 'prompt' });
      render(<AppLayout />);
      expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
    });

    it('does NOT render ErrorBanner when permissionState is granted', () => {
      resetStore({ permissionState: 'granted' });
      render(<AppLayout />);
      expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
    });

    it('renders ErrorBanner when permissionState is denied', () => {
      resetStore({ permissionState: 'denied' });
      render(<AppLayout />);
      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    });

    it('renders ErrorBanner when permissionState is error', () => {
      resetStore({ permissionState: 'error' });
      render(<AppLayout />);
      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    });
  });

  describe('OnboardingModal conditional rendering', () => {
    it('renders OnboardingModal when onboardingDismissed is false', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    });

    it('does NOT render OnboardingModal when onboardingDismissed is true', () => {
      resetStore({ onboardingDismissed: true });
      render(<AppLayout />);
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
    });
  });

  describe('dismiss flow', () => {
    it('clicking "Got it" sets onboardingDismissed to true in store', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      expect(useAppStore.getState().onboardingDismissed).toBe(true);
    });

    it('clicking "Got it" writes to localStorage', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      expect(mockSetItem).toHaveBeenCalledWith('pianovora_onboarding_dismissed', 'true');
    });

    it('modal unmounts after dismiss', async () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      });
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
    });
  });

  describe('theme persistence effect', () => {
    it('writes current theme to localStorage on mount', () => {
      resetStore({ theme: 'cyber' });
      render(<AppLayout />);
      expect(mockSetItem).toHaveBeenCalledWith('pianovora_theme', 'cyber');
    });

    it('writes updated theme to localStorage when theme changes', () => {
      resetStore({ theme: 'cyber' });
      render(<AppLayout />);
      act(() => {
        useAppStore.getState().setTheme('aurora');
      });
      expect(mockSetItem).toHaveBeenCalledWith('pianovora_theme', 'aurora');
    });
  });
});
