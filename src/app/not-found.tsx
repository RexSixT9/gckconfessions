'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';


export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRedirect]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-1 flex-col items-center justify-center"
    >
      {/* 404 Section */}
      <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="flex flex-col items-center text-center">
          {/* 404 Illustration */}
          <div className="relative mb-6 sm:mb-10">
            {/* Gradient Background */}
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 blur-3xl"></div>

            {/* 404 Text */}
            <div className="relative">
              <h1 className="text-5xl font-bold tracking-tighter text-[hsl(var(--foreground))] sm:text-8xl lg:text-[10rem]">
                404
              </h1>
              <div className="absolute inset-0 bg-linear-to-r from-[hsl(var(--accent))]/30 to-transparent bg-clip-text text-5xl font-bold tracking-tighter text-transparent sm:text-8xl lg:text-[10rem]">
                404
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6 max-w-2xl space-y-3 sm:mb-10 sm:space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-2">
              <Search className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                Not found
              </span>
            </div>

            <h2 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-2xl lg:text-3xl">
              Page not found
            </h2>

            <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
              The page you requested doesn&apos;t exist.
            </p>

            {/* Auto-redirect notification */}
            {autoRedirect && countdown > 0 && (
              <div className="card mx-auto mt-6 max-w-md p-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Redirecting to home in{' '}
                  <span className="font-bold text-[hsl(var(--accent))]">
                    {countdown}
                  </span>{' '}
                  second{countdown !== 1 ? 's' : ''}...
                </p>
                <button
                  onClick={handleCancelRedirect}
                  className="mt-2 text-xs text-[hsl(var(--muted-foreground))] underline transition hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/30"
                >
                  Cancel redirect
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-3">
            <button
              onClick={handleGoHome}
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              <Home className="h-4 w-4" />
              Home
            </button>

            <button
              onClick={handleGoBack}
              className="btn-secondary btn-lg w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
