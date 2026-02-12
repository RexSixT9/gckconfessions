'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => null,
  ssr: true,
});

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, countdown, router]);

  const handleCancelRedirect = () => {
    setAutoRedirect(false);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center">
            {/* 404 Illustration */}
            <div className="relative mb-8 sm:mb-12">
              {/* Gradient Background */}
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 blur-3xl"></div>
              
              {/* 404 Text */}
              <div className="relative">
                <h1 className="text-8xl font-bold tracking-tighter text-[hsl(var(--foreground))] sm:text-9xl lg:text-[12rem]">
                  404
                </h1>
                <div className="absolute inset-0 bg-linear-to-r from-[hsl(var(--accent))]/30 to-transparent bg-clip-text text-8xl font-bold tracking-tighter text-transparent sm:text-9xl lg:text-[12rem]">
                  404
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-8 max-w-2xl space-y-4 sm:mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/8 px-4 py-2">
                <Search className="h-4 w-4 text-[hsl(var(--accent))]" />
                <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                  Page Not Found
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                Oops! This Page Doesn't Exist
              </h2>
              
              <p className="text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
                The page you're looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track.
              </p>

              {/* Auto-redirect notification */}
              {autoRedirect && countdown > 0 && (
                <div className="mx-auto mt-6 max-w-md rounded-lg border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 p-4">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Redirecting to home in{' '}
                    <span className="font-bold text-[hsl(var(--accent))]">
                      {countdown}
                    </span>{' '}
                    second{countdown !== 1 ? 's' : ''}...
                  </p>
                  <button
                    onClick={handleCancelRedirect}
                    className="mt-2 text-xs text-[hsl(var(--muted-foreground))] underline transition hover:text-[hsl(var(--foreground))]"
                  >
                    Cancel auto-redirect
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-md transition hover:opacity-90 hover:shadow-lg sm:px-8 sm:py-3.5"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </button>
              
              <button
                onClick={handleGoBack}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] sm:px-8 sm:py-3.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 sm:mt-16">
              <p className="mb-4 text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                Popular Pages
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="/"
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))] hover:shadow-sm"
                >
                  Home
                </a>
                <a
                  href="/submit"
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))] hover:shadow-sm"
                >
                  Submit Confession
                </a>
                <a
                  href="/adminlogin"
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))] hover:shadow-sm"
                >
                  Admin Login
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
