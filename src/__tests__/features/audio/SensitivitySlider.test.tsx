import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SensitivitySlider from '@/features/audio/SensitivitySlider';
import { useAppStore } from '@/store/appStore';
import { DEFAULT_NOISE_GATE, MIN_NOISE_GATE, MAX_NOISE_GATE } from '@/shared/constants';

beforeEach(() => {
  useAppStore.setState({ noiseGateThreshold: DEFAULT_NOISE_GATE });
});

describe('SensitivitySlider', () => {
  it('renders with initial store value', () => {
    render(<SensitivitySlider />);
    const slider = screen.getByTestId('sensitivity-slider');
    expect(slider).toBeInTheDocument();
  });

  it('aria-label is present', () => {
    render(<SensitivitySlider />);
    expect(screen.getByTestId('sensitivity-slider')).toHaveAttribute(
      'aria-label',
      'Microphone sensitivity',
    );
  });

  it('explicit label association exists', () => {
    render(<SensitivitySlider />);
    // The input should have aria-labelledby pointing to a label element
    const slider = screen.getByTestId('sensitivity-slider');
    const labelId = slider.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)).toBeInTheDocument();
  });

  it('inverted mapping — high threshold maps to low slider position (left)', () => {
    useAppStore.setState({ noiseGateThreshold: MAX_NOISE_GATE });
    render(<SensitivitySlider />);
    const slider = screen.getByTestId('sensitivity-slider') as HTMLInputElement;
    // MAX_NOISE_GATE → sliderValue ≈ 0 → sliderPercent = 0
    expect(Number(slider.value)).toBe(0);
  });

  it('inverted mapping — low threshold maps to high slider position (right)', () => {
    useAppStore.setState({ noiseGateThreshold: MIN_NOISE_GATE });
    render(<SensitivitySlider />);
    const slider = screen.getByTestId('sensitivity-slider') as HTMLInputElement;
    // MIN_NOISE_GATE → sliderValue ≈ 1 → sliderPercent = 100
    expect(Number(slider.value)).toBe(100);
  });

  it('moving slider to max right sets noiseGateThreshold to MIN_NOISE_GATE', () => {
    render(<SensitivitySlider />);
    const slider = screen.getByTestId('sensitivity-slider');
    // jsdom does not implement setSelectionRange on range inputs, so use fireEvent.change directly
    fireEvent.change(slider, { target: { value: '100' } });
    const threshold = useAppStore.getState().noiseGateThreshold;
    expect(threshold).toBeCloseTo(MIN_NOISE_GATE, 3);
  });

  it('aria-valuetext reflects high sensitivity at max right', () => {
    useAppStore.setState({ noiseGateThreshold: MIN_NOISE_GATE });
    render(<SensitivitySlider />);
    expect(screen.getByTestId('sensitivity-slider')).toHaveAttribute(
      'aria-valuetext',
      'High sensitivity',
    );
  });

  it('aria-valuetext reflects low sensitivity at max left', () => {
    useAppStore.setState({ noiseGateThreshold: MAX_NOISE_GATE });
    render(<SensitivitySlider />);
    expect(screen.getByTestId('sensitivity-slider')).toHaveAttribute(
      'aria-valuetext',
      'Low sensitivity',
    );
  });
});
