import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useAudioEngine } from '@/features/audio/useAudioEngine';
import { usePitchDetector } from '@/features/pitch/usePitchDetector';
import MicToggle from '@/features/audio/MicToggle';
import AudioLevelMeter from '@/features/audio/AudioLevelMeter';
import SensitivitySlider from '@/features/audio/SensitivitySlider';
import { ThemeSelector } from '@/features/ui/ThemeSelector';
import { PianoKeyboard } from '@/features/keyboard/PianoKeyboard';
import NoteHistoryPanel from './NoteHistoryPanel';
import OnboardingModal from './OnboardingModal';
import ErrorBanner from './ErrorBanner';
import { WalkthroughOverlay, TOUR_STEP_COUNT } from './WalkthroughOverlay';

function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); }
  catch { /* silently swallow — in-memory state remains correct */ }
}

export default function AppLayout() {
  const permissionState        = useAppStore((s) => s.permissionState);
  const onboardingDismissed    = useAppStore((s) => s.onboardingDismissed);
  const setOnboardingDismissed = useAppStore((s) => s.setOnboardingDismissed);
  const noteHistory            = useAppStore((s) => s.noteHistory);
  const theme                  = useAppStore((s) => s.theme);

  const [tourStep, setTourStep] = useState<number | null>(null);

  const { start, stop, analyserRef } = useAudioEngine();
  usePitchDetector({ analyserRef });

  useEffect(() => {
    safeSetItem('pianovora_theme', theme);
  }, [theme]);

  function handleDismiss(): void {
    setOnboardingDismissed(true);
    safeSetItem('pianovora_onboarding_dismissed', 'true');
    setTourStep(0);
  }

  function handleTourNext(): void {
    setTourStep((s) => (s !== null && s < TOUR_STEP_COUNT - 1 ? s + 1 : null));
  }

  function handleTourDone(): void {
    setTourStep(null);
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0a0a0f] text-white"
      data-testid="app-layout"
    >
      <header
        className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/10"
        data-testid="app-header"
      >
        <span className="font-bold text-lg tracking-wide mr-auto">PianoVora</span>
        <MicToggle onStart={start} onStop={stop} />
        <AudioLevelMeter />
        <SensitivitySlider />
        <ThemeSelector />
      </header>

      {(permissionState === 'denied' || permissionState === 'error') && (
        <ErrorBanner permissionState={permissionState} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden" data-testid="app-main">
        <PianoKeyboard />
      </main>

      <NoteHistoryPanel notes={noteHistory} />

      {!onboardingDismissed && (
        <OnboardingModal onDismiss={handleDismiss} />
      )}

      {tourStep !== null && (
        <WalkthroughOverlay
          step={tourStep}
          onNext={handleTourNext}
          onDone={handleTourDone}
        />
      )}
    </div>
  );
}
