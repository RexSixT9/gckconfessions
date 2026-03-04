'use client';

import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Check if touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Throttle trail creation for performance
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTimeRef.current < 50) return; // 20 FPS for trails
      lastMoveTimeRef.current = now;

      const newTrail: TrailDot = {
        id: trailIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
      };

      setTrails((prev) => {
        const updated = [...prev, newTrail];
        // Keep only last 8 dots
        return updated.slice(-8);
      });
    };

    // Create pulse ripple on click
    const handleClick = (e: MouseEvent) => {
      const newPulse: PulseRipple = {
        id: pulseIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        createdAt: Date.now(),
      };

      setPulses((prev) => [...prev, newPulse]);

      // Remove after animation completes
      setTimeout(() => {
        setPulses((prev) => prev.filter((p) => p.id !== newPulse.id));
      }, 1000);
    };

    // Fade out trail dots
    const fadeTrails = () => {
      setTrails((prev) =>
        prev
          .map((trail) => ({
            ...trail,
            opacity: trail.opacity - 0.05,
          }))
          .filter((trail) => trail.opacity > 0)
      );
      rafIdRef.current = requestAnimationFrame(fadeTrails);
    };

    // Only add effects on non-touch devices
    if (!isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
      rafIdRef.current = requestAnimationFrame(fadeTrails);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Cursor Trail Dots */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="pointer-events-none fixed z-9999 h-2 w-2 rounded-full bg-[hsl(var(--accent))] mix-blend-screen"
          style={{
            left: trail.x,
            top: trail.y,
            opacity: trail.opacity * (index / trails.length), // Gradient fade
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.1s ease-out',
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
