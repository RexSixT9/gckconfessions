'use client';

import { useEffect, useRef, useState } from 'react';
import { isTouchDevice, prefersReducedMotion } from '@/lib/motionConfig';

type Point = { x: number; y: number };

const LERP_FACTOR = 0.18;
const IDLE_HIDE_MS = 1200;

export default function SmoothCursorFollower() {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const pressedRef = useRef(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const idleTimerRef = useRef<number | undefined>(undefined);

  const targetRef = useRef<Point>({ x: -120, y: -120 });
  const currentRef = useRef<Point>({ x: -120, y: -120 });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (isTouchDevice()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let active = true;

    const render = () => {
      if (!active || !bubbleRef.current) return;

      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * LERP_FACTOR;
      current.y += (target.y - current.y) * LERP_FACTOR;

      bubbleRef.current.style.transform = `translate(${current.x}px, ${current.y}px) translate(-50%, -50%) scale(${pressedRef.current ? 0.88 : 1})`;
      rafRef.current = requestAnimationFrame(render);
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => setVisible(false), IDLE_HIDE_MS);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
      resetIdleTimer();
    };

    const handlePointerDown = () => {
      pressedRef.current = true;
    };

    const handlePointerUp = () => {
      pressedRef.current = false;
    };

    const handlePointerCancel = () => {
      pressedRef.current = false;
    };

    const handleMouseLeaveWindow = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        visibleRef.current = false;
        setVisible(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: true });
    window.addEventListener('mouseout', handleMouseLeaveWindow);

    rafRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('mouseout', handleMouseLeaveWindow);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={bubbleRef}
      className="pointer-events-none fixed z-9997 h-7 w-7 rounded-full border border-accent/30 bg-accent/10 mix-blend-screen transition-opacity duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: 'translate(-120px, -120px)',
        willChange: 'transform, opacity',
      }}
      aria-hidden="true"
    />
  );
}
