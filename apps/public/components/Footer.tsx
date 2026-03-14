'use client';

import { memo } from 'react';
import Link from 'next/link';

const Footer = memo(function Footer() {
  return (
    <footer className="shrink-0 border-t border-border/70 bg-background animate-fade-in">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
        <p className="text-[11px] text-muted-foreground sm:text-xs">
          © {new Date().getFullYear()} GCK Confessions
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4 text-[11px] sm:text-xs">
          <Link
            href="/submit"
            className="rounded-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Submit confession
          </Link>
        </nav>
      </div>
    </footer>
  );
});

export default Footer;
