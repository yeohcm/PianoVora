import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePitchDetector } from '@/features/pitch/usePitchDetector';
import { useAppStore } from '@/store/appStore';

// Stable mock for pitchy — mockFindPitch prefix allows vitest hoisting to resolve it
const mockFindPitch = vi.fn<[], [number, number]>().mockReturnValue([0, 0]);

vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: vi.fn(() => ({ findPitch: mockFindPitch })),
  },
}));

// Controlled rAF — captures the latest callback so tests can trigger frames manually
let pendingRafCallback: FrameRequestCallback | null = null;
const mockRequestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  pendingRafCallback = cb;
  return 1;
});
const mockCancelAnimationFrame = vi.fn();

// Controlled clock — advances allow timestamp gate tests
let mockNow = 0;

function triggerFrame(): void {
  if (pendingRafCallback) {
    const cb = pendingRafCallback;
    pendingRafCallback = null;
    cb(mockNow);
  }
}

function advanceTime(ms: number): void {
  mockNow += ms;
}

beforeEach(() => {
  mockNow = 0;
  pendingRafCallback = null;
  mockFindPitch.mockClear();
  mockFindPitch.mockReturnValue([0, 0]);
  mockRequestAnimationFrame.mockClear();
  mockCancelAnimationFrame.mockClear();

  vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame);
  vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);
  vi.stubGlobal('performance', { now: () => mockNow });

  // Reset store to clean state
  useAppStore.setState({
    isListening: false,
    detectedNote: null,
    noteHistory: [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeAnalyserRef(overrides?: Partial<AnalyserNode>) {
  return {
    current: {
      getFloatTimeDomainData: vi.fn(),
      context: { sampleRate: 44100 },
      ...overrides,
    } as unknown as AnalyserNode,
  };
}

// ── Loop lifecycle ────────────────────────────────────────────────────────────

describe('rAF loop lifecycle', () => {
  it('schedules rAF when isListening becomes true', () => {
    const analyserRef = makeAnalyserRef();
    renderHook(() => usePitchDetector({ analyserRef }));

    act(() => {
      useAppStore.setState({ isListening: true });
    });

    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('cancels rAF and clears detectedNote when isListening becomes false', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));

    act(() => {
      useAppStore.setState({ isListening: true });
    });

    // Start with a detected note
    advanceTime(100);
    act(() => { triggerFrame(); });

    act(() => {
      useAppStore.setState({ isListening: false });
    });

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
    expect(useAppStore.getState().detectedNote).toBeNull();
  });

  it('cancels rAF and clears detectedNote on unmount', () => {
    const analyserRef = makeAnalyserRef();
    const { unmount } = renderHook(() => usePitchDetector({ analyserRef }));

    act(() => {
      useAppStore.setState({ isListening: true });
    });

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
    expect(useAppStore.getState().detectedNote).toBeNull();
  });
});

// ── Timestamp frame gate ──────────────────────────────────────────────────────

describe('timestamp frame gate', () => {
  it('skips pitchy when two frames fire within <33ms', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    // First frame at t=100ms — passes gate (100 - 0 = 100 >= 33)
    advanceTime(100);
    act(() => { triggerFrame(); });
    const callsAfterFirst = mockFindPitch.mock.calls.length;

    // Second frame within <33ms — should be gated
    advanceTime(10);
    act(() => { triggerFrame(); });

    expect(mockFindPitch.mock.calls.length).toBe(callsAfterFirst);
  });

  it('runs pitchy when frames are ≥33ms apart', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });
    const callsAfterFirst = mockFindPitch.mock.calls.length;

    advanceTime(50);
    act(() => { triggerFrame(); });

    expect(mockFindPitch.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});

// ── Null guard ────────────────────────────────────────────────────────────────

describe('null guard', () => {
  it('skips frame silently when analyserRef is null', () => {
    const analyserRef = { current: null };
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });

    expect(mockFindPitch).not.toHaveBeenCalled();
    expect(useAppStore.getState().detectedNote).toBeNull();
    // Loop still reschedules
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
  });
});

// ── Valid detection ───────────────────────────────────────────────────────────

describe('valid pitch detection', () => {
  it('writes correct DetectedNote to store for A4 (440 Hz)', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });

    const note = useAppStore.getState().detectedNote;
    expect(note).not.toBeNull();
    expect(note!.midiNote).toBe(69);
    expect(note!.keyIndex).toBe(48);
    expect(note!.noteName).toBe('A');
    expect(note!.octave).toBe(4);
    expect(note!.frequency).toBe(440);
    expect(note!.clarity).toBe(0.95);
  });

  it('does not emit note when clarity is below 0.90', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.85]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote).toBeNull();
  });

  it('does not emit note when frequency is out of piano range', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([20, 0.99]); // Below A0

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote).toBeNull();
  });
});

// ── Change detection ──────────────────────────────────────────────────────────

describe('change detection (BR-04)', () => {
  it('does not write to store when the same note is sustained', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    const { rerender } = renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    // First detection
    advanceTime(100);
    act(() => { triggerFrame(); });
    const firstNote = useAppStore.getState().detectedNote;

    // Second detection — same note
    advanceTime(50);
    act(() => { triggerFrame(); });
    rerender();

    // detectedNote should be same object reference (no new write)
    expect(useAppStore.getState().detectedNote).toBe(firstNote);
  });

  it('updates store when note changes', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]); // A4

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });
    expect(useAppStore.getState().detectedNote?.midiNote).toBe(69);

    // Switch to C5 (523.25 Hz)
    mockFindPitch.mockReturnValue([523.25, 0.95]);
    advanceTime(50);
    act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote?.midiNote).toBe(72);
  });
});

// ── Note release debounce ─────────────────────────────────────────────────────

describe('3-frame debounce (BR-07)', () => {
  function setupWithNote() {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });
    expect(useAppStore.getState().detectedNote).not.toBeNull();

    // Now switch to null frames
    mockFindPitch.mockReturnValue([0, 0]);
    return analyserRef;
  }

  it('holds last note after 1 null frame', () => {
    setupWithNote();

    advanceTime(50);
    act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote).not.toBeNull();
  });

  it('holds last note after 2 null frames', () => {
    setupWithNote();

    advanceTime(50); act(() => { triggerFrame(); });
    advanceTime(50); act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote).not.toBeNull();
  });

  it('emits null after 3 consecutive null frames', () => {
    setupWithNote();

    advanceTime(50); act(() => { triggerFrame(); });
    advanceTime(50); act(() => { triggerFrame(); });
    advanceTime(50); act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote).toBeNull();
  });

  it('resets debounce counter when valid note resumes before 3 frames', () => {
    setupWithNote();

    advanceTime(50); act(() => { triggerFrame(); }); // 1 null
    advanceTime(50); act(() => { triggerFrame(); }); // 2 nulls

    // Resume valid detection
    mockFindPitch.mockReturnValue([523.25, 0.95]);
    advanceTime(50); act(() => { triggerFrame(); });

    expect(useAppStore.getState().detectedNote).not.toBeNull();
    expect(useAppStore.getState().detectedNote?.midiNote).toBe(72);

    // Confirm debounce counter was reset — 1 null frame now should hold note
    mockFindPitch.mockReturnValue([0, 0]);
    advanceTime(50); act(() => { triggerFrame(); });
    expect(useAppStore.getState().detectedNote).not.toBeNull();
  });
});

// ── Note history ──────────────────────────────────────────────────────────────

describe('note history (BR-05, BR-06)', () => {
  it('prepends new note to history', () => {
    const analyserRef = makeAnalyserRef();
    mockFindPitch.mockReturnValue([440, 0.95]);

    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    advanceTime(100);
    act(() => { triggerFrame(); });

    expect(useAppStore.getState().noteHistory).toHaveLength(1);
    expect(useAppStore.getState().noteHistory[0].midiNote).toBe(69);
  });

  it('caps history at 5 entries', () => {
    const analyserRef = makeAnalyserRef();
    renderHook(() => usePitchDetector({ analyserRef }));
    act(() => { useAppStore.setState({ isListening: true }); });

    const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0]; // C4–A4
    for (const freq of freqs) {
      mockFindPitch.mockReturnValue([freq, 0.95]);
      advanceTime(100);
      act(() => { triggerFrame(); });
    }

    expect(useAppStore.getState().noteHistory).toHaveLength(5);
    // Most recent note (A4) should be first
    expect(useAppStore.getState().noteHistory[0].midiNote).toBe(69);
  });
});
