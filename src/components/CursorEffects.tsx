'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, isTouchDevice } from '@/lib/motionConfig';

interface TrailDot {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

interface PulseRipple {
  id: number;
  x: number;
  y: number;
  size: number;
  durationMs: number;
  borderOpacity: number;
}

const TRAIL_FRAME_MS = 90;
const TRAIL_MAX_DOTS = 4;
const TRAIL_FADE_STEP = 0.07;
const MOVE_PULSE_INTERVAL_MS = 450;

export function CursorEffects() {
  const [trails, setTrails] = useState<TrailDot[]>([]);
  const [pulses, setPulses] = useState<PulseRipple[]>([]);
  const [isCursorVisible, setIsCursorVisible] = useState(false);
  const trailIdRef = useRef(0);
  const pulseIdRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const lastPulseTimeRef = useRef(0);
  const rafIdRef = useRef<number | undefined>(undefined);
  const isActiveRef = useRef(false);
  const isCursorVisibleRef = useRef(false);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    if (prefersReducedMotion()) return;
    // Check if touch device
    if (isTouchDevice()) return;

    function fadeTrails() {
      let shouldContinue = false;
      setTrails((prev) => {
        const next = prev
          .map((trail) => ({
            ...trail,
            opacity: trail.opacity - TRAIL_FADE_STEP,
          }))
          .filter((trail) => trail.opacity > 0);

        shouldContinue = next.length > 0;
        return next;
      });

      if (shouldContinue) {
        rafIdRef.current = requestAnimationFrame(fadeTrails);
        return;
      }

      isActiveRef.current = false;
    }

    const spawnPulse = (
      x: number,
      y: number,
      config: { size: number; durationMs: number; borderOpacity: number }
    ) => {
      const newPulse: PulseRipple = {
        id: pulseIdRef.current++,
        x,
        y,
        size: config.size,
        durationMs: config.durationMs,
        borderOpacity: config.borderOpacity,
      };

      setPulses((prev) => [...prev, newPulse]);

      window.setTimeout(() => {
        setPulses((prev) => prev.filter((p) => p.id !== newPulse.id));
      }, config.durationMs + 60);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (!isCursorVisibleRef.current) {
        isCursorVisibleRef.current = true;
        setIsCursorVisible(true);
      }

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }

      if (now - lastMoveTimeRef.current < TRAIL_FRAME_MS) return;
      lastMoveTimeRef.current = now;

      const newTrail: TrailDot = {
        id: trailIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
      };

      setTrails((prev) => [...prev, newTrail].slice(-TRAIL_MAX_DOTS));

      // Start fade loop if not running
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        rafIdRef.current = requestAnimationFrame(fadeTrails);
      }

      // Subtle kinetic pulse while moving
      if (now - lastPulseTimeRef.current > MOVE_PULSE_INTERVAL_MS) {
        lastPulseTimeRef.current = now;
        spawnPulse(e.clientX, e.clientY, {
          size: 22,
          durationMs: 520,
          borderOpacity: 0.22,
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      spawnPulse(e.clientX, e.clientY, {
        size: 30,
        durationMs: 740,
        borderOpacity: 0.4,
      });
    };

    const handleMouseLeaveWindow = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        isCursorVisibleRef.current = false;
        setIsCursorVisible(false);
      }
    };

    const handleMouseEnterWindow = () => {
      isCursorVisibleRef.current = true;
      setIsCursorVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);
    window.addEventListener('mouseout', handleMouseLeaveWindow);
    window.addEventListener('mouseover', handleMouseEnterWindow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mouseout', handleMouseLeaveWindow);
      window.removeEventListener('mouseover', handleMouseEnterWindow);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-9997 h-6 w-6 rounded-full border border-accent/30 bg-accent/8 mix-blend-screen transition-opacity duration-200"
        style={{
          opacity: isCursorVisible ? 1 : 0,
          transform: 'translate(-100px, -100px)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Cursor Trail Dots */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="pointer-events-none fixed z-9999 h-1 w-1 rounded-full bg-accent/80 mix-blend-screen"
          style={{
            left: trail.x,
            top: trail.y,
            opacity: trail.opacity * ((index + 1) / trails.length) * 0.7,
            transform: 'translate(-50%, -50%)',
            willChange: 'opacity',
          }}
        />
      ))}

      {/* Click Pulse Ripples */}
      {pulses.map((pulse) => (
        <div
          key={pulse.id}
          className="pointer-events-none fixed z-9998 animate-cursor-pulse rounded-full border-2 border-accent"
          style={{
            left: pulse.x,
            top: pulse.y,
            width: pulse.size,
            height: pulse.size,
            borderColor: `hsl(var(--accent) / ${pulse.borderOpacity})`,
            animationDuration: `${pulse.durationMs}ms`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </>
  );
}

