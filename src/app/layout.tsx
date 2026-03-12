import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { MotionProvider } from "@/components/MotionProvider";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import { CursorEffects } from "@/components/CursorEffects";
import { SonnerToaster } from "@/components/SonnerToaster";
import PageTransition from "@/components/PageTransition";
import PWARegister from "@/components/PWARegister";
import AppPreloader from "@/components/AppPreloader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "GCK Confessions",
    template: "%s | GCK Confessions",
  },
  description:
    "Anonymous confessions for students. Every post is reviewed before publishing.",
  keywords: ["confessions", "anonymous", "students", "community"],
  authors: [{ name: "GCK Confessions" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "GCK Confessions",
    description: "Share your thoughts anonymously. Moderated for safety.",
    type: "website",
    locale: "en_US",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const campaignVariant = process.env.NEXT_PUBLIC_CAMPAIGN_VARIANT || "default";

  return (
    <html lang="en" suppressHydrationWarning data-campaign={campaignVariant}>
      <head>
        {/* Preconnect to speed up external resource loading */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inline theme script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <MotionProvider>
            <AppPreloader />
            <PWARegister />

            {/* ── Cursor Effects ── */}
            <CursorEffects />

            {/* ── Toast notifications ── */}
            <SonnerToaster />
            
            {/* ── Header ── */}
            <HeaderNav />

            <div className="flex min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))] flex-col">
              <PageTransition>{children}</PageTransition>
              <Footer />
            </div>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

