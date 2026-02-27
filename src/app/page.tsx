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
        desc: "Zero sign-up. Fully anonymous.",
      },
      {
        icon: ShieldCheck,
        title: "Moderated",
        desc: "Every post reviewed for safety.",
      },
      {
        icon: Zap,
        title: "Easy to submit",
        desc: "Write and send — we handle the rest.",
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

      tl.from(".hero-tag", {
        opacity: 0,
        y: 24,
        duration: 0.5,
      })
        .from(
          ".hero-char",
          {
            opacity: 0,
            y: 8,
            stagger: 0.02,
            duration: 0.2,
            filter: "blur(4px)",
          },
          "-=0.3"
        )
        .from(
          ".hero-body",
          {
            opacity: 0,
            y: 24,
            stagger: 0.1,
            duration: 0.5,
          },
          "-=0.2"
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
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* ============================= HERO ============================= */}
        <section
          ref={heroRef}
          className="flex min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))] flex-col items-center justify-center py-16 text-center"
        >
          {/* Tag */}
          <span className="hero-tag mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/10 px-4 py-1.5 text-xs font-semibold text-[hsl(var(--accent))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
            Anonymous &bull; Moderated
          </span>

          {/* Heading */}
          <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
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
                      <span key={j} className="hero-char inline-block">
                        {c}
                      </span>
                    ))}
                  </span>
                );
              })}
          </h1>

          {/* Subtext */}
          <p className="hero-body mt-6 max-w-md text-base text-[hsl(var(--muted-foreground))] sm:text-lg">
            Share anonymously. Every confession is reviewed before it appears &mdash;
            no account, no trace.
          </p>

          {/* Buttons */}
          <div className="hero-body mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
            >
              <PenLine className="h-4 w-4" />
              Write a confession
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-6 py-3 text-sm font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent))]/60 hover:text-[hsl(var(--accent))]"
            >
              How it works
            </a>
          </div>

          {/* Feature Cards */}
          <div className="hero-body mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {featureHighlights.map(({ icon: Icon, title, desc }) => (
              <TiltCard
                key={title}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
                  <Icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                </div>
                <h3 className="text-sm font-bold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {desc}
                </p>
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
                        <Icon className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))]" />
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
            {/* Subtle glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              <div className="h-48 w-48 rounded-full bg-[hsl(var(--accent))] opacity-[0.05] blur-3xl" />
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