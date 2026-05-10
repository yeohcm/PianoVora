import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AudioLevelMeter from '@/features/audio/AudioLevelMeter';
import { useAppStore } from '@/store/appStore';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  useAppStore.setState({ isListening: false, audioLevel: 0 });
});

describe('AudioLevelMeter', () => {
  it('inactive — bar fill is 0 and peak is hidden', () => {
    render(<AudioLevelMeter />);
    const bar = screen.getByTestId('audio-level-bar');
    expect(bar).toHaveStyle({ width: '0%' });
    expect(screen.queryByTestId('audio-level-peak')).toBeNull();
  });

  it('aria attributes present', () => {
    render(<AudioLevelMeter />);
    const meter = screen.getByTestId('audio-level-meter');
    expect(meter).toHaveAttribute('role', 'meter');
    expect(meter).toHaveAttribute('aria-label', 'Microphone level');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-live', 'off');
  });

  it('aria-valuenow reflects audioLevel * 100', () => {
    useAppStore.setState({ isListening: true, audioLevel: 0.5 });
    render(<AudioLevelMeter />);
    expect(screen.getByTestId('audio-level-meter')).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
  });

  it('isListening=true with audioLevel=0.75 — bar width reflects 75%', () => {
    useAppStore.setState({ isListening: true, audioLevel: 0.75 });
    render(<AudioLevelMeter />);
    const bar = screen.getByTestId('audio-level-bar');
    expect(bar).toHaveStyle({ width: '75%' });
  });

  it('isListening=true with audioLevel=1.0 — bar at 100%', () => {
    useAppStore.setState({ isListening: true, audioLevel: 1.0 });
    render(<AudioLevelMeter />);
    expect(screen.getByTestId('audio-level-bar')).toHaveStyle({ width: '100%' });
  });

  it('orientation prop — horizontal is default', () => {
    useAppStore.setState({ isListening: true, audioLevel: 0.5 });
    render(<AudioLevelMeter />);
    const bar = screen.getByTestId('audio-level-bar');
    // Horizontal: width property is set (not height)
    expect(bar).toHaveStyle({ width: '50%' });
  });
});
