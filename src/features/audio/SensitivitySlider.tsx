import { useId } from 'react';
import { useAppStore } from '@/store/appStore';
import { MIN_NOISE_GATE, MAX_NOISE_GATE } from '@/shared/constants';

function thresholdToSlider(threshold: number): number {
  return 1 - (threshold - MIN_NOISE_GATE) / (MAX_NOISE_GATE - MIN_NOISE_GATE);
}

function sliderToThreshold(value: number): number {
  const raw = MIN_NOISE_GATE + (1 - value) * (MAX_NOISE_GATE - MIN_NOISE_GATE);
  return Math.min(MAX_NOISE_GATE, Math.max(MIN_NOISE_GATE, raw));
}

function valueText(sliderValue: number): string {
  if (sliderValue < 1 / 3) return 'Low sensitivity';
  if (sliderValue < 2 / 3) return 'Medium sensitivity';
  return 'High sensitivity';
}

export default function SensitivitySlider() {
  const noiseGateThreshold = useAppStore((s) => s.noiseGateThreshold);
  const setNoiseGateThreshold = useAppStore((s) => s.setNoiseGateThreshold);
  const labelId = useId();

  const sliderValue = thresholdToSlider(noiseGateThreshold);
  const sliderPercent = Math.round(sliderValue * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    setNoiseGateThreshold(sliderToThreshold(v));
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label id={labelId} className="text-sm text-[var(--neon-white-key)]">
        Microphone Sensitivity
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">Less Sensitive</span>
        <input
          data-testid="sensitivity-slider"
          type="range"
          min={0}
          max={100}
          value={sliderPercent}
          onChange={handleChange}
          aria-labelledby={labelId}
          aria-label="Microphone sensitivity"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderPercent}
          aria-valuetext={valueText(sliderValue)}
          className="flex-1 accent-[var(--neon-accent)]"
        />
        <span className="text-xs text-gray-400 shrink-0">More Sensitive</span>
      </div>
    </div>
  );
}
