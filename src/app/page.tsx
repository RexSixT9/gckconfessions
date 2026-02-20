"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Heart, ShieldCheck, MessageSquare, Zap, Send } from "lucide-react";
import Footer from "@/components/Footer";
import { useStaggerEntrance } from "@/lib/gsap";

export default function Home() {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerEntrance(gridRef, { stagger: 0.06, duration: 0.55, from: { opacity: 0, y: 28 } });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">

          {/*  Bento Grid  */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >

            {/* Cell 1 — Hero (spans 2 cols from sm up, leaves 1 col for Cell 2 at lg) */}
            <div data-animate className="bento-cell relative col-span-1 overflow-hidden p-6 sm:col-span-2 sm:p-8 lg:min-h-[288px] lg:p-10">
              {/* Accent glow blob */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[hsl(var(--accent))]/10 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--accent))]/10 px-2.5 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                    Anonymous  Moderated
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl md:text-4xl lg:text-5xl">
                    Share a<br className="hidden sm:block" /> confession.
                  </h1>
                  <p className="max-w-sm text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
                    Post anonymously. Every message is reviewed before it appears — no account needed.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Write a confession
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent px-4 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/50 hover:text-[hsl(var(--accent))]"
                  >
                    How it works
                  </a>
                </div>
              </div>
            </div>

            {/* Cell 2 — No account */}
            <div data-animate className="bento-cell flex flex-col items-start justify-between p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
                <Heart className="h-5 w-5 text-[hsl(var(--accent))]" />
              </span>
              <div className="mt-8">
                <p className="text-base font-bold text-[hsl(var(--foreground))]">No account</p>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Zero sign-up. Fully anonymous by design.
                </p>
              </div>
            </div>

            {/* Cell 3 — Reviewed */}
            <div data-animate className="bento-cell flex flex-col items-start justify-between p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))]" />
              </span>
              <div className="mt-8">
                <p className="text-base font-bold text-[hsl(var(--foreground))]">Safe &amp; reviewed</p>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Moderators check every post before publishing.
                </p>
              </div>
            </div>

            {/* Cell 4 — Accent filled */}
            <div data-animate className="bento-cell flex flex-col justify-between bg-[hsl(var(--accent))] p-6">
              <Zap className="h-8 w-8 text-white/70" />
              <div>
                <p className="text-3xl font-black text-white">Fast.</p>
                <p className="text-3xl font-black text-white/60">Simple.</p>
                <p className="mt-2 text-xs text-white/50">Under a minute to share.</p>
              </div>
            </div>

            {/* Cell 5 — Sample quotes (col-span-2 at sm+) */}
            <div data-animate className="bento-cell p-5 sm:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Sample confessions
              </p>
              <div className="space-y-2">
                {[
                  "I still think about that conversation every day.",
                  "I never told anyone, but it changed everything.",
                  "This has been on my mind for months.",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))]"
                  >
                    &ldquo;{text}&rdquo;
                  </div>
                ))}
              </div>
            </div>

            {/*  How it works section heading  */}
            <div
              id="how-it-works"
              data-animate
              className="bento-cell bg-[hsl(var(--secondary))] p-6 sm:col-span-2 lg:col-span-1"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                How it works
              </p>
              <p className="text-xl font-bold text-[hsl(var(--foreground))]">Three steps</p>
            </div>

            {/* Step cards */}
            {[
              { step: "01", icon: Heart, title: "Write", desc: "Share your message. No account or login needed." },
              { step: "02", icon: MessageSquare, title: "Review", desc: "Moderators check every post for safety." },
              { step: "03", icon: Send, title: "Publish", desc: "Approved posts go live for the community." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} data-animate className="bento-cell group p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 transition group-hover:bg-[hsl(var(--accent))]/20">
                      <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-[hsl(var(--muted-foreground))]">{item.step}</span>
                  </div>
                  <p className="mt-5 font-bold text-[hsl(var(--foreground))]">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                </div>
              );
            })}

            {/* Guidelines (2-col at sm+) */}
            <div data-animate className="bento-cell p-6 sm:col-span-2">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Community guidelines
              </p>
              <ul className="space-y-2.5">
                {[
                  "No hate, threats, or harassment.",
                  "Keep personal details private.",
                  "Be honest, concise, and respectful.",
                ].map((rule) => (
                  <li key={rule} className="flex items-center gap-2.5 text-sm text-[hsl(var(--foreground))]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div data-animate className="bento-cell flex flex-col items-start justify-between gap-6 p-6">
              <div>
                <p className="text-base font-bold text-[hsl(var(--foreground))]">Ready to share?</p>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
