import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasOverlay } from '@/features/keyboard/CanvasOverlay';

// ── ResizeObserver mock ──────────────────────────────────────────────────────

type ROCallback = (entries: ResizeObserverEntry[]) => void;
let roCallbacks: ROCallback[] = [];

const MockResizeObserver = vi.fn((cb: ROCallback) => ({
  observe:    vi.fn((el: Element) => { void el; roCallbacks.push(cb); }),
  disconnect: vi.fn(),
  unobserve:  vi.fn(),
}));

// ── Canvas mock ──────────────────────────────────────────────────────────────

const mockArc    = vi.fn();
const mockFill   = vi.fn();
const mockClear  = vi.fn();
const mockCtx = {
  clearRect:   mockClear,
  arc:         mockArc,
  fill:        mockFill,
  beginPath:   vi.fn(),
  save:        vi.fn(),
  restore:     vi.fn(),
  shadowBlur:  0,
  shadowColor: '',
  fillStyle:   '',
  globalAlpha: 1,
};
const mockGetContext = vi.fn(() => mockCtx);

// ── rAF mock ─────────────────────────────────────────────────────────────────

vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// ── Setup/Teardown ───────────────────────────────────────────────────────────

beforeEach(() => {
  roCallbacks = [];
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext;
  Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockClear.mockReset();
  mockArc.mockReset();
  mockGetContext.mockClear();
});

describe('CanvasOverlay', () => {
  it('renders canvas with data-testid="canvas-overlay"', () => {
    const { container } = render(
      <CanvasOverlay activeKeyIndex={null} keyboardWidth={1000} />,
    );
    const canvas = container.querySelector('[data-testid="canvas-overlay"]');
    expect(canvas).toBeTruthy();
  });

  it('canvas has aria-hidden="true"', () => {
    const { container } = render(
      <CanvasOverlay activeKeyIndex={null} keyboardWidth={1000} />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('canvas has pointer-events: none', () => {
    const { container } = render(
      <CanvasOverlay activeKeyIndex={null} keyboardWidth={1000} />,
    );
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.pointerEvents).toBe('none');
  });

  it('sets canvas pixel dimensions scaled by devicePixelRatio on resize', () => {
    const { container } = render(
      <CanvasOverlay activeKeyIndex={null} keyboardWidth={1000} />,
    );
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    act(() => {
      roCallbacks.forEach((cb) =>
        cb([{ contentRect: { width: 300, height: 150 } } as unknown as ResizeObserverEntry]),
      );
    });
    // dpr=2 → width=600, height=300
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
  });

  it('sets canvas CSS dimensions to match container contentRect', () => {
    const { container } = render(
      <CanvasOverlay activeKeyIndex={null} keyboardWidth={1000} />,
    );
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    act(() => {
      roCallbacks.forEach((cb) =>
        cb([{ contentRect: { width: 300, height: 150 } } as unknown as ResizeObserverEntry]),
      );
    });
    expect(canvas.style.width).toBe('300px');
    expect(canvas.style.height).toBe('150px');
  });
});
