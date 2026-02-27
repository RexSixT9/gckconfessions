"use client";

import { useRef, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MessageSquare,
  Send,
  PenLine,
  Lock,
  Zap,
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";

import { useScrollReveal } from "@/lib/gsapClient";
import TiltCard from "@/components/TiltCard";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* ----------------------------- MEMOIZED DATA ---------------------------- */

  const featureHighlights = useMemo(
    () => [
      {
        icon: Lock,
        title: "No account needed",
        desc: "Zero sign-up — write and send without ever sharing your identity.",
        tag: "100% anonymous",
      },
      {
        icon: ShieldCheck,
        title: "Human-reviewed",
        desc: "Every confession is read by a real moderator before it goes live.",
        tag: "Safe space",
      },
      {
        icon: Zap,
        title: "Instant to submit",
        desc: "Takes under a minute. Just write what's on your mind and hit send.",
        tag: "No friction",
      },
    ],
    []
  );

  const howItWorksSteps = useMemo(
    () => [
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
    ],
    []
  );

  /* ------------------------------ HERO ANIMATION ------------------------------ */

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".hero-tag", { opacity: 0, y: 20, duration: 0.45 })
        .from(
          ".hero-char",
          { opacity: 0, y: 10, stagger: 0.018, duration: 0.22, filter: "blur(5px)" },
          "-=0.25"
        )
        .from(
          ".hero-body",
          { opacity: 0, y: 20, stagger: 0.09, duration: 0.45 },
          "-=0.2"
        )
        .from(
          ".hero-card",
          { opacity: 0, y: 28, x: 12, stagger: 0.1, duration: 0.5 },
          "-=0.35"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  /* ------------------------ SCROLL REVEAL BELOW FOLD ------------------------ */

  useScrollReveal(contentRef, {
    from: { opacity: 0, y: 40 },
    duration: 0.6,
    stagger: 0.08,
  });

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ============================= HERO ============================= */}
        <section
          ref={heroRef}
          className="flex min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))] flex-col items-center justify-center py-16 lg:flex-row lg:items-center lg:gap-16"
        >
          {/* ── Left column: headline + copy + CTAs ── */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:flex-1">
            {/* Tag pill */}
            <span className="hero-tag mb-5 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/25 bg-[hsl(var(--accent))]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[hsl(var(--accent))]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--accent))]" />
              Anonymous &bull; Moderated &bull; Free
            </span>

            {/* Heading */}
            <h1 className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {"Say what you've been holding back."
                .split(" ")
                .map((word, i, arr) => {
                  const highlight = word === "holding" || word === "back.";
                  const isLast = i === arr.length - 1;
                  return (
                    <span
                      key={i}
                      className={`inline-block ${isLast ? "" : "mr-[0.25em]"}${highlight ? " text-[hsl(var(--accent))]" : ""
                        }`}
                    >
                      {word.split("").map((c, j) => (
                        <span key={j} className="hero-char inline-block">{c}</span>
                      ))}
                    </span>
                  );
                })}
            </h1>

            {/* Subtext */}
            <p className="hero-body mt-5 max-w-sm text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
              Share anonymously. Every confession is reviewed before it appears &mdash; no account, no trace.
            </p>

            {/* CTAs */}
            <div className="hero-body mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
              >
                <PenLine className="h-4 w-4" />
                Write a confession
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/50 hover:text-[hsl(var(--accent))]"
              >
                How it works
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Trust micro-row */}
            <div className="hero-body mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {["No sign-up", "Human review", "Free forever"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="h-1 w-1 rounded-full bg-[hsl(var(--accent))]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column: Feature cards ── */}
          <div className="mt-12 flex w-full flex-col gap-3 sm:max-w-md lg:mt-0 lg:w-auto lg:min-w-[22rem] lg:flex-1 lg:max-w-[26rem]">
            {featureHighlights.map(({ icon: Icon, title, desc, tag }, idx) => (
              <TiltCard
                key={title}
                className={`hero-card group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm transition-all duration-300 hover:border-[hsl(var(--accent))]/40 hover:shadow-lg ${idx === 1 ? "sm:translate-x-4 lg:translate-x-6" : ""
                  }`}
              >
                {/* Subtle glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[hsl(var(--accent))]/0 transition-all duration-300 group-hover:bg-[hsl(var(--accent))]/[0.03]" />

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 ring-1 ring-[hsl(var(--accent))]/15 transition-colors duration-300 group-hover:bg-[hsl(var(--accent))]/15">
                      <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">
                        {title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--accent))]">
                        {tag}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="mt-4 h-px w-full overflow-hidden rounded-full bg-[hsl(var(--border))]">
                  <div className="h-full w-0 rounded-full bg-[hsl(var(--accent))]/60 transition-all duration-500 group-hover:w-full" />
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ======================== BELOW FOLD ======================== */}
        <div ref={contentRef}>

          {/* Showcase */}
          <section data-scroll className="mb-14">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              From the community
            </p>

            <div className="space-y-3">
              {[
                "I still think about that conversation every single day.",
                "I never told anyone, but it genuinely changed everything for me.",
                "This has been on my mind for months and I needed to say it.",
              ].map((text, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 text-sm leading-relaxed text-[hsl(var(--foreground))] shadow-sm transition hover:border-[hsl(var(--accent))]/40"
                >
                  <span className="mr-0.5 select-none text-[hsl(var(--accent))]">&ldquo;</span>
                  {text}
                  <span className="ml-0.5 select-none text-[hsl(var(--accent))]">&rdquo;</span>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section data-scroll id="how-it-works" className="mb-14">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">Three simple steps</h2>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {howItWorksSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <TiltCard
                    key={item.step}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10 text-xs font-bold text-[hsl(var(--accent))]">
                        {item.step}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--secondary))]">
                        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    </div>

                    <h3 className="font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {item.desc}
                    </p>
                  </TiltCard>
                );
              })}
            </div>
          </section>

          {/* Bottom CTA */}
          <section data-scroll className="relative mb-20 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-12 text-center shadow-sm sm:px-14 sm:py-16">
            {/* Subtle radial glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              <div className="h-56 w-56 rounded-full bg-[hsl(var(--accent))] opacity-[0.06] blur-3xl" />
            </div>

            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-3 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
              Anonymous &amp; Safe
            </span>

            <h3 className="mt-3 text-2xl font-black tracking-tight">
              Ready to confess?
            </h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Anonymous. Queued. Reviewed by humans.
            </p>

            <Link
              href="/submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
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