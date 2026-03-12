'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const Footer = memo(function Footer() {
  return (
    <footer className="bg-background animate-fade-in">
      <Separator />
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-between sm:gap-0 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] text-muted-foreground sm:text-left sm:text-xs">
          © {new Date().getFullYear()} GCK Confessions — With love, Batman
        </p>
        <div className="flex gap-4 text-[11px] sm:text-xs">
          <Link
            href="/guidelines"
            className="text-muted-foreground transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          >
            Privacy &amp; Guidelines
          </Link>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
