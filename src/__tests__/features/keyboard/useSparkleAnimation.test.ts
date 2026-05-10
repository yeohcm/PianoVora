import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef } from 'react';
import type React from 'react';
import { useSparkleAnimation } from '@/features/keyboard/useSparkleAnimation';

// ── Canvas 2D context spy ────────────────────────────────────────────────────

const mockArc      = vi.fn();
const mockFill     = vi.fn();
const mockClearRect = vi.fn();
const mockSave     = vi.fn();
const mockRestore  = vi.fn();
const mockBeginPath = vi.fn();
const mockCtx = {
  clearRect:   mockClearRect,
  arc:         mockArc,
  fill:        mockFill,
  beginPath:   mockBeginPath,
  save:        mockSave,
  restore:     mockRestore,
  shadowBlur:  0,
  shadowColor: '',
  fillStyle:   '',
  globalAlpha: 1,
};
const mockGetContext = vi.fn(() => mockCtx);

// ── rAF/cAF mocks ────────────────────────────────────────────────────────────

let pendingRafCallback: FrameRequestCallback | null = null;
const mockRaf = vi.fn((cb: FrameRequestCallback) => {
  pendingRafCallback = cb;
  return 1;
});
const mockCaf = vi.fn();

// ── matchMedia mock ──────────────────────────────────────────────────────────

let reducedMotion = false;
const mockMatchMedia = vi.fn((query: string) => ({
  matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
  media:   query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// ── getComputedStyle mock ─────────────────────────────────────────────────────

vi.stubGlobal('getComputedStyle', vi.fn(() => ({
  getPropertyValue: (prop: string) => (prop === '--glow-colour' ? '#00f3ff' : ''),
})));

// ── Setup/Teardown ───────────────────────────────────────────────────────────

beforeEach(() => {
  reducedMotion = false;
  pendingRafCallback = null;
  vi.stubGlobal('requestAnimationFrame', mockRaf);
  vi.stubGlobal('cancelAnimationFrame', mockCaf);
  vi.stubGlobal('matchMedia', mockMatchMedia);
  Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
  HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext;
  mockArc.mockClear();
  mockFill.mockClear();
  mockClearRect.mockClear();
  mockRaf.mockClear();
  mockCaf.mockClear();
  mockGetContext.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Helper: render the hook with a real canvas ───────────────────────────────

function renderAnimation(activeKeyIndex: number | null, keyboardWidth = 1000) {
  return renderHook(
    ({ idx, width }: { idx: number | null; width: number }) => {
      const canvasRef = useRef<HTMLCanvasElement | null>(null);
      if (!canvasRef.current) {
        const canvas      = document.createElement('canvas');
        canvas.width      = 1000;
        canvas.height     = 200;
        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;
      }
      useSparkleAnimation({ canvasRef, activeKeyIndex: idx, keyboardWidth: width });
    },
    { initialProps: { idx: activeKeyIndex, width: keyboardWidth } },
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useSparkleAnimation', () => {
  describe('particle spawn', () => {
    it('spawns particles and starts rAF when a new activeKeyIndex is received', () => {
      renderAnimation(48, 1000);
      expect(mockRaf).toHaveBeenCalledTimes(1);
    });

    it('does not spawn when activeKeyIndex is null', () => {
      renderAnimation(null, 1000);
      expect(mockRaf).not.toHaveBeenCalled();
    });

    it('does not respawn when the same activeKeyIndex is received again', () => {
      const { rerender } = renderAnimation(48, 1000);
      mockRaf.mockClear();
      rerender({ idx: 48, width: 1000 });
      expect(mockRaf).not.toHaveBeenCalled();
    });

    it('appends new particles when activeKeyIndex changes to a different key', () => {
      // First key starts the loop; rAF handle is 1 (non-zero = running)
      const { rerender } = renderAnimation(48, 1000);
      // Run one frame so pendingRafCallback is set from the loop's own reschedule
      act(() => { if (pendingRafCallback) pendingRafCallback(performance.now()); });
      mockArc.mockClear();
      // Change to a new key — new particles are APPENDED; loop already running, no new rAF call
      rerender({ idx: 39, width: 1000 });
      // Run the loop frame — should draw particles from both old and new spawn
      act(() => { if (pendingRafCallback) pendingRafCallback(performance.now()); });
      expect(mockArc).toHaveBeenCalled();
    });
  });

  describe('animation loop', () => {
    it('calls ctx.arc for each particle on first frame', () => {
      renderAnimation(48, 1000);
      // Run one animation frame
      act(() => {
        if (pendingRafCallback) pendingRafCallback(performance.now());
      });
      // 12 particles × 2 arc calls each (outer + inner)
      expect(mockArc.mock.calls.length).toBeGreaterThanOrEqual(12);
    });

    it('calls ctx.clearRect on each frame', () => {
      renderAnimation(48, 1000);
      act(() => {
        if (pendingRafCallback) pendingRafCallback(performance.now());
      });
      expect(mockClearRect).toHaveBeenCalled();
    });

    it('schedules another rAF while particles are alive', () => {
      renderAnimation(48, 1000);
      const callsBefore = mockRaf.mock.calls.length;
      act(() => {
        if (pendingRafCallback) pendingRafCallback(performance.now());
      });
      expect(mockRaf.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('reduced-motion branch (Q1=B)', () => {
    it('does not start rAF when prefers-reduced-motion is set', () => {
      reducedMotion = true;
      renderAnimation(48, 1000);
      expect(mockRaf).not.toHaveBeenCalled();
    });

    it('draws synchronously then calls clearRect when reduced motion is set', () => {
      reducedMotion = true;
      renderAnimation(48, 1000);
      expect(mockArc).toHaveBeenCalled();
      expect(mockClearRect).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('calls cancelAnimationFrame on unmount when rAF is running', () => {
      const { unmount } = renderAnimation(48, 1000);
      unmount();
      expect(mockCaf).toHaveBeenCalled();
    });
  });
});
