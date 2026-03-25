'use client';

import { memo } from 'react';
import Link from 'next/link';

const Footer = memo(function Footer() {
  return (
    <footer className="shrink-0 border-t border-border/70 bg-background animate-fade-in">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
        <p className="text-[0.64rem] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-[0.68rem]">
          © {new Date().getFullYear()} GCK Confessions
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4 text-[0.64rem] font-medium uppercase tracking-[0.12em] sm:text-[0.68rem]">
          <Link
            href="/guidelines"
            className="rounded-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Privacy &amp; Community Rules
          </Link>
        </nav>
      </div>
    </footer>
  );
});

export default Footer;
