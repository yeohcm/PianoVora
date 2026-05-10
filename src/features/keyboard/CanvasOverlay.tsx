import { useEffect, useRef } from 'react';
import { useSparkleAnimation } from './useSparkleAnimation';

interface CanvasOverlayProps {
  activeKeyIndex: number | null;
  keyboardWidth:  number;
  sparkleColour?: string;
}

export function CanvasOverlay({ activeKeyIndex, keyboardWidth, sparkleColour }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep canvas pixel dimensions in sync with container (NFR-P2: DPR scaling)
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

  useSparkleAnimation({ canvasRef, activeKeyIndex, keyboardWidth, sparkleColour });

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
      data-testid="canvas-overlay"
    />
  );
}
