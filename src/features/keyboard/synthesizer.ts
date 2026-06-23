let audioCtx: AudioContext | null = null;
let activeOscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

export function playNote(frequency: number): void {
  // Lazily initialize AudioContext on user gesture
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
    }
  }

  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  // Stop previous oscillator cleanly with a smooth release to prevent pops
  if (activeOscillator && gainNode) {
    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      // Fast release envelope
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      
      const oldOsc = activeOscillator;
      setTimeout(() => {
        try {
          oldOsc.stop();
          oldOsc.disconnect();
        } catch {
          // silently handle edge case if osc already stopped
        }
      }, 100);
    } catch {
      // ignore context state errors
    }
  }

  // Create new oscillator and gain node for this voice
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Triangle waveform matches typical soft/warm piano-like synth tones
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    // Envelope configuration: fast attack, quick decay, sustain, and release
    gain.gain.setValueAtTime(0, now);
    // Attack: ramp up to 0.15 volume in 0.01 seconds
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    // Decay/Sustain: decay to 0.08 over 0.2 seconds
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.2);
    // Release: natural release fade out to 0 over 1.5 seconds
    gain.gain.setValueAtTime(0.08, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    // Auto-stop after the tone is fully decayed
    osc.stop(now + 1.6);

    activeOscillator = osc;
    gainNode = gain;
  } catch {
    // protect against background AudioContext shutdown issues
  }
}

export function stopNote(): void {
  if (!audioCtx || !activeOscillator || !gainNode) return;

  const now = audioCtx.currentTime;
  try {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    const oldOsc = activeOscillator;
    setTimeout(() => {
      try {
        oldOsc.stop();
        oldOsc.disconnect();
      } catch {}
    }, 100);
  } catch {}

  activeOscillator = null;
  gainNode = null;
}
