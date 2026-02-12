'use client';

import { Heart, Shield, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => null,
  ssr: true,
});

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <main className="flex-1">
        {/* Mobile CTA Bar */}
        <div className="sticky top-14 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur sm:hidden">
          <div className="mx-auto flex w-full max-w-6xl px-4 py-3">
            <a
              className="w-full rounded-lg bg-[hsl(var(--accent))] px-4 py-2.5 text-center text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-sm transition hover:opacity-90"
              href="/submit"
            >
              Share Your Confession
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-8">
              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/8 px-4 py-2.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]" style={{boxShadow: '0 0 8px hsl(var(--accent))'}}></span>
                <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                  Private • Safe • Moderated
                </span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
                  Share Your{' '}
                  <span className="bg-linear-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent))]/75 bg-clip-text text-transparent">
                    Inner Thoughts
                  </span>
                </h1>
                <p className="text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
                  A safe, judgment-free space where your campus community can share authentic thoughts, feelings, and stories—completely anonymous and carefully moderated.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <a
                  href="/submit"
                  className="inline-flex items-center justify-center rounded-lg bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-md transition hover:shadow-lg hover:opacity-90 sm:px-8 sm:py-3.5"
                >
                  Write a Confession
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-lg border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--secondary))] sm:px-8 sm:py-3.5"
                >
                  Learn More
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Shield className="h-4 w-4 text-[hsl(var(--accent))]" />
                  <span>No spam • Protected</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Heart className="h-4 w-4 text-[hsl(var(--accent))]" />
                  <span>Trusted by community</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="hidden lg:flex lg:items-center lg:justify-center">
              <div className="relative">
                {/* Gradient Background */}
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[hsl(var(--accent))]/10 to-[hsl(var(--accent))]/5 blur-3xl"></div>

                {/* Card Display */}
                <div className="relative space-y-3">
                  {[
                    {
                      text: 'I have a secret...',
                      color: 'from-[hsl(var(--accent))] to-[hsl(var(--accent))]/80',
                    },
                    {
                      text: 'Sometimes I wonder...',
                      color: 'from-[hsl(var(--accent))]/70 to-[hsl(var(--accent))]/50',
                    },
                    {
                      text: 'Nobody knows that I...',
                      color: 'from-[hsl(var(--accent))]/50 to-[hsl(var(--accent))]/30',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`transform rounded-xl bg-linear-to-r ${item.color} p-4 text-white shadow-lg transition hover:shadow-xl hover:-translate-y-1 sm:p-6`}
                      style={{
                        transform: `rotate(${i === 0 ? -2 : i === 1 ? 0 : 2}deg) translateY(${i * 8}px)`,
                      }}
                    >
                      <p className="text-sm font-medium sm:text-base">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <div className="mb-8 space-y-4 text-center sm:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl lg:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                Three simple steps to share your thoughts while maintaining your privacy and integrity.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Write',
                  description: 'Share your authentic thoughts anonymously. No signup required.',
                  icon: Heart,
                },
                {
                  step: '02',
                  title: 'Review',
                  description: 'Our team reviews for quality and community guidelines.',
                  icon: Shield,
                },
                {
                  step: '03',
                  title: 'Share',
                  description: 'Your confession is published and seen by your community.',
                  icon: Zap,
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition hover:border-[hsl(var(--accent))] hover:shadow-md sm:p-8"
                  >
                    {/* Step Number */}
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10 text-base font-bold text-[hsl(var(--accent))] group-hover:bg-[hsl(var(--accent))]/20">
                      {item.step}
                    </div>

                    {/* Icon */}
                    <div className="mb-4">
                      <Icon className="h-8 w-8 text-[hsl(var(--accent))]" />
                    </div>

                    {/* Content */}
                    <h3 className="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-[hsl(var(--accent))]/30 bg-linear-to-br from-[hsl(var(--accent))]/8 to-transparent p-6 sm:flex-row sm:gap-8 sm:p-10 lg:p-12">
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] sm:text-3xl">
                  Ready to Share Your Story?
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                  Your voice matters. Share what is on your mind - completely anonymous.
                </p>
              </div>
              <a
                href="/submit"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--accent))] px-6 py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-md transition hover:shadow-lg hover:opacity-90 sm:px-8 sm:py-3"
              >
                Write a Confession
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
