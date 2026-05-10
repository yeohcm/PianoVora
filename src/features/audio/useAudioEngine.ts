import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  FFT_SIZE,
  MIN_SAMPLE_RATE,
  EMA_ALPHA,
  PEAK_HOLD_MS,
  PEAK_DECAY_RATE,
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_STABILISE_MS,
} from '@/shared/constants';
import type { AudioEngineResult } from '@/shared/types';

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
  video: false,
};

function computeRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

export function useAudioEngine(): AudioEngineResult {
  const setIsListening = useAppStore((s) => s.setIsListening);
  const setPermissionState = useAppStore((s) => s.setPermissionState);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);
  const getNoiseGateThreshold = useRef(() =>
    useAppStore.getState().noiseGateThreshold,
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Pre-allocated — never reallocated after init to avoid GC pressure at 60fps
  const bufferRef = useRef<Float32Array<ArrayBuffer>>(new Float32Array(FFT_SIZE));
  const animationFrameRef = useRef<number>(0);
  const userIntentStoppedRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const prevSmoothedRef = useRef<number>(0);
  const peakLevelRef = useRef<number>(0);
  const lastPeakTimeRef = useRef<number>(0);

  const startRMSLoop = useCallback(() => {
    const loop = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      analyser.getFloatTimeDomainData(bufferRef.current);
      const rawRMS = computeRMS(bufferRef.current);
      const threshold = getNoiseGateThreshold.current();

      let smoothed: number;
      if (rawRMS < threshold) {
        smoothed = 0;
      } else {
        smoothed = EMA_ALPHA * rawRMS + (1 - EMA_ALPHA) * prevSmoothedRef.current;
      }
      prevSmoothedRef.current = smoothed;

      const now = performance.now();
      if (smoothed > peakLevelRef.current) {
        peakLevelRef.current = smoothed;
        lastPeakTimeRef.current = now;
      } else if (now - lastPeakTimeRef.current > PEAK_HOLD_MS) {
        peakLevelRef.current = Math.max(0, peakLevelRef.current - PEAK_DECAY_RATE);
      }

      setAudioLevel(smoothed);
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [setAudioLevel]);

  const stopRMSLoop = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
    prevSmoothedRef.current = 0;
    peakLevelRef.current = 0;
    lastPeakTimeRef.current = 0;
    setAudioLevel(0);
  }, [setAudioLevel]);

  const connectStream = useCallback(
    (stream: MediaStream, ctx: AudioContext, analyser: AnalyserNode) => {
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      // Required for Safari to activate the audio graph
      analyser.connect(ctx.destination);

      const track = stream.getAudioTracks()[0];
      track.onended = () => {
        if (userIntentStoppedRef.current) return;
        // Hardware disconnect — wait for device re-enumeration to settle
        setTimeout(() => attemptReconnect('getUserMedia'), RECONNECT_STABILISE_MS);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const attemptReconnect = useCallback(
    async (strategy: 'resume' | 'getUserMedia') => {
      if (userIntentStoppedRef.current) return;
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setIsListening(false);
        setPermissionState('error');
        return;
      }

      reconnectAttemptsRef.current += 1;

      try {
        const ctx = audioContextRef.current!;
        if (strategy === 'resume') {
          await ctx.resume();
        } else {
          const newStream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
          streamRef.current = newStream;
          connectStream(newStream, ctx, analyserRef.current!);
        }
        reconnectAttemptsRef.current = 0;
      } catch {
        attemptReconnect(strategy);
      }
    },
    [setIsListening, setPermissionState, connectStream],
  );

  const start = useCallback(async () => {
    userIntentStoppedRef.current = false;

    // Resume existing suspended context (subsequent starts)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      setIsListening(true);
      startRMSLoop();
      return;
    }

    // Permission request — must be inside user gesture handler for Safari (BR-15)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setPermissionState(name === 'NotAllowedError' ? 'denied' : 'error');
      return;
    }

    streamRef.current = stream;
    setPermissionState('granted');

    const ctx = new AudioContext({ latencyHint: 'interactive' });
    audioContextRef.current = ctx;

    if (ctx.sampleRate < MIN_SAMPLE_RATE) {
      ctx.close();
      setPermissionState('error');
      return;
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0;
    analyserRef.current = analyser;

    connectStream(stream, ctx, analyser);

    ctx.onstatechange = () => {
      if (userIntentStoppedRef.current) return;
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        attemptReconnect('resume');
      }
    };

    setIsListening(true);
    startRMSLoop();
  }, [setIsListening, setPermissionState, startRMSLoop, connectStream, attemptReconnect]);

  const stop = useCallback(() => {
    userIntentStoppedRef.current = true;
    stopRMSLoop();
    audioContextRef.current?.suspend();
    setIsListening(false);
  }, [stopRMSLoop, setIsListening]);

  useEffect(() => {
    return () => {
      userIntentStoppedRef.current = true;
      cancelAnimationFrame(animationFrameRef.current);
      const ctx = audioContextRef.current;
      if (ctx) {
        ctx.onstatechange = null;
        ctx.close();
      }
      const track = streamRef.current?.getAudioTracks()[0];
      if (track) track.onended = null;
      setIsListening(false);
    };
  }, [setIsListening]);

  return { start, stop, analyserRef };
}
