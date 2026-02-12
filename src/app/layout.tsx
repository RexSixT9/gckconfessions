import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
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
    "Anonymous confession box for students with safe rate-limiting and review workflow.",
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
          <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
              <Link
                href="/"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-bold tracking-tight text-[hsl(var(--foreground))] sm:gap-2 sm:text-base"
              >
                {/* <div className="h-5 w-5 rounded-full bg-[hsl(var(--accent))] sm:h-6 sm:w-6"></div> */}
                <span className="flex flex-col text-[11px] leading-tight break-words sm:flex-row sm:gap-1 sm:text-base">
                  <span>GCK</span>
                  <span>Confessions</span>
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
