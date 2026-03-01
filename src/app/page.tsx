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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import gsap from "gsap";

import { useScrollReveal } from "@/lib/gsapClient";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* ----------------------------- MEMOIZED DATA ---------------------------- */

  const featureHighlights = useMemo(
    () => [
      {
        icon: Lock,
        title: "100% Anonymous",
        desc: "Zero sign-up. No identity needed. Pure anonymity.",
        icon2: Sparkles,
      },
      {
        icon: ShieldCheck,
        title: "Human Reviewed",
        desc: "Every confession verified by real moderators before publishing.",
        icon2: CheckCircle2,
      },
      {
        icon: Zap,
        title: "Instant Submit",
        desc: "Submit in under 60 seconds. No friction. Just write and send.",
        icon2: Send,
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
        desc: "Type your confession anonymously",
      },
      {
        step: "02",
        icon: MessageSquare,
        title: "Submit",
        desc: "Send it to our moderation queue",
      },
      {
        step: "03",
        icon: Send,
        title: "Publish",
        desc: "Go live for the community",
      },
    ],
    []
  );

  /* ------------------------------ HERO ANIMATION ------------------------------ */

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [".hero-label", ".hero-title", ".hero-subtitle", ".hero-feature"],
          { clearProps: "all" }
        );
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      // Label slides up
      tl.from(".hero-label", { opacity: 0, y: 10, duration: 0.4, delay: 0.05 })
        // Title slides up with character reveal
        .from(
          ".hero-title",
          {
            opacity: 0,
            y: 20,
            duration: 0.5,
          },
          "-=0.15"
        )
        // Subtitle fades in
        .from(
          ".hero-subtitle",
          {
            opacity: 0,
            y: 15,
            duration: 0.4,
          },
          "-=0.2"
        )
        // CTA buttons slide up
        .from(
          ".hero-cta",
          {
            opacity: 0,
            y: 15,
            stagger: 0.1,
            duration: 0.4,
          },
          "-=0.15"
        )
        // Feature cards slide up staggered
        .from(
          ".hero-feature",
          {
            opacity: 0,
            y: 25,
            stagger: 0.08,
            duration: 0.5,
          },
          "-=0.3"
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
      {/* ───── Minimal background accent ───── */}
      <div 
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" 
        aria-hidden
      >
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[hsl(var(--accent))]/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[hsl(var(--accent))]/3 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================= HERO SECTION ============================= */}
        <section
          ref={heroRef}
          className="flex min-h-screen flex-col items-center justify-center gap-8 py-16 sm:gap-12 sm:py-20 md:py-24 lg:min-h-[calc(100vh-var(--header-height))]"
        >
          {/* ── Label ── */}
          <div className="hero-label flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 px-3 py-1 sm:px-4 sm:py-1.5">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--accent))]" />
              <span className="relative inline-flex h-full w-full rounded-full bg-[hsl(var(--accent))]" />
            </span>
            <span className="text-xs font-semibold text-[hsl(var(--accent))] sm:text-sm">
              Confessions are open
            </span>
          </div>

          {/* ── Main Headline ── */}
          <div className="flex max-w-4xl flex-col items-center gap-3 text-center sm:gap-4">
            <h1 className="hero-title text-3xl font-black leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block">Share your truth</span>
              <span className="block bg-linear-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent))]/60 bg-clip-text text-transparent">
                Stay completely anonymous
              </span>
            </h1>

            <p className="hero-subtitle max-w-2xl text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg md:text-xl">
              Express yourself without fear. Share confessions anonymously with our community. Every submission is reviewed by real humans to keep our space safe and welcoming.
            </p>
          </div>

          {/* ── CTA Buttons ── */}
          <div className="hero-cta flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/submit"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-8 sm:py-3.5 sm:text-base md:px-10 md:py-4"
            >
              <PenLine className="h-4 w-4 sm:h-5 sm:w-5" />
              Start writing
            </Link>
            <a
              href="#how-it-works"
              className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-200 hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-8 sm:py-3.5 sm:text-base md:px-10 md:py-4"
            >
              Learn more
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </a>
          </div>

          {/* ── Feature Grid ── */}
          <div className="mt-8 w-full max-w-5xl grid gap-3 sm:grid-cols-3 sm:gap-4 md:gap-6">
            {featureHighlights.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="hero-feature group relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--card))]/80 sm:p-5 md:p-6"
              >
                {/* Border glow on hover (CSS animation) */}
                <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{
                  background: "linear-gradient(135deg, hsl(var(--accent))/30 0%, transparent 100%)",
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--accent))]/10 transition-colors duration-200 group-hover:bg-[hsl(var(--accent))]/20">
                      <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                    </div>
                    <h3 className="text-sm font-bold text-[hsl(var(--foreground))] sm:text-base">
                      {title}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-sm">
                    {desc}
                  </p>
                </div>

                {/* Dynamic border glow */}
                <div className="pointer-events-none absolute inset-0 rounded-lg border border-[hsl(var(--accent))]/0 opacity-0 transition-all duration-300 group-hover:border-[hsl(var(--accent))]/50 group-hover:opacity-100" />
              </div>
            ))}
          </div>

          {/* ── Trust indicators ── */}
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] sm:text-sm">
              Trusted by students everywhere
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {["No Account Needed", "Moderated 24/7", "100% Private"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] sm:text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent))]" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <div ref={contentRef} className="py-16 sm:py-24">
          {/* ── Section Header ── */}
          <section data-scroll id="how-it-works" className="mb-12 sm:mb-16">
            <div data-scroll-child className="max-w-3xl">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[hsl(var(--accent))] sm:text-sm">
                How it works
              </span>
              <h2 className="mt-2 text-3xl font-black text-[hsl(var(--foreground))] sm:text-4xl md:text-5xl">
                Three simple steps to share
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-4 sm:text-lg">
                No registration. No verification. Just pure, anonymous expression.
              </p>
            </div>
          </section>

          {/* ── Steps Grid ── */}
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8">
            {howItWorksSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  data-scroll-child
                  className="group relative overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--card))]/80 sm:p-8"
                >
                  {/* Number badge */}
                  <div className="absolute -right-2 -top-2 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--accent))]/10 text-2xl font-black text-[hsl(var(--accent))]/30 transition-all duration-300 group-hover:bg-[hsl(var(--accent))]/20 group-hover:text-[hsl(var(--accent))]/50 sm:h-20 sm:w-20 sm:text-3xl">
                    {item.step}
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10 transition-colors duration-200 group-hover:bg-[hsl(var(--accent))]/20">
                      <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                    </div>
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))] sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {item.desc}
                    </p>
                  </div>

                  {/* Border glow */}
                  <div className="pointer-events-none absolute inset-0 rounded-lg border border-[hsl(var(--accent))]/0 opacity-0 transition-all duration-300 group-hover:border-[hsl(var(--accent))]/50 group-hover:opacity-100" />
                </div>
              );
            })}
          </div>

          {/* ── CTA Section ── */}
          <section
            data-scroll
            className="relative mt-16 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-linear-to-br from-[hsl(var(--card))] to-[hsl(var(--card))]/50 p-8 backdrop-blur-sm sm:mt-24 sm:p-12 md:p-16"
          >
            {/* Accent background */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,<svg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'><g fill=\'none\' fill-rule=\'evenodd\'><g fill=\'%23000000\'><path d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/></g></g></svg>')" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <h3 className="text-2xl font-black text-[hsl(var(--foreground))] sm:text-3xl md:text-4xl">
                Ready to share?
              </h3>
              <p className="max-w-md text-base text-[hsl(var(--muted-foreground))] sm:text-lg">
                Join thousands expressing themselves anonymously. No judgment. No exposure. Pure connection.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-10 sm:py-4 sm:text-base"
              >
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5" />
                Write your confession
              </Link>
            </div>

            {/* Border glow on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-lg border border-[hsl(var(--accent))]/0 transition-all duration-300 hover:border-[hsl(var(--accent))]/30" />
          </section>
        </div>
      </div>
    </main>
  );
}