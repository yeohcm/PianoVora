import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingModal from '@/features/ui/OnboardingModal';

describe('OnboardingModal', () => {
  it('renders with role="dialog"', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the title', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title');
    expect(document.getElementById('onboarding-title')).toHaveTextContent('Welcome to PianoVora');
  });

  it('renders the dismiss button with correct testid', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    expect(screen.getByTestId('onboarding-dismiss-btn')).toBeInTheDocument();
  });

  it('dismiss button has "Got it" label', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    expect(screen.getByTestId('onboarding-dismiss-btn')).toHaveTextContent('Got it');
  });

  it('calls onDismiss when "Got it" is clicked', () => {
    const onDismiss = vi.fn();
    render(<OnboardingModal onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('onboarding-dismiss-btn'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does NOT call onDismiss when Escape is pressed', () => {
    const onDismiss = vi.fn();
    render(<OnboardingModal onDismiss={onDismiss} />);
    fireEvent.keyDown(screen.getByTestId('onboarding-modal'), { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('prevents default on Escape keydown', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    screen.getByTestId('onboarding-modal').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not prevent default on other keys', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    screen.getByTestId('onboarding-modal').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('renders backdrop with correct testid', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    expect(screen.getByTestId('onboarding-backdrop')).toBeInTheDocument();
  });

  it('renders all four onboarding content items', () => {
    render(<OnboardingModal onDismiss={vi.fn()} />);
    expect(screen.getByText(/matching piano key lights up/)).toBeInTheDocument();
    expect(screen.getByText(/Click any key to try demo mode/)).toBeInTheDocument();
    expect(screen.getByText(/Cyber, Aurora, and Sunset/)).toBeInTheDocument();
    expect(screen.getByText(/last 5 notes appear/)).toBeInTheDocument();
  });
});
