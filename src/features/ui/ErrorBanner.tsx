interface ErrorBannerProps {
  permissionState: 'denied' | 'error';
}

const MESSAGES = {
  denied: {
    primary:   'Microphone access denied. Allow microphone access in your browser settings, then refresh.',
    secondary: 'You can still click the piano keys to explore in demo mode.',
  },
  error: {
    primary:   'Could not access your microphone. Check that no other app is using it, then refresh.',
    secondary: 'You can still click the piano keys to explore in demo mode.',
  },
};

export default function ErrorBanner({ permissionState }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="px-4 py-3 bg-amber-900/40 border-b border-amber-500/40 flex items-start gap-3"
      data-testid="error-banner"
    >
      <span aria-hidden="true">⚠</span>
      <div>
        <p className="font-medium">{MESSAGES[permissionState].primary}</p>
        <p className="text-sm text-white/60 mt-1">{MESSAGES[permissionState].secondary}</p>
      </div>
    </div>
  );
}
