import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MicToggle from '@/features/audio/MicToggle';
import { useAppStore } from '@/store/appStore';

function renderMicToggle(
  onStart: () => Promise<void> = vi.fn().mockResolvedValue(undefined),
  onStop: () => void = vi.fn(),
) {
  return render(<MicToggle onStart={onStart} onStop={onStop} />);
}

beforeEach(() => {
  useAppStore.setState({
    isListening: false,
    permissionState: 'prompt',
    audioLevel: 0,
    noiseGateThreshold: 0.02,
  });
});

describe('MicToggle', () => {
  it('idle state — renders "Allow Microphone", button is enabled', () => {
    renderMicToggle();
    const btn = screen.getByTestId('mic-toggle');
    expect(btn).toHaveTextContent('Allow Microphone');
    expect(btn).not.toBeDisabled();
  });

  it('click idle — calls onStart', async () => {
    const onStart = vi.fn().mockResolvedValue(undefined);
    renderMicToggle(onStart);
    await userEvent.click(screen.getByTestId('mic-toggle'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('active state — renders "Stop", aria-pressed is true', () => {
    useAppStore.setState({ isListening: true, permissionState: 'granted' });
    renderMicToggle();
    const btn = screen.getByTestId('mic-toggle');
    expect(btn).toHaveTextContent('Stop');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('click active — calls onStop', async () => {
    useAppStore.setState({ isListening: true, permissionState: 'granted' });
    const onStop = vi.fn();
    renderMicToggle(vi.fn().mockResolvedValue(undefined), onStop);
    await userEvent.click(screen.getByTestId('mic-toggle'));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('stopped state — renders "Start"', () => {
    useAppStore.setState({ isListening: false, permissionState: 'granted' });
    renderMicToggle();
    expect(screen.getByTestId('mic-toggle')).toHaveTextContent('Start');
  });

  it('error state (denied) — renders "Mic Unavailable", button disabled', () => {
    useAppStore.setState({ permissionState: 'denied' });
    renderMicToggle();
    const btn = screen.getByTestId('mic-toggle');
    expect(btn).toHaveTextContent('Mic Unavailable');
    expect(btn).toBeDisabled();
  });

  it('error state (error) — button disabled', () => {
    useAppStore.setState({ permissionState: 'error' });
    renderMicToggle();
    expect(screen.getByTestId('mic-toggle')).toBeDisabled();
  });

  it('aria-label reflects idle state', () => {
    renderMicToggle();
    expect(screen.getByTestId('mic-toggle')).toHaveAttribute(
      'aria-label',
      'Allow microphone access',
    );
  });

  it('aria-label reflects active state', () => {
    useAppStore.setState({ isListening: true, permissionState: 'granted' });
    renderMicToggle();
    expect(screen.getByTestId('mic-toggle')).toHaveAttribute(
      'aria-label',
      'Stop listening',
    );
  });

  it('keyboard activation — Enter key triggers click handler', async () => {
    const onStart = vi.fn().mockResolvedValue(undefined);
    renderMicToggle(onStart);
    screen.getByTestId('mic-toggle').focus();
    await userEvent.keyboard('{Enter}');
    expect(onStart).toHaveBeenCalledOnce();
  });
});
