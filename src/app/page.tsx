'use client';

import { ArrowUpRight, Heart, MessageSquare, Sparkles, Send } from 'lucide-react';
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
        <div className="sticky top-14 z-40 border-b border-[hsl(var(--border))]/70 bg-[hsl(var(--background))]/90 backdrop-blur sm:hidden">
          <div className="mx-auto flex w-full max-w-6xl px-4 py-3">
            <a
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-2.5 text-center text-sm font-semibold text-[hsl(var(--foreground))] shadow-sm transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))]"
              href="/submit"
            >
              <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
              Write a confession
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-6 sm:space-y-8">
              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-4 py-2 animate-slide-down">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]"></span>
                <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                  Anonymous • Moderated
                </span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4 animate-slide-up animation-delay-100">
                <h1 className="text-balance wrap-break-word text-2xl font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
                  Share a confession.
                </h1>
                <p className="text-balance wrap-break-word text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
                  Post anonymously. Every message is reviewed before it appears.
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Why anonymous? It helps people share honestly without pressure.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 animate-slide-up animation-delay-200">
                <a
                  href="/submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-sm transition hover:opacity-90 active:scale-95 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Write a confession
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] active:scale-95 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  How it works
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-2 pt-4 sm:flex-row sm:items-center sm:gap-3 animate-slide-up animation-delay-300">
                {[
                  { icon: MessageSquare, label: 'No accounts' },
                  { icon: Heart, label: 'Reviewed for safety' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5"
                    >
                      <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Visual */}
            <div className="hidden lg:flex lg:items-center lg:justify-center animate-slide-in-right animation-delay-200">
              <div className="relative">
                {/* Gradient Background */}
                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-[hsl(var(--accent))]/10 to-transparent blur-3xl"></div>

                {/* Card Display */}
                <div className="relative space-y-3 rounded-3xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-6 shadow-sm">
                  {[
                    {
                      text: 'I have a confession.',
                      color: 'from-[hsl(var(--accent))] to-[hsl(var(--accent))]/85',
                    },
                    {
                      text: 'I never said this out loud.',
                      color: 'from-[hsl(var(--accent))]/70 to-[hsl(var(--accent))]/45',
                    },
                    {
                      text: 'This has been on my mind.',
                      color: 'from-[hsl(var(--accent))]/55 to-[hsl(var(--accent))]/30',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`transform rounded-2xl bg-linear-to-r ${item.color} p-4 text-white shadow-sm transition hover:shadow-md hover:-translate-y-1 sm:p-6 animate-slide-up`}
                      style={{
                        transform: `rotate(${i === 0 ? -2 : i === 1 ? 0 : 2}deg) translateY(${i * 8}px)`,
                        animationDelay: `${(i + 3) * 100}ms`,
                      }}
                    >
                      <p className="text-sm font-medium sm:text-base">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:hidden animate-slide-up animation-delay-200">
              <div className="rounded-3xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-4 shadow-sm sm:p-5">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--secondary))] p-4 transition hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5">
                    <p className="text-sm text-[hsl(var(--foreground))]">&ldquo;I have a confession.&rdquo;</p>
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--secondary))] p-4 transition hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5">
                    <p className="text-sm text-[hsl(var(--foreground))]">&ldquo;I never said this out loud.&rdquo;</p>
                  </div>
                  <div className="rounded-2xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--secondary))] p-4 transition hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5">
                    <p className="text-sm text-[hsl(var(--foreground))]">&ldquo;This has been on my mind.&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="border-t border-[hsl(var(--border))]/70">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
            <div className="mb-8 text-center sm:mb-14 animate-slide-up">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-3 py-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]"></span>
                How it works
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
                Three simple steps
              </h2>
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                Anonymous by design.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Write',
                  description: 'Share your message. No account needed.',
                  icon: Heart,
                },
                {
                  step: '02',
                  title: 'Review',
                  description: 'Moderators check for safety and clarity.',
                  icon: MessageSquare,
                },
                {
                  step: '03',
                  title: 'Publish',
                  description: 'Approved posts go live for the community.',
                  icon: Send,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="group rounded-3xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1 animate-slide-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--accent))]/12 transition group-hover:bg-[hsl(var(--accent))]/20">
                        <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                      </div>
                      <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {item.description}
                    </p>
                    <div className="mt-4 h-1 w-full rounded-full bg-[hsl(var(--accent))]/10">
                      <div className="h-1 w-10 rounded-full bg-[hsl(var(--accent))] transition group-hover:w-12"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Guidelines Section */}
        <section className="border-t border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="animate-slide-in-left">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] sm:text-3xl">
                  Community guidelines
                </h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                  Keep it kind. We review every post for safety and clarity.
                </p>
              </div>
              <div className="rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-5 shadow-sm transition hover:shadow-md animate-slide-in-right">
                <ul className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <li className="flex items-start gap-2 transition hover:text-[hsl(var(--accent))]">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--accent))]"></span>
                    No hate, threats, or harassment.
                  </li>
                  <li className="flex items-start gap-2 transition hover:text-[hsl(var(--accent))]">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--accent))]"></span>
                    Keep personal details private.
                  </li>
                  <li className="flex items-start gap-2 transition hover:text-[hsl(var(--accent))]">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--accent))]"></span>
                    Be honest, concise, and respectful.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="border-t border-[hsl(var(--border))]/70 bg-[hsl(var(--secondary))]/70">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-24 lg:py-28">
            <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-5 shadow-sm sm:p-10 lg:p-12 animate-slide-up">
              <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-[hsl(var(--accent))]/10 blur-3xl"></div>
              <div className="absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-[hsl(var(--accent))]/10 blur-3xl"></div>
              <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-8">
                <div className="space-y-2 text-center sm:text-left min-w-0 flex-1 animate-slide-in-left animation-delay-200">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-3 py-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                    Start here
                  </div>
                  <h3 className="text-balance wrap-break-word text-xl font-semibold text-[hsl(var(--foreground))] sm:text-3xl">
                    Ready to share?
                  </h3>
                  <p className="text-balance wrap-break-word text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                    It takes under a minute. Anonymous by default.
                  </p>
                </div>
                <a
                  href="/submit"
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[hsl(var(--accent))] px-6 py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-sm transition hover:opacity-90 active:scale-95 sm:w-auto sm:px-8 sm:py-3 animate-slide-in-right animation-delay-200"
                >
                  Start writing
                  <ArrowUpRight className="h-4 w-4" />
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
