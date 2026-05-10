import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  getAllKeyGeometry,
  getKeyGeometry,
  keyIndexToNoteName,
  keyIndexToOctave,
} from '../../shared/pianoGeometry';
import type { DetectedNote } from '../../shared/types';
import { CanvasOverlay } from './CanvasOverlay';

function rainbowFill(keyIndex: number, isBlack: boolean, isActive: boolean): string {
  const hue = Math.round((keyIndex / 87) * 360);
  if (isActive) return `hsl(${hue}deg, 100%, ${isBlack ? 55 : 65}%)`;
  return isBlack ? `hsl(${hue}deg, 90%, 22%)` : `hsl(${hue}deg, 80%, 92%)`;
}

export function PianoKeyboard() {
  const detectedNote    = useAppStore((s) => s.detectedNote);
  const setDetectedNote = useAppStore((s) => s.setDetectedNote);
  const theme           = useAppStore((s) => s.theme);

  const containerRef              = useRef<HTMLDivElement | null>(null);
  const [totalWidth, setTotalWidth] = useState(0);

  // Memoised key geometry — recomputes only when container width changes (NFR-P3)
  const allKeyRects = useMemo(() => getAllKeyGeometry(totalWidth), [totalWidth]);

  const keyboardHeight = totalWidth > 0 ? (allKeyRects[0]?.height ?? 0) : 0;

  // ResizeObserver — immediate update (Q2=A)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setTotalWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Scroll active key to centre (BR-29/30/31)
  useEffect(() => {
    if (!detectedNote || !containerRef.current || totalWidth === 0) return;
    const rect = getKeyGeometry(detectedNote.keyIndex, totalWidth);
    if (!rect) return;
    const keyMidX       = rect.x + rect.width / 2;
    const containerWidth = containerRef.current.clientWidth;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    containerRef.current.scrollTo({
      left:     Math.max(0, keyMidX - containerWidth / 2),
      behavior: reduced ? 'instant' : 'smooth',
    });
  }, [detectedNote, totalWidth]);

  function handleKeyClick(keyIndex: number): void {
    const midiNote = keyIndex + 21;
    const note: DetectedNote = {
      midiNote,
      keyIndex,
      noteName:  keyIndexToNoteName(keyIndex)!,
      octave:    keyIndexToOctave(keyIndex)!,
      frequency: 440 * Math.pow(2, (midiNote - 69) / 12),
      clarity:   1.0,
      timestamp: performance.now(),
    };
    setDetectedNote(note);
  }

  function handleKeyKeyDown(e: React.KeyboardEvent, keyIndex: number): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKeyClick(keyIndex);
    }
  }

  const activeKeyIndex = detectedNote?.keyIndex ?? null;
  const activeRect     = activeKeyIndex !== null
    ? getKeyGeometry(activeKeyIndex, totalWidth)
    : null;

  const whiteRects = allKeyRects.filter((r) => !r.isBlack);
  const blackRects = allKeyRects.filter((r) => r.isBlack);

  return (
    <div
      ref={containerRef}
      style={{ overflowX: 'auto', position: 'relative' }}
      data-testid="piano-keyboard-container"
    >
      {/* Zero-width guard (Q2=B): render SVG only after ResizeObserver fires */}
      {totalWidth > 0 && (
        <>
          <svg
            width={totalWidth}
            height={keyboardHeight}
            role="group"
            aria-label="Piano keyboard"
            data-testid="piano-keyboard-svg"
          >
            {/* White keys first (z-order, BR-02) */}
            {whiteRects.map((rect) => {
              const midiNote = rect.keyIndex + 21;
              const isActive = rect.keyIndex === activeKeyIndex;
              return (
                <g key={rect.keyIndex}>
                  <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill={theme === 'rainbow'
                      ? rainbowFill(rect.keyIndex, false, isActive)
                      : isActive ? 'var(--neon-white-key)' : 'var(--key-white)'}
                    stroke="#888"
                    strokeWidth={1}
                    role="button"
                    tabIndex={0}
                    cursor="pointer"
                    aria-label={keyIndexToNoteName(rect.keyIndex)! + keyIndexToOctave(rect.keyIndex)!}
                    onClick={() => handleKeyClick(rect.keyIndex)}
                    onKeyDown={(e) => handleKeyKeyDown(e, rect.keyIndex)}
                    data-testid={`key-${rect.keyIndex}`}
                  />
                  {/* Octave marker C1–C8 (BR-04) */}
                  {midiNote % 12 === 0 && midiNote >= 24 && (
                    <text
                      x={rect.x + rect.width / 2}
                      y={rect.y + rect.height + 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#666"
                      pointerEvents="none"
                    >
                      C{midiNote / 12 - 1}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Black keys on top (z-order, BR-02) */}
            {blackRects.map((rect) => {
              const isActive = rect.keyIndex === activeKeyIndex;
              return (
                <rect
                  key={rect.keyIndex}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={theme === 'rainbow'
                    ? rainbowFill(rect.keyIndex, true, isActive)
                    : isActive ? 'var(--neon-black-key)' : 'var(--key-black)'}
                  stroke="#555"
                  strokeWidth={0.5}
                  role="button"
                  tabIndex={0}
                  cursor="pointer"
                  aria-label={keyIndexToNoteName(rect.keyIndex)! + keyIndexToOctave(rect.keyIndex)!}
                  onClick={() => handleKeyClick(rect.keyIndex)}
                  onKeyDown={(e) => handleKeyKeyDown(e, rect.keyIndex)}
                  data-testid={`key-${rect.keyIndex}`}
                />
              );
            })}

            {/* Note name overlay (Q1=A, BR-09) */}
            {detectedNote && activeRect && (
              <text
                x={activeRect.x + activeRect.width / 2}
                y={activeRect.y + activeRect.height - 8}
                textAnchor="middle"
                fontSize={activeRect.isBlack ? 9 : 12}
                fill="var(--key-label-colour)"
                aria-live="polite"
                aria-atomic="true"
                pointerEvents="none"
                data-testid="active-key-label"
              >
                {detectedNote.noteName + detectedNote.octave}
              </text>
            )}
          </svg>

          <CanvasOverlay
            activeKeyIndex={activeKeyIndex}
            keyboardWidth={totalWidth}
            sparkleColour={
              theme === 'rainbow' && activeKeyIndex !== null
                ? `hsl(${Math.round((activeKeyIndex / 87) * 360)}deg, 100%, 65%)`
                : undefined
            }
          />
        </>
      )}
    </div>
  );
}
