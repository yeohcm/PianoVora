import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  WalkthroughOverlay,
  TOUR_STEPS,
  TOUR_STEP_COUNT,
} from '@/features/ui/WalkthroughOverlay';

const mockRect: DOMRect = {
  top: 10, left: 20, width: 120, height: 36,
  bottom: 46, right: 140, x: 20, y: 10,
  toJSON: vi.fn(),
};

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(mockRect);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Constants ─────────────────────────────────────────────────────────────────

describe('TOUR constants', () => {
  it('exports TOUR_STEP_COUNT as 2', () => {
    expect(TOUR_STEP_COUNT).toBe(2);
  });

  it('TOUR_STEPS has 2 entries', () => {
    expect(TOUR_STEPS).toHaveLength(2);
  });

  it('step 0 targets mic-toggle', () => {
    expect(TOUR_STEPS[0].testId).toBe('mic-toggle');
  });

  it('step 1 targets theme-selector', () => {
    expect(TOUR_STEPS[1].testId).toBe('theme-selector');
  });
});

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('WalkthroughOverlay rendering', () => {
  it('renders overlay wrapper', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-overlay')).toBeInTheDocument();
  });

  it('renders tooltip dialog', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-tooltip')).toBeInTheDocument();
  });

  it('tooltip has role="dialog"', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tooltip has aria-label matching step title', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Allow Microphone');
  });

  it('shows step counter "Step 1 of 2" on step 0', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-step-counter').textContent).toBe('Step 1 of 2');
  });

  it('shows step counter "Step 2 of 2" on step 1', () => {
    render(<WalkthroughOverlay step={1} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-step-counter').textContent).toBe('Step 2 of 2');
  });

  it('shows "Allow Microphone" title on step 0', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByText('Allow Microphone')).toBeInTheDocument();
  });

  it('shows "Choose your colour theme" title on step 1', () => {
    render(<WalkthroughOverlay step={1} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByText('Choose your colour theme')).toBeInTheDocument();
  });

  it('shows Next button (not Done) on step 0', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-next')).toBeInTheDocument();
    expect(screen.queryByTestId('walkthrough-done')).not.toBeInTheDocument();
  });

  it('shows Done button (not Next) on step 1', () => {
    render(<WalkthroughOverlay step={1} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-done')).toBeInTheDocument();
    expect(screen.queryByTestId('walkthrough-next')).not.toBeInTheDocument();
  });

  it('shows Skip button on all steps', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-skip')).toBeInTheDocument();
  });

  it('returns null for out-of-range step', () => {
    const { container } = render(
      <WalkthroughOverlay step={99} onNext={vi.fn()} onDone={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ── Spotlight ─────────────────────────────────────────────────────────────────

describe('WalkthroughOverlay spotlight', () => {
  it('renders spotlight div when target element is in the DOM', () => {
    const el = document.createElement('button');
    el.setAttribute('data-testid', 'mic-toggle');
    document.body.appendChild(el);

    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByTestId('walkthrough-spotlight')).toBeInTheDocument();

    document.body.removeChild(el);
  });

  it('does not render spotlight when target element is absent', () => {
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={vi.fn()} />);
    expect(screen.queryByTestId('walkthrough-spotlight')).not.toBeInTheDocument();
  });
});

// ── Interactions ──────────────────────────────────────────────────────────────

describe('WalkthroughOverlay interactions', () => {
  it('clicking Next calls onNext', () => {
    const onNext = vi.fn();
    render(<WalkthroughOverlay step={0} onNext={onNext} onDone={vi.fn()} />);
    fireEvent.click(screen.getByTestId('walkthrough-next'));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('clicking Done calls onDone', () => {
    const onDone = vi.fn();
    render(<WalkthroughOverlay step={1} onNext={vi.fn()} onDone={onDone} />);
    fireEvent.click(screen.getByTestId('walkthrough-done'));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('clicking Skip calls onDone', () => {
    const onDone = vi.fn();
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={onDone} />);
    fireEvent.click(screen.getByTestId('walkthrough-skip'));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('pressing Escape calls onDone', () => {
    const onDone = vi.fn();
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={onDone} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('pressing other keys does not call onDone', () => {
    const onDone = vi.fn();
    render(<WalkthroughOverlay step={0} onNext={vi.fn()} onDone={onDone} />);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onDone).not.toHaveBeenCalled();
  });
});
