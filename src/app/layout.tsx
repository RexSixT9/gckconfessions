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
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Header Navbar */}
          <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--background))]/90 backdrop-blur">
            <AnnouncementBanner />
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
              <Link
                href="/"
                className="group flex items-center gap-2 text-[hsl(var(--foreground))] transition-opacity hover:opacity-90"
              >
                <Heart className="h-4 w-4 text-[hsl(var(--accent))]" />
                <span className="text-sm font-semibold tracking-tight sm:text-base">
                  GCK Confessions
                </span>
              </Link>
              <ThemeToggle />
            </div>
          </header>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
