'use client';

import { memo, useRef } from 'react';
import Link from 'next/link';
import { useFadeIn } from '@/lib/gsap';

const Footer = memo(function Footer() {
  const ref = useRef<HTMLElement>(null);
  useFadeIn(ref, { y: 8, duration: 0.4, delay: 0.1 });

  return (
    <footer ref={ref} className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-between sm:gap-0 sm:px-6">
        <p className="text-center text-[11px] text-[hsl(var(--muted-foreground))] sm:text-left sm:text-xs">
          © {new Date().getFullYear()} GCK Confessions — made with ❤️ by batman
        </p>
        <div className="flex gap-4 text-[11px] sm:text-xs">
          <Link href="/guidelines" className="text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]">Privacy &amp; Guidelines</Link>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
