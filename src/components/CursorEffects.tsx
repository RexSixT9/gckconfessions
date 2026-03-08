'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  createdAt: number;
}

export function CursorEffects() {
  const [trails, setTrails] = useState<TrailDot[]>([]);
  const [pulses, setPulses] = useState<PulseRipple[]>([]);
  const trailIdRef = useRef(0);
  const pulseIdRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const rafIdRef = useRef<number | undefined>(undefined);
  const isActiveRef = useRef(false);

  const fadeTrails = useCallback(() => {
    setTrails((prev) => {
      const next = prev
        .map((trail) => ({
          ...trail,
          opacity: trail.opacity - 0.04,
        }))
        .filter((trail) => trail.opacity > 0);

      // Stop the RAF loop if no trails remain
      if (next.length === 0) {
        isActiveRef.current = false;
        return next;
      }

      rafIdRef.current = requestAnimationFrame(fadeTrails);
      return next;
    });
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    if (prefersReducedMotion()) return;
    // Check if touch device
    if (isTouchDevice()) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTimeRef.current < 60) return; // ~16 FPS for trails
      lastMoveTimeRef.current = now;

      const newTrail: TrailDot = {
        id: trailIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
      };

      setTrails((prev) => [...prev, newTrail].slice(-6));

      // Start fade loop if not running
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        rafIdRef.current = requestAnimationFrame(fadeTrails);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const newPulse: PulseRipple = {
        id: pulseIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        createdAt: Date.now(),
      };

      setPulses((prev) => [...prev, newPulse]);

      setTimeout(() => {
        setPulses((prev) => prev.filter((p) => p.id !== newPulse.id));
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [fadeTrails]);

  return (
    <>
      {/* Cursor Trail Dots */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="pointer-events-none fixed z-9999 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] mix-blend-screen"
          style={{
            left: trail.x,
            top: trail.y,
            opacity: trail.opacity * (index / trails.length),
            transform: 'translate(-50%, -50%)',
            willChange: 'opacity',
          }}
        />
      ))}

      {/* Click Pulse Ripples */}
      {pulses.map((pulse) => (
        <div
          key={pulse.id}
          className="pointer-events-none fixed z-9998 animate-cursor-pulse rounded-full border-2 border-[hsl(var(--accent))]"
          style={{
            left: pulse.x,
            top: pulse.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </>
  );
}
