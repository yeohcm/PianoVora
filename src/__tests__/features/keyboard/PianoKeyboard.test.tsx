import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PianoKeyboard } from '@/features/keyboard/PianoKeyboard';
import { useAppStore } from '@/store/appStore';
import type { DetectedNote } from '@/shared/types';

// ── ResizeObserver mock ──────────────────────────────────────────────────────

type ROCallback = (entries: ResizeObserverEntry[]) => void;
let roCallbacks: ROCallback[] = [];

const MockResizeObserver = vi.fn((cb: ROCallback) => ({
  observe:    vi.fn(() => { roCallbacks.push(cb); }),
  disconnect: vi.fn(),
  unobserve:  vi.fn(),
}));

// ── matchMedia mock ──────────────────────────────────────────────────────────

let reducedMotion = false;
const mockMatchMedia = vi.fn((query: string) => ({
  matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
  media:   query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// ── scrollTo mock ────────────────────────────────────────────────────────────

const mockScrollTo = vi.fn();

// ── Canvas mock (CanvasOverlay renders inside PianoKeyboard) ─────────────────

const mockGetContext = vi.fn(() => null);

// ── Setup/Teardown ───────────────────────────────────────────────────────────

beforeEach(() => {
  roCallbacks = [];
  reducedMotion = false;
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.stubGlobal('matchMedia', mockMatchMedia);
  HTMLElement.prototype.scrollTo = mockScrollTo;
  HTMLCanvasElement.prototype.getContext = mockGetContext as typeof HTMLCanvasElement.prototype.getContext;
  useAppStore.setState({ detectedNote: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockScrollTo.mockReset();
});

// ── Helper: fire a resize to give the keyboard a real width ──────────────────

function fireResize(width = 1000) {
  act(() => {
    roCallbacks.forEach((cb) =>
      cb([{ contentRect: { width, height: 200 } } as unknown as ResizeObserverEntry]),
    );
  });
}

// ── Helper: build a DetectedNote ─────────────────────────────────────────────

function makeNote(keyIndex: number): DetectedNote {
  const midiNote = keyIndex + 21;
  return {
    midiNote,
    keyIndex,
    noteName:  keyIndex === 48 ? 'A' : 'C',
    octave:    keyIndex === 48 ? 4 : 4,
    frequency: 440 * Math.pow(2, (midiNote - 69) / 12),
    clarity:   1.0,
    timestamp: 0,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PianoKeyboard', () => {
  describe('zero-width guard', () => {
    it('does not render SVG before ResizeObserver fires', () => {
      render(<PianoKeyboard />);
      expect(screen.queryByTestId('piano-keyboard-svg')).toBeNull();
    });

    it('renders SVG after ResizeObserver fires', () => {
      render(<PianoKeyboard />);
      fireResize();
      expect(screen.getByTestId('piano-keyboard-svg')).toBeTruthy();
    });

    it('renders scrollable container always', () => {
      render(<PianoKeyboard />);
      expect(screen.getByTestId('piano-keyboard-container')).toBeTruthy();
    });
  });

  describe('key rendering', () => {
    it('renders key-0 (A0) through key-87 (C8) after resize', () => {
      render(<PianoKeyboard />);
      fireResize();
      expect(screen.getByTestId('key-0')).toBeTruthy();
      expect(screen.getByTestId('key-87')).toBeTruthy();
    });

    it('renders 88 key elements', () => {
      render(<PianoKeyboard />);
      fireResize();
      // Count all key-N testids from 0 to 87
      const keyCount = Array.from({ length: 88 }, (_, i) =>
        screen.queryByTestId(`key-${i}`),
      ).filter(Boolean).length;
      expect(keyCount).toBe(88);
    });

    it('each key has aria-label with note name and octave', () => {
      render(<PianoKeyboard />);
      fireResize();
      // key-39 is C4
      const c4 = screen.getByTestId('key-39');
      expect(c4.getAttribute('aria-label')).toBe('C4');
    });

    it('each key has role="button"', () => {
      render(<PianoKeyboard />);
      fireResize();
      const key = screen.getByTestId('key-0');
      expect(key.getAttribute('role')).toBe('button');
    });
  });

  describe('key highlighting', () => {
    it('active white key gets var(--neon-white-key) fill', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(39)); }); // C4 = white
      const key = screen.getByTestId('key-39');
      expect(key.getAttribute('fill')).toBe('var(--neon-white-key)');
    });

    it('active black key gets var(--neon-black-key) fill', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(40)); }); // C#4 = black
      const key = screen.getByTestId('key-40');
      expect(key.getAttribute('fill')).toBe('var(--neon-black-key)');
    });

    it('inactive keys return to default fill', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(39)); });
      act(() => { useAppStore.getState().setDetectedNote(null); });
      const key = screen.getByTestId('key-39');
      expect(key.getAttribute('fill')).toBe('var(--key-white)');
    });
  });

  describe('note name overlay', () => {
    it('shows active-key-label when detectedNote is set', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(48)); }); // A4
      expect(screen.getByTestId('active-key-label')).toBeTruthy();
      expect(screen.getByTestId('active-key-label').textContent).toBe('A4');
    });

    it('hides active-key-label when detectedNote is null', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(48)); });
      act(() => { useAppStore.getState().setDetectedNote(null); });
      expect(screen.queryByTestId('active-key-label')).toBeNull();
    });

    it('label has aria-live="polite" and aria-atomic="true"', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(39)); });
      const label = screen.getByTestId('active-key-label');
      expect(label.getAttribute('aria-live')).toBe('polite');
      expect(label.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('teacher click (FEAT-10)', () => {
    it('clicking key-48 (A4) sets detectedNote with correct midiNote', () => {
      render(<PianoKeyboard />);
      fireResize();
      fireEvent.click(screen.getByTestId('key-48'));
      const note = useAppStore.getState().detectedNote;
      expect(note?.midiNote).toBe(69);
      expect(note?.keyIndex).toBe(48);
      expect(note?.clarity).toBe(1.0);
    });

    it('clicking key-48 sets correct frequency (~440 Hz)', () => {
      render(<PianoKeyboard />);
      fireResize();
      fireEvent.click(screen.getByTestId('key-48'));
      const freq = useAppStore.getState().detectedNote?.frequency ?? 0;
      expect(Math.abs(freq - 440)).toBeLessThan(0.01);
    });

    it('pressing Enter on a key triggers setDetectedNote', () => {
      render(<PianoKeyboard />);
      fireResize();
      fireEvent.keyDown(screen.getByTestId('key-39'), { key: 'Enter' });
      expect(useAppStore.getState().detectedNote?.keyIndex).toBe(39);
    });

    it('pressing Space on a key triggers setDetectedNote', () => {
      render(<PianoKeyboard />);
      fireResize();
      fireEvent.keyDown(screen.getByTestId('key-39'), { key: ' ' });
      expect(useAppStore.getState().detectedNote?.keyIndex).toBe(39);
    });
  });

  describe('scroll behaviour', () => {
    it('calls scrollTo when detectedNote changes to non-null', () => {
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(48)); });
      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      );
    });

    it('uses behavior:"instant" when prefers-reduced-motion is set', () => {
      reducedMotion = true;
      render(<PianoKeyboard />);
      fireResize();
      act(() => { useAppStore.getState().setDetectedNote(makeNote(48)); });
      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'instant' }),
      );
    });

    it('clamps scroll to 0 (never negative)', () => {
      render(<PianoKeyboard />);
      fireResize();
      // key-0 (A0) is near the left edge; scroll target should be >= 0
      act(() => { useAppStore.getState().setDetectedNote(makeNote(0)); });
      const call = mockScrollTo.mock.calls[0]?.[0] as { left: number };
      expect(call.left).toBeGreaterThanOrEqual(0);
    });
  });
});
