import { useCallback, useEffect, useState } from 'react';

interface TourStep {
  testId:      string;
  title:       string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    testId:      'mic-toggle',
    title:       'Allow Microphone',
    description: 'Click here to give PianoVora access to your microphone so it can detect the notes you play.',
  },
  {
    testId:      'theme-selector',
    title:       'Choose your colour theme',
    description: 'Pick a colour theme to personalise the look of your piano keyboard.',
  },
];

export const TOUR_STEP_COUNT = TOUR_STEPS.length;

interface TargetRect {
  top:    number;
  left:   number;
  width:  number;
  height: number;
}

interface WalkthroughOverlayProps {
  step:   number;
  onNext: () => void;
  onDone: () => void;
}

const PAD = 6;

export function WalkthroughOverlay({ step, onNext, onDone }: WalkthroughOverlayProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const current = TOUR_STEPS[step];
  const isLast  = step === TOUR_STEPS.length - 1;

  const measure = useCallback(() => {
    if (!current) return;
    const el = document.querySelector<HTMLElement>(`[data-testid="${current.testId}"]`);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [current]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDone();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onDone]);

  if (!current) return null;

  const tooltipTop  = targetRect ? targetRect.top + targetRect.height + PAD + 10 : '50%';
  const tooltipLeft = targetRect
    ? Math.max(8, Math.min(targetRect.left, window.innerWidth - 336))
    : '50%';

  return (
    <div
      data-testid="walkthrough-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}
    >
      {targetRect ? (
        <div
          data-testid="walkthrough-spotlight"
          style={{
            position:      'fixed',
            top:           targetRect.top    - PAD,
            left:          targetRect.left   - PAD,
            width:         targetRect.width  + PAD * 2,
            height:        targetRect.height + PAD * 2,
            borderRadius:  6,
            boxShadow:     '0 0 0 9999px rgba(0,0,0,0.72)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
      )}

      <div
        data-testid="walkthrough-tooltip"
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
        style={{
          position:      'fixed',
          top:           tooltipTop,
          left:          tooltipLeft,
          transform:     targetRect ? undefined : 'translate(-50%,-50%)',
          background:    '#1a1a2e',
          border:        '1px solid rgba(255,255,255,0.15)',
          borderRadius:  8,
          padding:       '16px',
          minWidth:      240,
          maxWidth:      320,
          color:         '#fff',
          pointerEvents: 'auto',
          zIndex:        51,
        }}
      >
        <p
          data-testid="walkthrough-step-counter"
          style={{ margin: '0 0 4px', fontSize: 12, opacity: 0.6 }}
        >
          Step {step + 1} of {TOUR_STEPS.length}
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>{current.title}</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.4 }}>{current.description}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            data-testid="walkthrough-skip"
            onClick={onDone}
            style={{
              background:   'transparent',
              border:       '1px solid rgba(255,255,255,0.3)',
              color:        '#fff',
              padding:      '6px 12px',
              borderRadius: 4,
              cursor:       'pointer',
            }}
          >
            Skip
          </button>
          <button
            data-testid={isLast ? 'walkthrough-done' : 'walkthrough-next'}
            onClick={isLast ? onDone : onNext}
            style={{
              background:   'var(--neon-accent, #00ffff)',
              color:        '#000',
              border:       'none',
              padding:      '6px 12px',
              borderRadius: 4,
              cursor:       'pointer',
              fontWeight:   600,
            }}
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
