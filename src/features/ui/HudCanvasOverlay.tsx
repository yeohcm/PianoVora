import { useEffect, useRef } from 'react';
import { useSparkleAnimation } from '../keyboard/useSparkleAnimation';

interface HudCanvasOverlayProps {
  activeKeyIndex: number | null;
  sparkleColour?: string;
}

export function HudCanvasOverlay({ activeKeyIndex, sparkleColour }: HudCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep canvas pixel dimensions in sync with container (DPR scaling)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio;
      canvas.width  = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
    });
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  useSparkleAnimation({
    canvasRef,
    activeKeyIndex,
    keyboardWidth: 0, // not used when spawnCenter is true
    sparkleColour,
    spawnCenter: true,
    particleCount: 32,
    minSpeed: 2.5,
    maxSpeed: 7.5,
    minRadius: 5,
    maxRadius: 15,
    gravity: 0.08,
    fadeDuration: 1.2,
  });

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
      data-testid="hud-canvas-overlay"
    />
  );
}
