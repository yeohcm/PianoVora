import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makeGainNode() {
  return {
    gain: {
      value: 0.08,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function makeOscillatorNode() {
  return {
    type: 'sine',
    frequency: {
      setValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function makeAudioContext() {
  const osc = makeOscillatorNode();
  const gain = makeGainNode();
  return {
    state: 'running',
    currentTime: 10,
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
    destination: {} as AudioDestinationNode,
  };
}

describe('synthesizer', () => {
  let mockCtx: any;
  let playNote: any;
  let stopNote: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockCtx = makeAudioContext();
    vi.stubGlobal('AudioContext', vi.fn(() => mockCtx));

    vi.resetModules();
    const synth = await import('@/features/keyboard/synthesizer');
    playNote = synth.playNote;
    stopNote = synth.stopNote;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('playNote() initializes AudioContext, sets properties, and plays note', () => {
    playNote(440);

    expect(window.AudioContext).toHaveBeenCalled();
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();

    const osc = mockCtx.createOscillator();
    const gain = mockCtx.createGain();

    expect(osc.type).toBe('triangle');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 10);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.15, 10.01);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.08, 10.2);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 11.5);
    expect(osc.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(mockCtx.destination);
    expect(osc.start).toHaveBeenCalledWith(10);
    expect(osc.stop).toHaveBeenCalledWith(11.6);
  });

  it('playNote() stops previous note smoothly if already playing', () => {
    // Start first note
    playNote(440);
    const osc1 = mockCtx.createOscillator();
    const gain1 = mockCtx.createGain();

    // Start second note (triggers truncation)
    playNote(880);

    expect(gain1.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(gain1.gain.setValueAtTime).toHaveBeenCalledWith(gain1.gain.value, 10);
    expect(gain1.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.05);

    vi.advanceTimersByTime(100);
    expect(osc1.stop).toHaveBeenCalled();
    expect(osc1.disconnect).toHaveBeenCalled();
  });

  it('stopNote() ramps down active note', () => {
    playNote(440);
    const osc = mockCtx.createOscillator();
    const gain = mockCtx.createGain();

    stopNote();

    expect(gain.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(gain.gain.value, 10);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.05);

    vi.advanceTimersByTime(100);
    expect(osc.stop).toHaveBeenCalled();
    expect(osc.disconnect).toHaveBeenCalled();
  });
});
