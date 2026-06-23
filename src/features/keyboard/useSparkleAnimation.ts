import { useCallback, useEffect, useRef } from 'react';
import { getKeyGeometry } from '../../shared/pianoGeometry';

interface SparkleParticle {
  x:       number;
  y:       number;
  vx:      number;
  vy:      number;
  radius:  number;
  opacity: number;
  colour:  string;
  gravity:  number;
  fadeRate: number;
}

interface SparkleAnimationOptions {
  canvasRef:      React.RefObject<HTMLCanvasElement | null>;
  activeKeyIndex: number | null;
  keyboardWidth:  number;
  sparkleColour?: string;
  spawnCenter?:   boolean;
  particleCount?: number;
  minSpeed?:      number;
  maxSpeed?:      number;
  minRadius?:     number;
  maxRadius?:     number;
  gravity?:       number;
  fadeDuration?:  number;
}

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_GRAVITY        = 0.15;
const DEFAULT_MIN_SPEED      = 1.5;
const DEFAULT_MAX_SPEED      = 4.0;
const DEFAULT_MIN_RADIUS     = 3;
const DEFAULT_MAX_RADIUS     = 10;
const DEFAULT_FADE_DURATION  = 0.8;

export function useSparkleAnimation({
  canvasRef,
  activeKeyIndex,
  keyboardWidth,
  sparkleColour,
  spawnCenter = false,
  particleCount,
  minSpeed,
  maxSpeed,
  minRadius,
  maxRadius,
  gravity,
  fadeDuration,
}: SparkleAnimationOptions): void {
  const particlesRef      = useRef<SparkleParticle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const prevKeyIndexRef   = useRef<number | null>(null);

  const animationLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => {
      p.vy      += p.gravity * dpr;
      p.x       += p.vx;
      p.y       += p.vy;
      p.opacity -= p.fadeRate;
      if (p.opacity <= 0) return false;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      // Outer glow (theme colour)
      ctx.shadowBlur  = 12 * dpr;
      ctx.shadowColor = p.colour;
      ctx.fillStyle   = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      // Inner bright core (white)
      ctx.shadowBlur  = 4 * dpr;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      return true;
    });

    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    } else {
      animationFrameRef.current = 0;
    }
  }, [canvasRef]);

  // Spawn effect — triggers on new key detection
  useEffect(() => {
    if (activeKeyIndex === null) return;
    if (activeKeyIndex === prevKeyIndexRef.current) return;
    prevKeyIndexRef.current = activeKeyIndex;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr    = window.devicePixelRatio;
    let spawnX = 0;
    let spawnY = 0;

    if (spawnCenter) {
      spawnX = canvas.width / 2;
      spawnY = canvas.height / 2;
    } else {
      const rect = getKeyGeometry(activeKeyIndex, keyboardWidth);
      if (!rect) return;
      spawnX = (rect.x + rect.width  / 2)   * dpr;
      spawnY = (rect.y + rect.height * 0.3) * dpr;
    }

    const cssColour = getComputedStyle(document.documentElement)
      .getPropertyValue('--glow-colour').trim() || '#00f3ff';
    const colour = sparkleColour ?? cssColour;

    const count = particleCount ?? DEFAULT_PARTICLE_COUNT;
    const speedMin = minSpeed ?? DEFAULT_MIN_SPEED;
    const speedMax = maxSpeed ?? DEFAULT_MAX_SPEED;
    const radMin = minRadius ?? DEFAULT_MIN_RADIUS;
    const radMax = maxRadius ?? DEFAULT_MAX_RADIUS;
    const grav = gravity ?? DEFAULT_GRAVITY;
    const fadeRate = 1 / ((fadeDuration ?? DEFAULT_FADE_DURATION) * 60);

    const newParticles: SparkleParticle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * 2 * Math.PI - Math.PI;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      return {
        x:       spawnX,
        y:       spawnY,
        vx:      Math.cos(angle) * speed * dpr,
        vy:      (Math.sin(angle) * speed - 2.0) * dpr,
        radius:  (radMin + Math.random() * (radMax - radMin)) * dpr,
        opacity: 1.0,
        colour,
        gravity: grav,
        fadeRate,
      };
    });

    // Reduced-motion guard (Q1=B): synchronous draw + clearRect; no rAF loop
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        newParticles.forEach((p) => {
          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur  = 12 * dpr;
          ctx.shadowColor = p.colour;
          ctx.fillStyle   = p.colour;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // Append new particles and start loop if idle
    particlesRef.current = [...particlesRef.current, ...newParticles];
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    }
  }, [
    activeKeyIndex,
    keyboardWidth,
    canvasRef,
    animationLoop,
    sparkleColour,
    spawnCenter,
    particleCount,
    minSpeed,
    maxSpeed,
    minRadius,
    maxRadius,
    gravity,
    fadeDuration,
  ]);

  // Cleanup on unmount (NFR-R1)
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      particlesRef.current      = [];
    };
  }, []);
}
