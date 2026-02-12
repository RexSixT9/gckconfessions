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
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center">
            {/* 404 Illustration */}
            <div className="relative mb-8 sm:mb-12">
              {/* Gradient Background */}
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 blur-3xl"></div>
              
              {/* 404 Text */}
              <div className="relative">
                <h1 className="text-6xl font-bold tracking-tighter text-[hsl(var(--foreground))] sm:text-9xl lg:text-[12rem]">
                  404
                </h1>
                <div className="absolute inset-0 bg-linear-to-r from-[hsl(var(--accent))]/30 to-transparent bg-clip-text text-6xl font-bold tracking-tighter text-transparent sm:text-9xl lg:text-[12rem]">
                  404
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-8 max-w-2xl space-y-4 sm:mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-2">
                <Search className="h-4 w-4 text-[hsl(var(--accent))]" />
                <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                  Not found
                </span>
              </div>

              <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                Page not found
              </h2>
              
              <p className="text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
                The page you requested doesn't exist.
              </p>

              {/* Auto-redirect notification */}
              {autoRedirect && countdown > 0 && (
                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-4">
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
                    Cancel redirect
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={handleGoHome}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-sm transition hover:opacity-90 sm:w-auto sm:px-8 sm:py-3.5"
              >
                <Home className="h-4 w-4" />
                Home
              </button>
              
              <button
                onClick={handleGoBack}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] sm:w-auto sm:px-8 sm:py-3.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
