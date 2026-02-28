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

    const isDesktop = window.innerWidth >= 1024;
    const isTouchDev = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([".hero-tag", ".hero-char", ".hero-body", ".hero-card"], { clearProps: "all" });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".hero-tag", { opacity: 0, y: 16, duration: 0.4 })
        .from(
          ".hero-char",
          // Touch screens: no filter:blur — each span gets its own layer on iOS
          // (~40 characters = ~40 compositor layers = severe GPU memory pressure).
          isTouchDev
            ? { opacity: 0, y: 8, stagger: 0.012, duration: 0.18 }
            : { opacity: 0, y: 8, stagger: 0.014, duration: 0.18, filter: "blur(4px)" },
          "-=0.2"
        )
        .from(".hero-body", { opacity: 0, y: 16, stagger: 0.07, duration: 0.4 }, "-=0.15")
        .from(
          ".hero-card",
          {
            opacity: 0,
            y: 22,
            x: isDesktop && !isTouchDev ? 12 : 0,
            stagger: 0.09,
            duration: 0.45,
            clearProps: "all",
          },
          "-=0.28"
        );
      // Each tween above already has clearProps:"all" — no need for tl.revert()
      // which can fire before the last frame renders on slow devices.
    }, heroRef);

    return () => ctx.revert();
  }, []);


  /* ------------------------ SCROLL REVEAL BELOW FOLD ------------------------ */

  useScrollReveal(contentRef, {
    from: { opacity: 0, y: 28 },
    duration: 0.55,
    stagger: 0.08,
  });

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ============================= HERO ============================= */}
        <section
          ref={heroRef}
          className={[
            // Exact viewport height minus header + banner — hero fills precisely one screen on desktop.
            // Using min-h on mobile ensures no text overlapping if the screen height is too small.
            "min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))] lg:h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))]",
            // Add vertical padding for mobile devices where content might stretch the height
            "py-12 lg:py-0",
            // Mobile: column, centered. From lg: row side-by-side.
            "flex flex-col items-center justify-center",
            "gap-8",
            "sm:gap-10",
            "lg:flex-row lg:items-center lg:justify-between lg:gap-12",
            "xl:gap-16",
          ].join(" ")}
        >
          {/* ── Left: Headline + copy + CTAs ─────────────────────────────── */}
          <div className="flex w-full flex-col items-center text-center lg:w-auto lg:max-w-[48%] lg:flex-1 lg:items-start lg:text-left xl:max-w-[50%]">
            {/* Tag pill */}
            <span className="hero-tag mb-3 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/25 bg-[hsl(var(--accent))]/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-[hsl(var(--accent))] sm:mb-4 sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--accent))]" />
              Anonymous &bull; Moderated &bull; Free
            </span>

            {/* Heading — tightly responsive scale */}
            <h1 className="max-w-[280px] text-[1.65rem] font-black leading-[1.15] tracking-tight sm:max-w-sm sm:text-3xl md:max-w-md md:text-4xl lg:max-w-none lg:text-[2.75rem] xl:text-[3.25rem] xl:leading-[1.08]">
              {"Say what you've been holding back."
                .split(" ")
                .map((word, i, arr) => {
                  const highlight = word === "holding" || word === "back.";
                  const isLast = i === arr.length - 1;
                  return (
                    <span
                      key={i}
                      className={`inline-block ${isLast ? "" : "mr-[0.22em]"}${highlight ? " text-[hsl(var(--accent))]" : ""
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
            <p className="hero-body mt-3 max-w-[260px] text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-4 sm:max-w-sm sm:text-sm md:max-w-md md:text-base lg:mt-5 lg:max-w-sm xl:text-lg">
              Share anonymously. Every confession is reviewed before it appears &mdash;
              no account, no trace.
            </p>

            {/* CTAs */}
            <div className="hero-body mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3 lg:justify-start lg:mt-7">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] sm:px-6 sm:py-2.5 sm:text-sm"
              >
                <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Write a confession
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-[13px] font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/50 hover:text-[hsl(var(--accent))] sm:px-6 sm:py-2.5 sm:text-sm"
              >
                How it works
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Trust micro-row */}
            <div className="hero-body mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 lg:justify-start">
              {["No sign-up", "Human review", "Free forever"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] sm:text-xs">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Feature cards ──────────────────────────────────────── */}
          <div className={[
            "flex w-full flex-col gap-2.5",
            // Phone: allow wider cards on large phones but cap nicely
            "max-w-sm sm:max-w-md sm:gap-3",
            "lg:max-w-none lg:w-auto lg:flex-1 lg:max-w-[46%]",
            "xl:max-w-[44%]",
          ].join(" ")}>
            {featureHighlights.map(({ icon: Icon, title, desc, tag }) => (
              <TiltCard
                key={title}
                className={[
                  "hero-card group relative overflow-hidden rounded-2xl",
                  "border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
                  "p-3.5 sm:p-4 md:p-5",
                  "shadow-sm transition-all duration-300",
                  "hover:border-[hsl(var(--accent))]/40 hover:shadow-md",
                ].join(" ")}
              >
                {/* Hover glow layer */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[hsl(var(--accent))]/0 transition-all duration-300 group-hover:bg-[hsl(var(--accent))]/[0.03]" />

                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Icon container */}
                  <div className="relative mt-0.5 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 ring-1 ring-[hsl(var(--accent))]/15 transition-colors duration-300 group-hover:bg-[hsl(var(--accent))]/18 sm:h-11 sm:w-11">
                      <Icon className="h-4.5 w-4.5 text-[hsl(var(--accent))] sm:h-5 sm:w-5" />
                    </div>
                  </div>

                  {/* Text block */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">
                        {title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-[hsl(var(--accent))]/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-[hsl(var(--accent))]">
                        {tag}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-[13px]">
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Animated bottom accent rule */}
                <div className="relative mt-3.5 h-px w-full overflow-hidden rounded-full bg-[hsl(var(--border))]">
                  <div className="absolute inset-y-0 left-0 h-full w-0 rounded-full bg-[hsl(var(--accent))]/50 transition-all duration-500 ease-out group-hover:w-full" />
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* ======================== BELOW FOLD ======================== */}
        <div ref={contentRef} className="pb-8 sm:pb-12">

          {/* Showcase */}
          <section data-scroll className="mb-10 sm:mb-14">
            <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] sm:text-xs">
              From the community
            </p>

            <div className="space-y-2.5 sm:space-y-3">
              {[
                "I still think about that conversation every single day.",
                "I never told anyone, but it genuinely changed everything for me.",
                "This has been on my mind for months and I needed to say it.",
              ].map((text, i) => (
                <div
                  key={i}
                  data-scroll-child
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 text-sm leading-relaxed text-[hsl(var(--foreground))] shadow-sm transition hover:border-[hsl(var(--accent))]/40 sm:px-5 sm:py-4"
                >
                  <span className="mr-0.5 select-none text-[hsl(var(--accent))]">&ldquo;</span>
                  {text}
                  <span className="ml-0.5 select-none text-[hsl(var(--accent))]">&rdquo;</span>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section data-scroll id="how-it-works" className="mb-10 sm:mb-14">
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Three simple steps</h2>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              {howItWorksSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <TiltCard
                    key={item.step}
                    data-scroll-child
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left sm:p-6"
                  >
                    <div className="mb-3.5 flex items-center justify-between sm:mb-4">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10 text-xs font-bold text-[hsl(var(--accent))] sm:h-7 sm:w-7">
                        {item.step}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] sm:h-9 sm:w-9">
                        <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] sm:h-4 sm:w-4" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold tracking-tight sm:text-base">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-sm">
                      {item.desc}
                    </p>
                  </TiltCard>
                );
              })}
            </div>
          </section>

          {/* Bottom CTA */}
          <section
            data-scroll
            className="relative mb-12 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-8 text-center shadow-sm sm:mb-20 sm:px-12 sm:py-14 lg:px-16 lg:py-16"
          >
            {/* Radial glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              <div className="h-52 w-52 rounded-full bg-[hsl(var(--accent))] opacity-[0.055] blur-3xl sm:h-64 sm:w-64" />
            </div>

            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/8 px-3 py-1 text-[11px] font-semibold text-[hsl(var(--accent))] sm:mb-4 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
              Anonymous &amp; Safe
            </span>

            <h3 className="mt-2 text-xl font-black tracking-tight sm:mt-3 sm:text-2xl">
              Ready to confess?
            </h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Anonymous. Queued. Reviewed by humans.
            </p>

            <Link
              href="/submit"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98] sm:mt-6 sm:px-7 sm:py-3"
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