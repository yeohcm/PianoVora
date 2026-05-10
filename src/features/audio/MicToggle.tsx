import { useState } from 'react';
import { useAppStore } from '@/store/appStore';

interface MicToggleProps {
  onStart: () => Promise<void>;
  onStop: () => void;
}

type MicState = 'idle' | 'requesting' | 'active' | 'stopped' | 'error';

function deriveMicState(
  permissionState: string,
  isListening: boolean,
  isRequesting: boolean,
): MicState {
  if (permissionState === 'denied' || permissionState === 'error') return 'error';
  if (isListening) return 'active';
  if (isRequesting) return 'requesting';
  if (permissionState === 'granted') return 'stopped';
  return 'idle';
}

const STATE_LABEL: Record<MicState, string> = {
  idle: 'Allow Microphone',
  requesting: 'Connecting…',
  active: 'Stop',
  stopped: 'Start',
  error: 'Mic Unavailable',
};

const STATE_ARIA_LABEL: Record<MicState, string> = {
  idle: 'Allow microphone access',
  requesting: 'Connecting to microphone',
  active: 'Stop listening',
  stopped: 'Start listening',
  error: 'Microphone unavailable',
};

export default function MicToggle({ onStart, onStop }: MicToggleProps) {
  const isListening = useAppStore((s) => s.isListening);
  const permissionState = useAppStore((s) => s.permissionState);
  const [isRequesting, setIsRequesting] = useState(false);

  const micState = deriveMicState(permissionState, isListening, isRequesting);
  const isDisabled = micState === 'requesting' || micState === 'error';

  const handleClick = async () => {
    if (isDisabled) return;
    if (micState === 'active') {
      onStop();
      return;
    }
    setIsRequesting(true);
    try {
      await onStart();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <button
      data-testid="mic-toggle"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={STATE_ARIA_LABEL[micState]}
      aria-pressed={isListening}
      className={[
        'px-4 py-2 rounded font-medium transition-colors',
        micState === 'active'
          ? 'bg-[var(--neon-accent)] text-[var(--bg-primary)] animate-pulse'
          : 'bg-[var(--bg-surface)] text-[var(--neon-white-key)] border border-[var(--neon-white-key)]',
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {micState === 'requesting' && (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
          aria-hidden="true"
        />
      )}
      {STATE_LABEL[micState]}
    </button>
  );
}
