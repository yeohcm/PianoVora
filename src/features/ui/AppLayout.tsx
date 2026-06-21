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
  const detectedNote           = useAppStore((s) => s.detectedNote);

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
        className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/10 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4"
        data-testid="app-header"
      >
        {/* Brand logo */}
        <div className="flex items-center gap-2 mr-auto sm:mr-0 select-none">
          <span 
            className="font-black text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[var(--neon-accent)]"
            style={{ textShadow: '0 0 10px var(--glow-colour)' }}
          >
            PianoVora
          </span>
        </div>

        {/* Controls group */}
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-end">
          {/* Audio Input Group */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1.5 px-3 shadow-inner">
            <MicToggle onStart={start} onStop={stop} />
            <div className="w-24 sm:w-28 md:w-32 flex flex-col gap-1 justify-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold leading-none select-none">Level</span>
              <div className="h-1.5 flex items-center">
                <AudioLevelMeter />
              </div>
            </div>
          </div>

          {/* Sensitivity Group */}
          <div className="w-full sm:w-44 md:w-56 max-w-xs">
            <SensitivitySlider />
          </div>

          {/* Theme Selector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-1.5 px-2.5">
            <ThemeSelector />
          </div>
        </div>
      </header>

      {(permissionState === 'denied' || permissionState === 'error') && (
        <ErrorBanner permissionState={permissionState} />
      )}

      <main className="flex-1 flex flex-col items-center justify-between p-6 overflow-hidden" data-testid="app-main">
        {/* Central Visualizer / Note HUD */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl my-4">
          <div 
            className="w-full max-w-md p-8 rounded-2xl border border-white/10 backdrop-blur-lg bg-[#0e0e15]/40 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-white/20"
            style={{ 
              boxShadow: detectedNote 
                ? '0 0 40px -10px var(--glow-colour), inset 0 0 20px -10px var(--glow-colour)' 
                : '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Background glowing gradient */}
            <div 
              className="absolute inset-0 opacity-10 blur-3xl pointer-events-none transition-all duration-500"
              style={{
                background: detectedNote 
                  ? 'radial-gradient(circle, var(--glow-colour) 0%, transparent 70%)' 
                  : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
              }}
            />

            {detectedNote ? (
              <div className="flex flex-col items-center animate-fade-in" data-testid="hud-active">
                <span className="text-[10px] uppercase tracking-widest text-[var(--neon-accent)] font-bold mb-2 select-none">Detected Note</span>
                <h1 
                  className="text-6xl md:text-7xl font-black tracking-tighter text-white select-none animate-pulse-slow"
                  style={{ textShadow: '0 0 20px var(--glow-colour), 0 0 40px var(--glow-colour)' }}
                >
                  {detectedNote.noteName}
                  <span className="text-3xl md:text-4xl font-light text-white/70 ml-1">{detectedNote.octave}</span>
                </h1>
                <span className="text-sm font-semibold text-white/50 mt-4 tracking-wider">
                  {detectedNote.frequency.toFixed(2)} Hz
                </span>
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider select-none">Clarity: {Math.round(detectedNote.clarity * 100)}%</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6" data-testid="hud-standby">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4 select-none">
                  {/* Subtle pulsing background rings */}
                  <span className="absolute inset-0 rounded-full border border-white/5 animate-ping-slow scale-150 opacity-40" />
                  <span className="absolute inset-0 rounded-full border border-white/10 animate-ping-slow opacity-60" />
                  <span className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/40 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </span>
                </div>
                <span className="text-sm font-semibold tracking-wider text-white/40 uppercase animate-pulse-slow">Sing or play a key</span>
                <span className="text-xs text-white/30 mt-1 select-none">Waiting for input…</span>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard container wrapper */}
        <div className="w-full max-w-[1400px] mx-auto bg-black/40 border border-white/5 rounded-2xl p-2 md:p-4 shadow-2xl relative">
          <PianoKeyboard />
        </div>
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

