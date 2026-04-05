import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { MotionProvider } from "@/components/MotionProvider";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import { SonnerToaster } from "@/components/SonnerToaster";
import PageTransition from "@/components/PageTransition";
import PWARegister from "@/components/PWARegister";
import ClientVisualEffects from "@/components/ClientVisualEffects";
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

const metadataBase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "GCK Confessions",
    template: "%s | GCK Confessions",
  },
  description:
    "An anonymous space for students to share honestly. Every post is reviewed before it goes live.",
  keywords: ["confessions", "anonymous", "students", "community"],
  authors: [{ name: "GCK Confessions" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GCK Confessions",
    description: "Share what is on your mind anonymously in a community moderated for safety.",
    url: "/",
    siteName: "GCK Confessions",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GCK Confessions",
    description: "An anonymous, moderated space for students to share honestly.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const campaignVariant = process.env.NEXT_PUBLIC_CAMPAIGN_VARIANT || "default";
  const headerStore = await headers();
  const nonce = headerStore.get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning data-campaign={campaignVariant}>
      <head>
        {/* Preconnect to speed up external resource loading */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <a
          href="#app-content"
          className="sr-only fixed left-3 top-3 z-120 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground ring-2 ring-ring/60 focus:not-sr-only"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
          nonce={nonce}
        >
          <MotionProvider>
            <PWARegister />
            <ClientVisualEffects />

            {/* ── Toast notifications ── */}
            <SonnerToaster />
            
            {/* ── Header ── */}
            <HeaderNav />

            <div id="app-content" tabIndex={-1} className="flex min-h-[calc(100svh-var(--header-height))] flex-col">
              <PageTransition>{children}</PageTransition>
              <Footer />
            </div>
            <Analytics />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

