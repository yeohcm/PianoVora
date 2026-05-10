import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { PEAK_HOLD_MS, PEAK_DECAY_RATE } from '@/shared/constants';

interface AudioLevelMeterProps {
  orientation?: 'horizontal' | 'vertical';
  height?: number;
}

export default function AudioLevelMeter({
  orientation = 'horizontal',
  height = 8,
}: AudioLevelMeterProps) {
  const audioLevel = useAppStore((s) => s.audioLevel);
  const isListening = useAppStore((s) => s.isListening);

  const [peakDisplay, setPeakDisplay] = useState(0);
  const peakRef = useRef(0);
  const lastPeakTimeRef = useRef(0);
  const rAFRef = useRef(0);

  useEffect(() => {
    if (!isListening) {
      setPeakDisplay(0);
      peakRef.current = 0;
      return;
    }

    const tick = () => {
      const now = performance.now();
      if (audioLevel > peakRef.current) {
        peakRef.current = audioLevel;
        lastPeakTimeRef.current = now;
      } else if (now - lastPeakTimeRef.current > PEAK_HOLD_MS) {
        peakRef.current = Math.max(0, peakRef.current - PEAK_DECAY_RATE);
      }
      setPeakDisplay(peakRef.current);
      rAFRef.current = requestAnimationFrame(tick);
    };

    rAFRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rAFRef.current);
  }, [isListening, audioLevel]);

  const fillPercent = isListening ? audioLevel * 100 : 0;
  const peakPercent = isListening ? peakDisplay * 100 : 0;
  const barColour = isListening ? 'var(--neon-white-key)' : '#555';

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      data-testid="audio-level-meter"
      role="meter"
      aria-valuenow={Math.round(fillPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Microphone level"
      aria-live="off"
      style={{
        position: 'relative',
        width: isHorizontal ? '100%' : `${height}px`,
        height: isHorizontal ? `${height}px` : '100%',
        background: '#222',
        borderRadius: 4,
        overflow: 'visible',
      }}
    >
      {/* Fill bar */}
      <div
        data-testid="audio-level-bar"
        style={{
          position: 'absolute',
          [isHorizontal ? 'left' : 'bottom']: 0,
          [isHorizontal ? 'top' : 'left']: 0,
          [isHorizontal ? 'width' : 'height']: `${fillPercent}%`,
          [isHorizontal ? 'height' : 'width']: '100%',
          background: barColour,
          borderRadius: 4,
          transition: 'width 50ms ease-out, height 50ms ease-out',
        }}
      />
      {/* Peak indicator */}
      {isListening && peakPercent > 0 && (
        <div
          data-testid="audio-level-peak"
          style={{
            position: 'absolute',
            [isHorizontal ? 'left' : 'bottom']: `calc(${peakPercent}% - 1px)`,
            [isHorizontal ? 'top' : 'left']: 0,
            [isHorizontal ? 'width' : 'height']: 2,
            [isHorizontal ? 'height' : 'width']: '100%',
            background: 'var(--neon-accent)',
            transition: 'left 150ms ease-in-out, bottom 150ms ease-in-out',
          }}
        />
      )}
    </div>
  );
}
