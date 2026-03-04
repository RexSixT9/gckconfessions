"use client";

import { useRef, useMemo } from "react";
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
import { motion } from "framer-motion";

import Tooltip from "@/components/Tooltip";
import TypewriterText from "@/components/TypewriterText";
import CursorGlowCard from "@/components/CursorGlowCard";

export default function Home() {
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

  /* ------------------------------ ANIMATION VARIANTS ------------------------------ */

  // Container animation for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  // Item animation for children
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <main className="flex-1 overflow-hidden">
      {/* Modern gradient background with animated beam of light */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        {/* Primary pink/red gradient orb - top left */}
        <div 
          className="hero-gradient absolute -top-[30%] -left-[10%] h-150 w-150 bg-[radial-gradient(circle,hsl(338_78%_52%/0.14)_0%,hsl(350_80%_60%/0.06)_40%,transparent_70%)]"
          style={{
            animation: 'gradient-shift 20s ease-in-out infinite, beam-pulse 8s ease-in-out infinite',
          }}
        />
        {/* Secondary rose orb - right */}
        <div 
          className="hero-gradient absolute top-[15%] -right-[5%] h-125 w-125 bg-[radial-gradient(circle,hsl(350_70%_55%/0.1)_0%,hsl(338_78%_52%/0.05)_45%,transparent_70%)]"
          style={{
            animation: 'gradient-shift 25s ease-in-out infinite reverse, beam-pulse 10s ease-in-out infinite',
            animationDelay: '-5s',
          }}
        />
        {/* Deep accent orb - bottom center */}
        <div 
          className="hero-gradient absolute -bottom-[20%] left-[40%] h-175 w-175 -translate-x-1/2 bg-[radial-gradient(circle,hsl(338_78%_42%/0.08)_0%,hsl(350_60%_50%/0.04)_50%,transparent_70%)]"
          style={{
            animation: 'gradient-shift 30s ease-in-out infinite, beam-pulse 12s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        />
        {/* Animated beam of light sweeping across */}
        <div className="hero-beam" />
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(338_78%_52%/0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,hsl(var(--background))_100%)]" />
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='currentColor' stroke-width='1'%3E%3Cpath d='M0 0h60M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================= HERO SECTION ============================= */}
        <section className="flex min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))] flex-col justify-center gap-14 py-16 sm:gap-16 sm:py-20 md:gap-20 md:py-28">
          {/* Main Headline with Framer Motion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 text-center sm:gap-6"
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
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-[hsl(var(--foreground))] sm:text-5xl md:text-6xl lg:text-7xl">
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
                    typingSpeed={50}
                    deletingSpeed={25}
                    pauseAfterType={2400}
                    pauseAfterDelete={400}
                    startDelay={800}
                  />
                </span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mx-auto max-w-2xl text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg md:text-xl"
              >
                Express yourself freely. Share confessions anonymously within a safe, moderated community. No sign-ups. No judgment. Pure authenticity.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
            >
              <Link
                href="/submit"
                className="btn-primary btn-lg w-full sm:w-auto"
              >
                <PenLine className="h-5 w-5 shrink-0" />
                <span>Start writing</span>
              </Link>

              <Tooltip content="See how it works" side="bottom">
                <a
                  href="#how-it-works"
                  className="btn-secondary btn-lg group w-full sm:w-auto"
                >
                  Learn more
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Tooltip>
            </motion.div>
          </motion.div>

          {/* ─── BENTO GRID ─── Responsive: 1→2→4 columns ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px", amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1,
                },
              },
            }}
            className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:grid-rows-2"
          >
            {/* Card 1 — Large hero card: spans 2 cols on sm+, 2 cols + 2 rows on lg */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-1 flex flex-col justify-between gap-5 p-6 sm:col-span-2 sm:p-8 lg:row-span-2"
            >
              <div>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 ring-1 ring-[hsl(var(--accent))]/10 sm:h-14 sm:w-14"
                >
                  <Lock className="h-6 w-6 text-[hsl(var(--accent))] sm:h-7 sm:w-7" />
                </motion.div>
                <Tooltip content="No account, email, or phone needed" side="right">
                  <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-xl font-black text-[hsl(var(--foreground))] sm:text-2xl md:text-3xl">
                    100% Anonymous
                  </h3>
                </Tooltip>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-4 sm:text-base">
                  Zero sign-up. No identity needed. Your confession is untraceable from the moment you hit send.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-accent">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  No account required
                </span>
                <span className="badge badge-accent">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Untraceable
                </span>
              </div>
            </CursorGlowCard>

            {/* Card 2 — Human Reviewed: 1 col on mobile, 1 col on sm, spans 2 cols on lg */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-1 p-6 lg:col-span-2"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
              >
                <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
              </motion.div>
              <Tooltip content="Every post is read before going live">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-black text-[hsl(var(--foreground))] sm:text-lg">
                  Human Reviewed
                </h3>
              </Tooltip>
              <p className="mt-2.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-3">
                Real moderators read every confession. No bots. No automation.
              </p>
            </CursorGlowCard>

            {/* Card 3 — Lightning Fast */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-1 p-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
              >
                <Zap className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
              </motion.div>
              <Tooltip content="Submit in under 60 seconds">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-black text-[hsl(var(--foreground))] sm:text-lg">
                  Instant Submit
                </h3>
              </Tooltip>
              <p className="mt-2.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-3">
                Write and send in under a minute. No friction, just start typing.
              </p>
            </CursorGlowCard>

            {/* Card 4 — Safe Space */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-1 p-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
              >
                <Heart className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
              </motion.div>
              <Tooltip content="Moderated around the clock">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-black text-[hsl(var(--foreground))] sm:text-lg">
                  Safe Space
                </h3>
              </Tooltip>
              <p className="mt-2.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-3">
                Moderated 24/7 to keep the community safe and supportive.
              </p>
            </CursorGlowCard>
          </motion.div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <motion.div
          ref={contentRef}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px", amount: 0.15 }}
          variants={containerVariants}
          className="py-16 sm:py-24 md:py-28"
        >
          {/* Section Header */}
          <motion.section
            variants={itemVariants}
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
          <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-3 md:gap-6">
            {howItWorksSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <CursorGlowCard
                  key={item.step}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.12, duration: 0.6, ease: "easeOut" }}
                  viewport={{ once: true, margin: "-30px", amount: 0.3 }}
                  whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                  className="card-glass border-shine group relative overflow-hidden p-6 sm:p-7 md:p-8"
                >
                  <div className="absolute inset-0 rounded-[inherit] bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Number badge */}
                  <motion.div
                    className="absolute right-2 top-2 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[hsl(var(--accent))]/10 to-transparent text-xl font-black text-[hsl(var(--accent))]/15 transition-all duration-500 group-hover:scale-110 group-hover:text-[hsl(var(--accent))]/30 sm:right-3 sm:top-3 sm:h-16 sm:w-16 sm:text-2xl"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.12 + 0.3, duration: 0.6, ease: "backOut" }}
                    viewport={{ once: true }}
                  >
                    {item.step}
                  </motion.div>

                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 12 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 transition-all duration-500 group-hover:from-[hsl(var(--accent))]/30 group-hover:to-[hsl(var(--accent))]/10 group-hover:shadow-lg group-hover:shadow-[hsl(var(--accent))]/20 sm:h-14 sm:w-14"
                    >
                      <Icon className="h-6 w-6 text-[hsl(var(--accent))] sm:h-7 sm:w-7" />
                    </motion.div>
                    <h3 className="text-lg font-black text-[hsl(var(--foreground))] sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-3">
                      {item.desc}
                    </p>
                  </div>
                </CursorGlowCard>
              );
            })}
          </motion.div>

          {/* Bottom CTA Section */}
          <motion.section
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px", amount: 0.4 }}
            className="card-glass border-shine group relative mt-16 overflow-hidden p-10 sm:mt-20 sm:p-14 md:mt-24 md:p-20"
          >
            <motion.div
              className="absolute inset-0 bg-linear-to-br from-[hsl(var(--accent))]/8 via-[hsl(var(--accent))]/4 to-transparent opacity-0 transition-opacity duration-700"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-black text-[hsl(var(--foreground))] sm:text-3xl md:text-4xl lg:text-5xl">
                  Ready to share?
                </h3>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
                className="max-w-2xl text-sm text-[hsl(var(--muted-foreground))] sm:text-base md:text-lg"
              >
                Join thousands expressing themselves anonymously. No judgment. Pure connection. Your confession matters.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link
                  href="/submit"
                  className="btn-primary btn-lg"
                >
                  <PenLine className="h-5 w-5 shrink-0" />
                  <span>Write your confession</span>
                </Link>
              </motion.div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}
