import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioEngine } from '@/features/audio/useAudioEngine';
import { useAppStore } from '@/store/appStore';
import { DEFAULT_NOISE_GATE, FFT_SIZE } from '@/shared/constants';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeAnalyserNode(overrides: Partial<AnalyserNode> = {}): AnalyserNode {
  return {
    fftSize: FFT_SIZE,
    smoothingTimeConstant: 0,
    frequencyBinCount: FFT_SIZE / 2,
    getFloatTimeDomainData: vi.fn((buf: Float32Array) => buf.fill(0)),
    connect: vi.fn(),
    disconnect: vi.fn(),
    ...overrides,
  } as unknown as AnalyserNode;
}

function makeAudioContext(overrides: Partial<AudioContext> = {}): AudioContext {
  const analyser = makeAnalyserNode();
  return {
    state: 'running',
    sampleRate: 48_000,
    latencyHint: 'interactive',
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    destination: {} as AudioDestinationNode,
    onstatechange: null,
    ...overrides,
  } as unknown as AudioContext;
}

function makeMicStream(): MediaStream {
  const track = {
    kind: 'audio',
    onended: null as (() => void) | null,
  };
  return {
    getAudioTracks: vi.fn(() => [track]),
  } as unknown as MediaStream;
}

// ── Setup ─────────────────────────────────────────────────────────────────

let mockContext: AudioContext;
let mockStream: MediaStream;

beforeEach(() => {
  vi.useFakeTimers();
  mockContext = makeAudioContext();
  mockStream = makeMicStream();

  vi.stubGlobal('AudioContext', vi.fn(() => mockContext));
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    setTimeout(() => cb(performance.now()), 16);
    return 1;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  // Reset store to initial state
  useAppStore.setState({
    isListening: false,
    permissionState: 'prompt',
    audioLevel: 0,
    noiseGateThreshold: DEFAULT_NOISE_GATE,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('useAudioEngine', () => {
  it('start() — granted path — sets isListening and permissionState', async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.start();
    });

    const state = useAppStore.getState();
    expect(state.isListening).toBe(true);
    expect(state.permissionState).toBe('granted');
  });

  it('start() — denied path — sets permissionState to denied', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
      new DOMException('denied', 'NotAllowedError'),
    );

    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.start();
    });

    const state = useAppStore.getState();
    expect(state.permissionState).toBe('denied');
    expect(state.isListening).toBe(false);
  });

  it('start() — device error path — sets permissionState to error', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
      new DOMException('not found', 'NotFoundError'),
    );

    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.start();
    });

    expect(useAppStore.getState().permissionState).toBe('error');
  });

  it('stop() — sets isListening to false and suspends AudioContext', async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => { await result.current.start(); });
    act(() => { result.current.stop(); });

    expect(useAppStore.getState().isListening).toBe(false);
    expect(mockContext.suspend).toHaveBeenCalled();
  });

  it('start() after stop() — resumes without re-requesting getUserMedia', async () => {
    const getUserMedia = vi.mocked(navigator.mediaDevices.getUserMedia);
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => { await result.current.start(); });
    act(() => { result.current.stop(); });

    // Simulate suspended context for resume path
    Object.defineProperty(mockContext, 'state', { value: 'suspended', configurable: true });

    await act(async () => { await result.current.start(); });

    expect(getUserMedia).toHaveBeenCalledTimes(1); // not called again
    expect(mockContext.resume).toHaveBeenCalled();
    expect(useAppStore.getState().isListening).toBe(true);
  });

  it('computeRMS — noise gate suppresses level when RMS below threshold', async () => {
    // getFloatTimeDomainData fills with zeros → RMS = 0 < DEFAULT_NOISE_GATE
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => { await result.current.start(); });
    await act(async () => { vi.advanceTimersByTime(100); });

    expect(useAppStore.getState().audioLevel).toBe(0);
  });

  it('reconnect via onstatechange — calls audioContext.resume()', async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.start(); });

    await act(async () => {
      // Simulate system-level suspension: set state before firing the handler
      Object.defineProperty(mockContext, 'state', { value: 'suspended', configurable: true });
      (mockContext as unknown as { onstatechange: () => void }).onstatechange?.();
    });

    expect(mockContext.resume).toHaveBeenCalled();
  });

  it('circuit breaker — error state after MAX_RECONNECT_ATTEMPTS failures', async () => {
    vi.mocked(mockContext.resume).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.start(); });

    // One suspended onstatechange drains the recursive retry chain until circuit breaker fires
    await act(async () => {
      Object.defineProperty(mockContext, 'state', { value: 'suspended', configurable: true });
      (mockContext as unknown as { onstatechange: () => void }).onstatechange?.();
    });

    const state = useAppStore.getState();
    expect(state.permissionState).toBe('error');
    expect(state.isListening).toBe(false);
  });

  it('userIntentStopped guard — no reconnect after manual stop', async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.start(); });
    act(() => { result.current.stop(); });

    await act(async () => {
      (mockContext as unknown as { onstatechange: () => void }).onstatechange?.();
    });

    // resume should only have been called during the initial start, not after stop
    const resumeCallCount = vi.mocked(mockContext.resume).mock.calls.length;
    expect(resumeCallCount).toBe(0);
  });

  it('cleanup on unmount — closes AudioContext and cancels rAF', async () => {
    const { result, unmount } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.start(); });

    unmount();

    expect(mockContext.close).toHaveBeenCalled();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('exposes analyserRef after start', async () => {
    const { result } = renderHook(() => useAudioEngine());
    await act(async () => { await result.current.start(); });

    expect(result.current.analyserRef.current).not.toBeNull();
  });
});
