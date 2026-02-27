"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, MessageSquare, Send, PenLine, Lock, Zap } from "lucide-react";
import { useScrollReveal } from "@/lib/gsapClient";
import TiltCard from "@/components/TiltCard";
import gsap from "gsap";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoized feature highlights and steps for performance
  const featureHighlights = [
    { icon: Lock, title: "No account needed", desc: "Zero sign-up. Fully anonymous.", span: "col-span-2 sm:col-span-1" },
    { icon: ShieldCheck, title: "Moderated", desc: "Every post reviewed for safety.", span: "col-span-1" },
    { icon: Zap, title: "Easy to submit", desc: "Write and send — we handle the rest.", span: "col-span-1" },
  ];
  const howItWorksSteps = [
    {
      step: "01",
      icon: PenLine,
      title: "Write",
      desc: "Type your confession — no login, no name, no trace.",
    },
    {
      step: "02",
      icon: MessageSquare,
      title: "Queue",
      desc: "Your confession joins a review queue — moderators check each one.",
    },
    {
      step: "03",
      icon: Send,
      title: "Publish",
      desc: "Approved confessions go live for the whole community.",
    },
  ];

  // Unified GSAP Timeline for Hero (perfectly synchronized)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from(".hero-tag", { opacity: 0, y: 24, duration: 0.5, ease: "power2.out" })
        .from(".hero-char", { opacity: 0, y: 8, stagger: 0.025, duration: 0.2, ease: "power2.out", filter: "blur(4px)" }, "-=0.25")
        .from(".hero-body", { opacity: 0, y: 24, stagger: 0.12, duration: 0.55, ease: "power2.out" }, "-=0.2");
    }, heroRef);
    return () => ctx.revert();
  }, []);

  // Scroll-triggered reveals for below-fold sections
  useScrollReveal(contentRef, { from: { opacity: 0, y: 34 }, duration: 0.55, stagger: 0.08 });

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 md:px-8">

        {/*  Hero  */}
        <section ref={heroRef} className="flex h-[calc(100svh-3.5rem-var(--announcement-height,0px))] flex-col items-center justify-center py-6 text-center">
          <span className="hero-tag mb-6 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-3 py-1 text-xs font-semibold text-[hsl(var(--accent))] sm:text-sm sm:px-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
            Anonymous  Moderated
          </span>

          <h1 className="mx-auto mt-4 max-w-xl text-4xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-5xl md:text-6xl">
            {"Say what you've been holding back.".split(" ").map((word, i) => {
              const isHighlight = word === "holding" || word === "back.";
              return (
                <span key={i} className={`inline-block mr-[0.25em] ${isHighlight ? "text-[hsl(var(--accent))]" : ""}`}>
                  {word.split("").map((c, j) => <span key={j} className="hero-char inline-block will-change-transform">{c}</span>)}
                </span>
              )
            })}
          </h1>

          <p className="hero-body mx-auto mt-5 max-w-md text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
            Share anonymously. Every confession is reviewed before it appears — no account, no trace.
          </p>

          <div className="hero-body mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--accent))]/20 transition-all duration-200 hover:opacity-90 hover:shadow-[hsl(var(--accent))]/30 active:scale-[0.97] sm:px-6 sm:py-3"
            >
              <PenLine className="h-4 w-4" />
              Write a confession
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-transparent px-5 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5 hover:text-[hsl(var(--accent))] active:scale-[0.97] sm:px-6 sm:py-3"
            >
              How it works
            </a>
          </div>

          {/* Feature highlights — bento: full-width first card on mobile, half-half for rest */}
          <div className="hero-body mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3">
            {featureHighlights.map(({ icon: Icon, title, desc, span }) => (
              <TiltCard
                key={title}
                className={`flex flex-col items-center gap-2 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/60 px-4 py-4 text-center backdrop-blur-sm ${span} w-full`}
                aria-label={title}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10">
                  <Icon className="h-5 w-5 text-[hsl(var(--accent))]" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</p>
                <p className="hidden text-xs leading-snug text-[hsl(var(--muted-foreground))] sm:block">{desc}</p>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ── Below-fold content — scroll-triggered ── */}
        <div ref={contentRef}>

          {/*  Confessions showcase  */}
          <section data-scroll className="mb-10">
            <p data-scroll-child className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              From the community
            </p>
            <div className="space-y-2.5">
              {[
                "I still think about that conversation every single day.",
                "I never told anyone, but it genuinely changed everything for me.",
                "This has been on my mind for months and I needed to say it.",
              ].map((text, i) => (
                <div
                  data-scroll-child
                  key={i}
                  className="group relative cursor-default overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 text-sm leading-relaxed text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[hsl(var(--accent))]/25 hover:bg-[hsl(var(--accent))]/4"
                >
                  {/* left accent bar on hover */}
                  <span className="absolute inset-y-0 left-0 w-0.75 rounded-l-xl bg-[hsl(var(--accent))] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  &ldquo;{text}&rdquo;
                </div>
              ))}
            </div>
          </section>

          {/*  How it works — bento grid  */}
          <section id="how-it-works" data-scroll className="mb-10">
            <p data-scroll-child className="mb-1 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              How it works
            </p>
            <h2 data-scroll-child className="mb-5 text-xl font-bold text-[hsl(var(--foreground))]">Three simple steps</h2>

            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 sm:gap-4">
              {howItWorksSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <TiltCard
                    data-scroll-child
                    key={item.step}
                    className="group relative flex cursor-pointer flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all duration-200 hover:border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))]/5 hover:shadow-md hover:shadow-[hsl(var(--accent))]/8 active:scale-[0.98] sm:p-5"
                    aria-label={item.title}
                  >
                    {/* subtle bg glow on hover */}
                    <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[hsl(var(--accent))]/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                    {/* step number */}
                    <span className="absolute right-4 top-4 font-mono text-[11px] font-bold tabular-nums text-[hsl(var(--muted-foreground))]/50 transition-colors duration-200 group-hover:text-[hsl(var(--accent))]/60">
                      {item.step}
                    </span>

                    {/* icon */}
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 transition-all duration-200 group-hover:scale-110 group-hover:bg-[hsl(var(--accent))]/25">
                      <Icon className="h-6 w-6 text-[hsl(var(--accent))]" aria-hidden="true" />
                    </span>

                    {/* text */}
                    <div>
                      <p className="text-sm font-bold text-[hsl(var(--foreground))] transition-colors duration-200 group-hover:text-[hsl(var(--accent))]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </section>

          {/*  Guidelines teaser  */}
          <section data-scroll className="mb-10 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-5 transition-all duration-200 hover:border-[hsl(var(--accent))]/25">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">Community guidelines</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "No hate speech, threats, or harassment.",
                    "Keep personal details private.",
                    "Be honest, concise, and respectful.",
                  ].map((rule) => (
                    <li key={rule} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/guidelines"
                className="group shrink-0 inline-flex items-center gap-0.5 text-xs font-semibold text-[hsl(var(--accent))] transition-all duration-150 hover:underline"
              >
                Full guidelines
                <ArrowUpRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </section>

          {/*  Bottom CTA  */}
          <section data-scroll className="group relative mb-16 cursor-default overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 py-10 text-center transition-all duration-300 hover:border-[hsl(var(--accent))]/30 hover:shadow-lg hover:shadow-[hsl(var(--accent))]/8">
            {/* accent glow blob on hover */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[hsl(var(--accent))]/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 sm:h-40 sm:w-40" />
            {/* bottom-left mirror blob */}
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[hsl(var(--accent))]/6 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:h-32 sm:w-32" />
            <p className="relative text-base font-black text-[hsl(var(--foreground))] xs:text-lg sm:text-2xl">Ready to confess?</p>
            <p className="relative mt-1.5 text-xs text-[hsl(var(--muted-foreground))] xs:text-sm">Anonymous. Queued. Reviewed by humans.</p>
            <Link
              href="/submit"
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[hsl(var(--accent))]/20 transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-[0.98] sm:px-6 sm:py-3"
            >
              <PenLine className="h-4 w-4" />
              Start writing
            </Link>
          </section>

        </div>
      </div>
    </main>
  );
}
