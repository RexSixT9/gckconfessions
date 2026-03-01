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
  CheckCircle2,
  Heart,
} from "lucide-react";
import gsap from "gsap";
import { motion } from "framer-motion";

import { useScrollReveal } from "@/lib/gsapClient";
import Tooltip from "@/components/Tooltip";
import TypewriterText from "@/components/TypewriterText";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* ----------------------------- MEMOIZED DATA ---------------------------- */

  const featureHighlights = useMemo(
    () => [
      {
        icon: Lock,
        title: "100% Anonymous",
        desc: "Zero sign-up. No identity needed. Your confession is completely anonymous and untraceable.",
      },
      {
        icon: ShieldCheck,
        title: "Human Reviewed",
        desc: "Real moderators check every submission before it appears.",
      },
      {
        icon: Zap,
        title: "Lightning Fast",
        desc: "Submit in under 60 seconds. No friction. Just write and send.",
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
        gsap.set(".hero-element", { clearProps: "all" });
        return;
      }

      // Simple fade-in for hero elements
      gsap.from(".hero-element", {
        opacity: 0,
        y: 15,
        stagger: 0.08,
        duration: 0.5,
        ease: "power2.out",
      });
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
      {/* Minimal gradient background - shadcn inspired */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        {/* Top gradient */}
        <div className="absolute -top-96 left-1/2 h-125 w-250 -translate-x-1/2 rounded-full bg-linear-to-br from-[hsl(var(--accent))]/8 to-transparent blur-3xl" />
        {/* Bottom-right gradient */}
        <div className="absolute -bottom-96 right-0 h-125 w-200 rounded-full bg-linear-to-tl from-[hsl(var(--accent))]/5 to-transparent blur-3xl" />
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='currentColor' stroke-width='1'%3E%3Cpath d='M0 0h60M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================= HERO SECTION ============================= */}
        <section ref={heroRef} className="flex min-h-screen flex-col justify-center gap-16 py-20 sm:gap-20 sm:py-24 md:py-32">
          {/* Main Headline with Framer Motion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 text-center"
          >
            {/* Floating label */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/5 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[hsl(var(--accent))]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
              </span>
              <span className="text-xs font-semibold text-[hsl(var(--accent))]">
                Join thousands today
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex max-w-4xl flex-col gap-4"
            >
              <h1 className="text-4xl font-black leading-tight tracking-tight text-[hsl(var(--foreground))] sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">Share your truth.</span>
                <span className="block bg-linear-to-r from-[hsl(var(--accent))] via-[hsl(var(--accent))]/80 to-[hsl(var(--accent))]/60 bg-clip-text text-transparent">
                  <TypewriterText
                    phrases={[
                      "Stay anonymous.",
                      "Share freely.",
                      "Be heard.",
                      "No judgment.",
                      "Just confess.",
                    ]}
                    typingSpeed={55}
                    deletingSpeed={28}
                    pauseAfterType={2200}
                    pauseAfterDelete={400}
                    startDelay={900}
                  />
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg md:text-xl">
                Express yourself freely. Share confessions anonymously within a safe, moderated community. No sign-ups. No judgment. Pure authenticity.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col gap-3 sm:flex-row sm:gap-4"
            >
              <Link
                href="/submit"
                className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(var(--accent))]/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-10 sm:py-4 sm:text-base overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                />
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="relative">Start writing</span>
              </Link>

              <Tooltip content="See how it works" side="bottom">
                <a
                  href="#how-it-works"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] px-8 py-3.5 text-sm font-semibold text-[hsl(var(--foreground))] transition-all duration-300 hover:border-[hsl(var(--accent))]/50 hover:bg-[hsl(var(--accent))]/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-10 sm:py-4 sm:text-base"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 sm:h-5 sm:w-5" />
                </a>
              </Tooltip>
            </motion.div>
          </motion.div>

          {/* ─── BENTO GRID ─── 6-col layout, fills every cell perfectly ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-6 grid-rows-2 gap-4"
          >
            {/* Card 1 — Large hero card: columns 1-3, rows 1-2 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="col-span-6 row-span-1 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-linear-to-br from-[hsl(var(--card))]/90 to-[hsl(var(--card))]/50 p-6 backdrop-blur-md transition-all duration-300 hover:border-[hsl(var(--accent))]/30 hover:shadow-xl sm:col-span-3 sm:row-span-2 sm:p-7"
            >
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 ring-1 ring-[hsl(var(--accent))]/10">
                  <Lock className="h-6 w-6 text-[hsl(var(--accent))]" />
                </div>
                <Tooltip content="No account, email, or phone needed" side="right">
                  <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-2xl font-bold text-[hsl(var(--foreground))] sm:text-3xl">
                    100% Anonymous
                  </h3>
                </Tooltip>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
                  Zero sign-up. No identity needed. Your confession is untraceable from the moment you hit send.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  No account required
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--accent))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--accent))]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Untraceable
                </span>
              </div>
            </motion.div>

            {/* Card 2 — Human Reviewed: columns 4-6, row 1 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="col-span-6 overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-linear-to-br from-[hsl(var(--card))]/90 to-[hsl(var(--card))]/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-[hsl(var(--accent))]/30 hover:shadow-lg sm:col-span-3 sm:row-span-1"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5">
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))]" />
              </div>
              <Tooltip content="Every post is read before going live">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-bold text-[hsl(var(--foreground))] sm:text-lg">
                  Human Reviewed
                </h3>
              </Tooltip>
              <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-sm">
                Real moderators read every confession. No bots. No automation.
              </p>
            </motion.div>

            {/* Card 3 — Lightning Fast: columns 4-5, row 2 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="col-span-6 overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-linear-to-br from-[hsl(var(--card))]/90 to-[hsl(var(--card))]/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-[hsl(var(--accent))]/30 hover:shadow-lg sm:col-span-2 sm:row-span-1"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5">
                <Zap className="h-5 w-5 text-[hsl(var(--accent))]" />
              </div>
              <Tooltip content="Submit in under 60 seconds">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-bold text-[hsl(var(--foreground))]">
                  Instant Submit
                </h3>
              </Tooltip>
              <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                Write and send in under a minute
              </p>
            </motion.div>

            {/* Card 4 — Safe Space: column 6, row 2 */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="col-span-6 overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-linear-to-br from-[hsl(var(--card))]/90 to-[hsl(var(--card))]/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-[hsl(var(--accent))]/30 hover:shadow-lg sm:col-span-1 sm:row-span-1"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5">
                <Heart className="h-5 w-5 text-[hsl(var(--accent))]" />
              </div>
              <Tooltip content="Moderated around the clock">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-bold text-[hsl(var(--foreground))]">
                  Safe Space
                </h3>
              </Tooltip>
              <p className="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
                Moderated 24/7
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <div ref={contentRef} className="py-20 sm:py-28 md:py-32">
          {/* Section Header */}
          <motion.section
            data-scroll
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            id="how-it-works"
            className="mb-12 sm:mb-16 md:mb-20"
          >
            <div className="max-w-3xl">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[hsl(var(--accent))] sm:text-sm">
                How it works
              </span>
              <h2 className="mt-3 text-3xl font-black text-[hsl(var(--foreground))] sm:text-4xl md:text-5xl">
                Three simple steps
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
                No registration. No verification. Just pure, anonymous expression.
              </p>
            </div>
          </motion.section>

          {/* Steps Grid */}
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5 md:gap-6">
            {howItWorksSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  data-scroll-child
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6 }}
                  className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-linear-to-br from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 p-6 backdrop-blur-md transition-all duration-300 hover:border-[hsl(var(--accent))]/30 hover:shadow-lg sm:p-7 md:p-8"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Number badge */}
                  <motion.div
                    className="absolute -right-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[hsl(var(--accent))]/10 to-transparent text-3xl font-black text-[hsl(var(--accent))]/15 transition-all duration-300 group-hover:text-[hsl(var(--accent))]/30"
                    whileHover={{ scale: 1.1 }}
                  >
                    {item.step}
                  </motion.div>

                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 12 }}
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 transition-colors duration-300 group-hover:from-[hsl(var(--accent))]/30 group-hover:to-[hsl(var(--accent))]/10"
                    >
                      <Icon className="h-6 w-6 text-[hsl(var(--accent))]" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))] sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA Section */}
          <motion.section
            data-scroll
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative mt-16 overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-linear-to-br from-[hsl(var(--card))]/80 via-[hsl(var(--card))]/60 to-[hsl(var(--card))]/40 p-10 backdrop-blur-md sm:mt-24 sm:p-14 md:p-16"
          >
            <div className="absolute inset-0 bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl font-black text-[hsl(var(--foreground))] sm:text-4xl md:text-5xl">
                  Ready to share?
                </h3>
              </motion.div>

              <p className="max-w-2xl text-base text-[hsl(var(--muted-foreground))] sm:text-lg">
                Join thousands expressing themselves anonymously. No judgment. Pure connection. Your confession matters.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link
                  href="/submit"
                  className="group relative inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--accent))] px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(var(--accent))]/30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] sm:px-10 sm:py-4.5 sm:text-base overflow-hidden"
                >
                  <motion.span
                    className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  />
                  <PenLine className="h-5 w-5" />
                  <span className="relative">Write your confession</span>
                </Link>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
