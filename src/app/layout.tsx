import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { Heart } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GCK Confessions",
  description:
    "Anonymous confessions for students. Every post is reviewed before publishing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          {/* ── Header ── */}
          <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm">
            <AnnouncementBanner />
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
              {/* Logo */}
              <Link
                href="/"
                className="group flex items-center gap-2 rounded-lg px-1 py-1 text-[hsl(var(--foreground))] transition hover:opacity-80"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--accent))]">
                  <Heart className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  GCK Confessions
                </span>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href="/submit"
                  className="hidden rounded-lg bg-[hsl(var(--accent))] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 sm:inline-flex"
                >
                  Write
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
