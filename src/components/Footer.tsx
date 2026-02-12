'use client';

import { memo } from 'react';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:items-center sm:text-left">
          <p className="break-words text-xs text-[hsl(var(--muted-foreground))]">
            © {currentYear} GCK Confessions. Anonymous for everyone.
          </p>
          <div className="flex shrink-0 gap-3 text-xs sm:gap-4">
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
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
