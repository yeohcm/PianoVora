import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBanner from '@/features/ui/ErrorBanner';

describe('ErrorBanner', () => {
  it('has role="alert" for immediate screen reader announcement', () => {
    render(<ErrorBanner permissionState="denied" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with data-testid', () => {
    render(<ErrorBanner permissionState="denied" />);
    expect(screen.getByTestId('error-banner')).toBeInTheDocument();
  });

  it('shows denied primary message', () => {
    render(<ErrorBanner permissionState="denied" />);
    expect(screen.getByText(/Microphone access denied/)).toBeInTheDocument();
  });

  it('shows denied secondary message', () => {
    render(<ErrorBanner permissionState="denied" />);
    expect(screen.getByText(/click the piano keys/)).toBeInTheDocument();
  });

  it('shows error primary message', () => {
    render(<ErrorBanner permissionState="error" />);
    expect(screen.getByText(/Could not access your microphone/)).toBeInTheDocument();
  });

  it('shows error secondary message', () => {
    render(<ErrorBanner permissionState="error" />);
    expect(screen.getByText(/click the piano keys/)).toBeInTheDocument();
  });
});
