import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useAppStore } from '@/store/appStore';

const mockStart = vi.fn();
const mockStop = vi.fn();

vi.mock('@/features/audio/useAudioEngine', () => ({
  useAudioEngine: () => ({
    start: mockStart,
    stop: mockStop,
    analyserRef: { current: null },
  }),
}));

vi.mock('@/features/pitch/usePitchDetector', () => ({
  usePitchDetector: () => undefined,
}));

vi.mock('@/features/keyboard/PianoKeyboard', () => ({
  PianoKeyboard: () => <div data-testid="piano-keyboard-mock" />,
}));

vi.mock('@/features/ui/HudCanvasOverlay', () => ({
  HudCanvasOverlay: () => <div data-testid="hud-canvas-overlay-mock" />,
}));

vi.mock('@/features/audio/MicToggle', () => ({
  default: ({ onStart, onStop }: { onStart: () => void; onStop: () => void }) => (
    <button data-testid="mic-toggle" onClick={onStart} onBlur={onStop}>Mic</button>
  ),
}));

vi.mock('@/features/audio/AudioLevelMeter', () => ({
  default: () => <div data-testid="audio-level-meter-mock" />,
}));

vi.mock('@/features/audio/SensitivitySlider', () => ({
  default: () => <div data-testid="sensitivity-slider-mock" />,
}));

vi.mock('@/features/ui/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector" />,
}));

vi.mock('@/features/ui/WalkthroughOverlay', () => ({
  WalkthroughOverlay: ({ step, onNext, onDone }: { step: number; onNext: () => void; onDone: () => void }) => (
    <div data-testid="walkthrough-overlay-mock">
      <span data-testid="tour-step">{step}</span>
      <button data-testid="tour-next-btn" onClick={onNext}>Next</button>
      <button data-testid="tour-done-btn" onClick={onDone}>Done</button>
    </div>
  ),
  TOUR_STEP_COUNT: 2,
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
    inputMode:           'mic',
    ...overrides,
  });
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockSetItem.mockClear();
    mockStart.mockClear();
    mockStop.mockClear();
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

  describe('tour flow', () => {
    it('does not render walkthrough before modal is dismissed', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      expect(screen.queryByTestId('walkthrough-overlay-mock')).not.toBeInTheDocument();
    });

    it('renders walkthrough after "Got it" is clicked', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      expect(screen.getByTestId('walkthrough-overlay-mock')).toBeInTheDocument();
    });

    it('starts tour on step 0', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      expect(screen.getByTestId('tour-step').textContent).toBe('0');
    });

    it('clicking Next advances to step 1', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      fireEvent.click(screen.getByTestId('tour-next-btn'));
      expect(screen.getByTestId('tour-step').textContent).toBe('1');
    });

    it('clicking Next on last step closes walkthrough', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      // advance to last step (step 1 of 2)
      fireEvent.click(screen.getByTestId('tour-next-btn'));
      fireEvent.click(screen.getByTestId('tour-next-btn'));
      expect(screen.queryByTestId('walkthrough-overlay-mock')).not.toBeInTheDocument();
    });

    it('clicking Done closes walkthrough', () => {
      resetStore({ onboardingDismissed: false });
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
      fireEvent.click(screen.getByTestId('tour-done-btn'));
      expect(screen.queryByTestId('walkthrough-overlay-mock')).not.toBeInTheDocument();
    });

    it('does not render walkthrough when onboardingDismissed already true', () => {
      resetStore({ onboardingDismissed: true });
      render(<AppLayout />);
      expect(screen.queryByTestId('walkthrough-overlay-mock')).not.toBeInTheDocument();
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

  describe('mode toggle (mic vs synth)', () => {
    it('renders segmented mode toggle button in header', () => {
      render(<AppLayout />);
      expect(screen.getByTestId('mode-toggle-mic')).toBeInTheDocument();
      expect(screen.getByTestId('mode-toggle-synth')).toBeInTheDocument();
    });

    it('defaults inputMode to mic', () => {
      render(<AppLayout />);
      expect(useAppStore.getState().inputMode).toBe('mic');
    });

    it('clicking synth toggle button switches mode to synth', () => {
      render(<AppLayout />);
      fireEvent.click(screen.getByTestId('mode-toggle-synth'));
      expect(useAppStore.getState().inputMode).toBe('synth');
    });

    it('switching to synth mode updates HUD standby text', () => {
      resetStore({ inputMode: 'synth' });
      render(<AppLayout />);
      expect(screen.getByText('Press a key to play')).toBeInTheDocument();
      expect(screen.getByText('Synthesizer active…')).toBeInTheDocument();
    });

    it('resumes listening when switching back to mic mode if wasListening was true', () => {
      resetStore({ inputMode: 'mic', isListening: true });
      const { rerender } = render(<AppLayout />);
      
      act(() => {
        useAppStore.setState({ inputMode: 'synth' });
      });
      act(() => {
        useAppStore.setState({ isListening: false });
      });
      rerender(<AppLayout />);

      mockStart.mockClear();
      act(() => {
        useAppStore.setState({ inputMode: 'mic' });
      });
      rerender(<AppLayout />);

      expect(mockStart).toHaveBeenCalled();
    });

    it('does not resume listening when switching back to mic mode if wasListening was false', () => {
      resetStore({ inputMode: 'mic', isListening: false });
      const { rerender } = render(<AppLayout />);
      
      act(() => {
        useAppStore.setState({ inputMode: 'synth' });
      });
      rerender(<AppLayout />);

      mockStart.mockClear();
      act(() => {
        useAppStore.setState({ inputMode: 'mic' });
      });
      rerender(<AppLayout />);

      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  describe('mobile menu toggle', () => {
    it('renders mobile toggle menu button in header', () => {
      render(<AppLayout />);
      expect(screen.getByTestId('menu-toggle-btn')).toBeInTheDocument();
    });

    it('toggles controls group open status on click', () => {
      render(<AppLayout />);
      
      const menuBtn = screen.getByTestId('menu-toggle-btn');
      const controls = screen.getByLabelText('Input Mode Switch').parentElement;

      // Initially closed / has hidden class
      expect(controls).toHaveClass('hidden');

      // Click to open
      fireEvent.click(menuBtn);
      expect(controls).toHaveClass('flex');
      expect(controls).not.toHaveClass('hidden');

      // Click to close
      fireEvent.click(menuBtn);
      expect(controls).toHaveClass('hidden');
    });
  });
});
