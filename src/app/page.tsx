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
        gradient: "from-pink-500/20 to-rose-500/5",
      },
      {
        icon: ShieldCheck,
        title: "Human-reviewed",
        desc: "Every confession is read by a real moderator before it goes live.",
        tag: "Safe space",
        gradient: "from-violet-500/20 to-purple-500/5",
      },
      {
        icon: Zap,
        title: "Instant to submit",
        desc: "Takes under a minute. Just write what's on your mind and hit send.",
        tag: "No friction",
        gradient: "from-amber-500/20 to-orange-500/5",
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

    const isTouchDev = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [".hero-tag", ".hero-char", ".hero-body", ".hero-card"],
          { clearProps: "all" }
        );
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // Tag pill fades in first
      tl.from(".hero-tag", { opacity: 0, y: 14, duration: 0.5, delay: 0.1 })
        // Character-by-character reveal with stagger
        .from(
          ".hero-char",
          isTouchDev
            ? { opacity: 0, y: 10, stagger: 0.015, duration: 0.25 }
            : {
              opacity: 0,
              y: 12,
              stagger: 0.018,
              duration: 0.25,
              filter: "blur(4px)",
            },
          "-=0.15"
        )
        // Body elements cascade in
        .from(
          ".hero-body",
          {
            opacity: 0,
            y: 20,
            stagger: 0.09,
            duration: 0.5,
          },
          "-=0.1"
        )
        // Feature cards slide in with a modern stagger
        .from(
          ".hero-card",
          {
            opacity: 0,
            y: 28,
            scale: 0.96,
            stagger: 0.12,
            duration: 0.6,
            ease: "back.out(1.5)",
            clearProps: "all",
          },
          "-=0.25"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  /* ------------------------ SCROLL REVEAL BELOW FOLD ------------------------ */

  useScrollReveal(contentRef, {
    from: { opacity: 0, y: 40 },
    duration: 0.7,
    stagger: 0.12,
    start: "top 85%",
  });

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <main className="flex-1 overflow-hidden">
      {/* ───── Ambient background glow (trendy glassmorphism feel) ───── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-125 w-175 -translate-x-1/2 rounded-full bg-[hsl(var(--accent))] opacity-[0.04] blur-[120px] sm:h-150 sm:w-225" />
        <div className="absolute bottom-0 right-0 h-87.5 w-112.5 rounded-full bg-[hsl(var(--accent))] opacity-[0.025] blur-[100px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ============================= HERO ============================= */}
        <section
          ref={heroRef}
          className={[
            "min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))]",
            "lg:h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))]",
            "py-14 sm:py-16 lg:py-0",
            "flex flex-col items-center justify-center",
            "gap-10 sm:gap-12",
            "lg:flex-row lg:items-center lg:justify-between lg:gap-14",
            "xl:gap-20",
          ].join(" ")}
        >
          {/* ── Left: Headline + copy + CTAs ─────────────────────────────── */}
          <div className="flex w-full flex-col items-center text-center lg:w-auto lg:max-w-[48%] lg:flex-1 lg:items-start lg:text-left xl:max-w-[50%]">
            {/* Tag pill */}
            <span className="hero-tag mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-3.5 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-[hsl(var(--accent))] sm:mb-5 sm:px-4 sm:py-2 sm:text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--accent))] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
              </span>
              Anonymous &bull; Moderated &bull; Free
            </span>

            {/* Heading — tightly responsive scale */}
            <h1 className="max-w-xs text-[1.75rem] font-black leading-[1.1] tracking-tight sm:max-w-sm sm:text-[2rem] md:max-w-md md:text-4xl lg:max-w-none lg:text-[2.85rem] xl:text-[3.5rem] xl:leading-[1.05]">
              {"Say what you've been holding back."
                .split(" ")
                .map((word, i, arr) => {
                  const highlight = word === "holding" || word === "back.";
                  const isLast = i === arr.length - 1;
                  return (
                    <span
                      key={i}
                      className={`inline-block ${isLast ? "" : "mr-[0.22em]"}${highlight
                        ? " text-[hsl(var(--accent))]"
                        : ""
                        }`}
                    >
                      {word.split("").map((c, j) => (
                        <span key={j} className="hero-char inline-block">
                          {c}
                        </span>
                      ))}
                    </span>
                  );
                })}
            </h1>

            {/* Subtext */}
            <p className="hero-body mt-4 max-w-70 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-5 sm:max-w-sm sm:text-base md:max-w-md lg:mt-6 lg:max-w-sm xl:text-lg">
              Share anonymously. Every confession is reviewed before it appears
              &mdash; no account, no trace.
            </p>

            {/* CTAs */}
            <div className="hero-body mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-7 sm:gap-3.5 lg:justify-start lg:mt-8">
              <Link
                href="/submit"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-[hsl(var(--accent))] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-7 sm:py-3 sm:text-[15px]"
              >
                <PenLine className="h-4 w-4" />
                Write a confession
              </Link>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[hsl(var(--accent))]/40 hover:text-[hsl(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-7 sm:py-3 sm:text-[15px]"
              >
                How it works
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* Trust micro-row */}
            <div className="hero-body mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {["No sign-up", "Human review", "Free forever"].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] sm:text-[13px]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]/60" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Feature cards ──────────────────────────────────────── */}
          <div
            className={[
              "flex w-full flex-col gap-3",
              "max-w-sm sm:max-w-md sm:gap-3.5",
              "lg:w-auto lg:flex-1 lg:max-w-[46%]",
              "xl:max-w-[44%]",
            ].join(" ")}
          >
            {featureHighlights.map(
              ({ icon: Icon, title, desc, tag, gradient }) => (
                <TiltCard
                  key={title}
                  className={[
                    "hero-card group relative overflow-hidden rounded-2xl",
                    "border border-[hsl(var(--border))]/80 bg-[hsl(var(--card))]",
                    "p-4 sm:p-5 md:p-6",
                    "transition-colors duration-300",
                    "hover:border-[hsl(var(--accent))]/30",
                  ].join(" ")}
                >
                  {/* Gradient hover background — subtle, no glow */}
                  <div
                    className={`pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br ${gradient} opacity-0 transition-opacity duration-400 group-hover:opacity-100`}
                  />

                  <div className="relative z-10 flex items-start gap-4">
                    {/* Icon container */}
                    <div className="relative mt-0.5 shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 ring-1 ring-[hsl(var(--accent))]/15 sm:h-12 sm:w-12">
                        <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                      </div>
                    </div>

                    {/* Text block */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-[15px]">
                          {title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-[hsl(var(--accent))]/10 px-2.5 py-0.5 text-[10px] font-semibold leading-none text-[hsl(var(--accent))] sm:text-[11px]">
                          {tag}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-[13px]">
                        {desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom accent line — gradient sweep on hover */}
                  <div className="relative z-10 mt-4 h-px w-full overflow-hidden rounded-full bg-[hsl(var(--border))]/60">
                    <div className="absolute inset-y-0 left-0 h-full w-0 rounded-full bg-linear-to-r from-[hsl(var(--accent))]/60 to-transparent transition-all duration-500 ease-out group-hover:w-full" />
                  </div>
                </TiltCard>
              )
            )}
          </div>
        </section>

        {/* ======================== BELOW FOLD ======================== */}
        <div ref={contentRef} className="pb-10 sm:pb-16">
          {/* ── Showcase ── */}
          <section data-scroll className="mb-14 sm:mb-20">
            <div data-scroll-child className="mb-5 flex items-center gap-3 sm:mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] sm:text-xs">
                From the community
              </p>
              <div className="h-px flex-1 bg-linear-to-r from-[hsl(var(--border))] to-transparent" />
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              {[
                "I still think about that conversation every single day.",
                "I never told anyone, but it genuinely changed everything for me.",
                "This has been on my mind for months and I needed to say it.",
              ].map((text, i) => (
                <div
                  key={i}
                  data-scroll-child
                  className="group rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] px-5 py-5 text-sm leading-relaxed text-[hsl(var(--foreground))] transition-all duration-300 hover:border-[hsl(var(--accent))]/40 hover:shadow-md hover:-translate-y-1 sm:px-6 sm:py-6"
                >
                  <span className="mr-1 select-none text-lg text-[hsl(var(--accent))] transition-transform group-hover:scale-110">
                    &ldquo;
                  </span>
                  {text}
                  <span className="ml-0.5 select-none text-lg text-[hsl(var(--accent))] transition-transform group-hover:scale-110">
                    &rdquo;
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── How It Works ── */}
          <section data-scroll id="how-it-works" className="mb-14 sm:mb-20">
            <div data-scroll-child className="mb-8 flex items-center gap-4 sm:mb-10">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                Three simple steps
              </h2>
              <div className="h-px flex-1 bg-linear-to-r from-[hsl(var(--border))] to-transparent" />
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
              {howItWorksSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <TiltCard
                    key={item.step}
                    data-scroll-child
                    className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-[hsl(var(--card))] p-6 text-left transition-all duration-300 hover:border-[hsl(var(--accent))]/40 hover:shadow-lg sm:p-7"
                  >
                    {/* Large watermark step number */}
                    <span className="pointer-events-none absolute -right-3 -top-5 text-[6rem] font-black leading-none text-[hsl(var(--foreground))]/3 sm:text-[7rem]">
                      {item.step}
                    </span>

                    <div className="relative z-10">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 sm:mb-5 sm:h-11 sm:w-11">
                        <Icon className="h-4.5 w-4.5 text-[hsl(var(--accent))] sm:h-5 sm:w-5" />
                      </div>

                      <h3 className="text-base font-bold tracking-tight sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-sm">
                        {item.desc}
                      </p>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </section>

          {/* ── Bottom CTA ── */}
          <section
            data-scroll
            className="relative mb-14 overflow-hidden rounded-3xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/90 px-6 py-10 text-center shadow-lg backdrop-blur-sm sm:mb-24 sm:px-14 sm:py-16 lg:px-20 lg:py-20"
          >
            {/* Ambient glow orbs */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <div className="h-64 w-64 rounded-full bg-[hsl(var(--accent))] opacity-[0.05] blur-[80px] sm:h-80 sm:w-80" />
            </div>
            <div
              className="pointer-events-none absolute -bottom-10 -left-10"
              aria-hidden
            >
              <div className="h-40 w-40 rounded-full bg-[hsl(var(--accent))] opacity-[0.03] blur-[60px]" />
            </div>

            <div className="relative z-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-4 py-1.5 text-[11px] font-semibold text-[hsl(var(--accent))] sm:mb-5 sm:text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--accent))] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
                </span>
                Anonymous &amp; Safe
              </span>

              <h3 className="mt-3 text-2xl font-black tracking-tight sm:mt-4 sm:text-3xl md:text-4xl">
                Ready to confess?
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-[hsl(var(--muted-foreground))] sm:text-base">
                Anonymous. Queued. Reviewed by humans.
              </p>

              <Link
                href="/submit"
                className="mt-7 inline-flex items-center gap-2.5 rounded-xl bg-[hsl(var(--accent))] px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--card))] sm:mt-8 sm:px-8 sm:py-3.5 sm:text-base"
              >
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5" />
                Start writing
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}