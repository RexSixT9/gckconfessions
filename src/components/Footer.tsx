'use client';

import { memo } from 'react';
import { Heart } from 'lucide-react';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))]/70 bg-[hsl(var(--background))]/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <Heart className="h-4 w-4 text-[hsl(var(--accent))]" />
            <p className="wrap-break-word">© {currentYear} GCK Confessions. Anonymous, moderated posts.</p>
          </div>
          <div className="flex shrink-0 gap-4 text-xs">
            <a
              href="#"
              className="whitespace-nowrap text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]"
            >
              Privacy
            </a>
            <a
              href="#"
              className="whitespace-nowrap text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]"
            >
              Guidelines
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
