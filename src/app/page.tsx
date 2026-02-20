'use client';

import Link from 'next/link';
import { ArrowUpRight, Heart, ShieldCheck, MessageSquare, Zap, Send } from 'lucide-react';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

          {/* â”€â”€ Bento Grid â”€â”€ */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {/* Cell 1 â€” Hero (lg: col-span-2) */}
            <div className="bento-cell relative col-span-1 overflow-hidden p-7 sm:col-span-2 sm:p-8 lg:p-10 animate-slide-up">
              {/* Subtle accent glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[hsl(var(--accent))]/10 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between gap-8 lg:min-h-64">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--accent))]/10 px-2.5 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                    Anonymous Â· Moderated
                  </span>
                  <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl lg:text-5xl">
                    Share a<br />confession.
                  </h1>
                  <p className="max-w-sm text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
                    Post anonymously. Every message is reviewed before it appears â€” no account needed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--accent))] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Write a confession
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))]"
                  >
                    How it works
                  </a>
                </div>
              </div>
            </div>

            {/* Cell 2 â€” Anonymous pill */}
            <div className="bento-cell flex flex-col items-start justify-between p-6 animate-slide-up animation-delay-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
                <Heart className="h-5 w-5 text-[hsl(var(--accent))]" />
              </span>
              <div className="mt-6">
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">No account</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Zero sign-up. Fully anonymous by design.
                </p>
              </div>
            </div>

            {/* Cell 3 â€” Reviewed pill */}
            <div className="bento-cell flex flex-col items-start justify-between p-6 animate-slide-up animation-delay-150">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))]" />
              </span>
              <div className="mt-6">
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">Safe & reviewed</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Moderators check every post before publishing.
                </p>
              </div>
            </div>

            {/* Cell 4 â€” Community count / accent fill */}
            <div className="bento-cell flex flex-col justify-between bg-[hsl(var(--accent))] p-6 animate-slide-up animation-delay-200">
              <Zap className="h-8 w-8 text-white/70" />
              <div>
                <p className="text-3xl font-black text-white">Fast.</p>
                <p className="text-3xl font-black text-white/70">Simple.</p>
                <p className="mt-2 text-xs text-white/60">Under a minute to share.</p>
              </div>
            </div>

            {/* Cell 5 â€” Preview card */}
            <div className="bento-cell p-5 sm:col-span-2 animate-slide-up animation-delay-200">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Sample confessions
              </p>
              <div className="space-y-2">
                {[
                  'I still think about that conversation every day.',
                  'I never told anyone, but it changed everything.',
                  'This has been on my mind for months.',
                ].map((text, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-3 text-sm text-[hsl(var(--foreground))]"
                  >
                    &ldquo;{text}&rdquo;
                  </div>
                ))}
              </div>
            </div>

            {/* â”€â”€ How it works â”€â”€ */}
            <div id="how-it-works" className="bento-cell col-span-1 bg-[hsl(var(--secondary))] p-6 animate-slide-up animation-delay-100 sm:col-span-2 lg:col-span-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                How it works
              </p>
              <p className="text-xl font-bold text-[hsl(var(--foreground))]">Three steps</p>
            </div>

            {[
              {
                step: '01',
                icon: Heart,
                title: 'Write',
                desc: 'Share your message. No account or login needed.',
              },
              {
                step: '02',
                icon: MessageSquare,
                title: 'Review',
                desc: 'Moderators check every post for safety.',
              },
              {
                step: '03',
                icon: Send,
                title: 'Publish',
                desc: 'Approved posts go live for the community.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bento-cell group p-6 animate-slide-up"
                  style={{ animationDelay: `${(i + 2) * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 transition group-hover:bg-[hsl(var(--accent))]/20">
                      <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
                    </span>
                    <span className="text-xs font-mono font-semibold text-[hsl(var(--muted-foreground))]">
                      {item.step}
                    </span>
                  </div>
                  <p className="mt-5 font-bold text-[hsl(var(--foreground))]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {item.desc}
                  </p>
                </div>
              );
            })}

            {/* Cell â€” Guidelines */}
            <div className="bento-cell col-span-1 p-6 sm:col-span-2 animate-slide-up animation-delay-200">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Community guidelines
              </p>
              <ul className="space-y-2.5">
                {[
                  'No hate, threats, or harassment.',
                  'Keep personal details private.',
                  'Be honest, concise, and respectful.',
                ].map((rule) => (
                  <li key={rule} className="flex items-center gap-2.5 text-sm text-[hsl(var(--foreground))]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cell â€” CTA */}
            <div className="bento-cell col-span-1 flex flex-col items-start justify-between gap-6 p-6 animate-slide-up animation-delay-300">
              <div>
                <p className="text-lg font-bold text-[hsl(var(--foreground))]">Ready to share?</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Anonymous. Reviewed. Under a minute.
                </p>
              </div>
              <Link
                href="/submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[hsl(var(--foreground))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--background))] transition hover:opacity-80"
              >
                Start writing
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
          {/* End bento grid */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
