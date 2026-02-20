import { memo } from 'react';

const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          © {new Date().getFullYear()} GCK Confessions
        </p>
        <div className="flex gap-4 text-xs">
          <a href="#" className="text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]">Privacy</a>
          <a href="#" className="text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--accent))]">Guidelines</a>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
