import type { KeyboardEvent } from 'react';

interface OnboardingModalProps {
  onDismiss: () => void;
}

function handleKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
  if (e.key === 'Escape') e.preventDefault();
}

export default function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      data-testid="onboarding-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="bg-[#12121e] border border-white/20 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
        onKeyDown={handleKeyDown}
        data-testid="onboarding-modal"
      >
        <h2 id="onboarding-title" className="text-2xl font-bold mb-4">
          Welcome to PianoVora
        </h2>
        <ul className="space-y-2 mb-6 text-white/80">
          <li>Play a note — the matching piano key lights up in real time</li>
          <li>Click any key to try demo mode without a microphone</li>
          <li>Switch between Cyber, Aurora, and Sunset neon themes</li>
          <li>Your last 5 notes appear in the history panel below the keyboard</li>
        </ul>
        <button
          onClick={onDismiss}
          autoFocus
          className="w-full py-3 rounded-lg font-semibold bg-[var(--neon-accent)] text-black"
          data-testid="onboarding-dismiss-btn"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
