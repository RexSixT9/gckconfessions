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
      {/* Modern Next.js gradient background with animated orbs */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        {/* Animated gradient orbs */}
        <div 
          className="absolute -top-[40%] left-[10%] h-150 w-150 rounded-full bg-linear-to-br from-[hsl(var(--accent))]/12 via-[hsl(var(--accent))]/8 to-transparent"
          style={{
            animation: 'gradient-shift 20s ease-in-out infinite, gradient-pulse 8s ease-in-out infinite',
            filter: 'blur(80px)',
          }}
        />
        <div 
          className="absolute top-[20%] right-[5%] h-125 w-125 rounded-full bg-linear-to-bl from-[hsl(var(--accent))]/10 via-[hsl(var(--accent))]/6 to-transparent"
          style={{
            animation: 'gradient-shift 25s ease-in-out infinite reverse, gradient-pulse 10s ease-in-out infinite',
            filter: 'blur(90px)',
            animationDelay: '-5s',
          }}
        />
        <div 
          className="absolute -bottom-[30%] left-[50%] h-175 w-175 -translate-x-1/2 rounded-full bg-linear-to-tr from-[hsl(var(--accent))]/8 via-[hsl(var(--accent))]/4 to-transparent"
          style={{
            animation: 'gradient-shift 30s ease-in-out infinite, gradient-pulse 12s ease-in-out infinite',
            filter: 'blur(100px)',
            animationDelay: '-10s',
          }}
        />
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,hsl(var(--background))_100%)]" />
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='currentColor' stroke-width='1'%3E%3Cpath d='M0 0h60M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================= HERO SECTION ============================= */}
        <section className="flex min-h-screen flex-col justify-center gap-16 py-20 sm:gap-20 sm:py-24 md:py-32">
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
              className="flex flex-col gap-3 sm:flex-row sm:gap-4"
            >
              <Link
                href="/submit"
                className="btn-primary btn-lg"
              >
                <PenLine className="h-5 w-5 shrink-0" />
                <span>Start writing</span>
              </Link>

              <Tooltip content="See how it works" side="bottom">
                <a
                  href="#how-it-works"
                  className="btn-secondary btn-lg group"
                >
                  Learn more
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Tooltip>
            </motion.div>
          </motion.div>

          {/* ─── BENTO GRID ─── 6-col layout, fills every cell perfectly ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px", amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.1,
                },
              },
            }}
            className="grid grid-cols-6 grid-rows-2 gap-4 sm:gap-5"
          >
            {/* Card 1 — Large hero card: columns 1-3, rows 1-2 */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-6 row-span-1 flex flex-col justify-between gap-5 p-6 sm:col-span-3 sm:row-span-2 sm:p-8"
              glowType="both"
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

            {/* Card 2 — Human Reviewed: columns 4-6, row 1 */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-6 p-6 sm:col-span-3 sm:row-span-1"
              glowType="both"
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

            {/* Card 3 — Lightning Fast: columns 4-5, row 2 */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-6 p-6 sm:col-span-2 sm:row-span-1"
              glowType="both"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
              >
                <Zap className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
              </motion.div>
              <Tooltip content="Submit in under 60 seconds">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-sm font-black text-[hsl(var(--foreground))] sm:text-base">
                  Instant Submit
                </h3>
              </Tooltip>
              <p className="mt-2.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-3 sm:text-sm">
                Write and send in under a minute
              </p>
            </CursorGlowCard>

            {/* Card 4 — Safe Space: column 6, row 2 */}
            <CursorGlowCard
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="card-glass border-shine col-span-6 p-6 sm:col-span-1 sm:row-span-1"
              glowType="both"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
              >
                <Heart className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
              </motion.div>
              <Tooltip content="Moderated around the clock">
                <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-sm font-black text-[hsl(var(--foreground))] sm:text-base">
                  Safe Space
                </h3>
              </Tooltip>
              <p className="mt-2.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))] sm:mt-3 sm:text-sm">
                Moderated 24/7
              </p>
            </CursorGlowCard>
          </motion.div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <motion.div
          ref={contentRef}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px", amount: 0.2 }}
          variants={containerVariants}
          className="py-20 sm:py-28 md:py-32"
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
                  className="card-glass border-shine group relative p-6 sm:p-7 md:p-8"
                  glowType="both"
                >
                  <div className="absolute inset-0 rounded-[inherit] bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Number badge */}
                  <motion.div
                    className="absolute -right-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[hsl(var(--accent))]/10 to-transparent text-2xl font-black text-[hsl(var(--accent))]/15 transition-all duration-500 group-hover:scale-110 group-hover:text-[hsl(var(--accent))]/30 sm:-right-4 sm:-top-4 sm:h-20 sm:w-20 sm:text-3xl"
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
