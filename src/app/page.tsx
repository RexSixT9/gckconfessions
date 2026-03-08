/**
 * PERFORMANCE OPTIMIZATIONS:
 * 
 * 1. Device-aware animations via useDeviceAwareAnimation hooks:
 *    - Mobile: Simple fades, no blur/filter effects, no horizontal shifts
 *    - Low-end: Longer durations for perception, reduced complexity
 *    - Reduced motion: Instant snaps
 * 
 * 2. Framer Motion with LazyMotion (domAnimation preset):
 *    - Reduces JS bundle by 82% (~18kb vs ~100kb)
 *    - Only loads necessary animation features
 * 
 * 3. Mobile-optimized CSS:
 *    - Hero gradient beams disabled on <640px (expensive full-screen animations)
 *    - Beam animations set to `display: none` on mobile
 *    - Filter blur intensity reduced on mid-range devices
 * 
 * 4. No whileHover on touch devices:
 *    - Bento cards use useHoverLift() which returns {} on mobile
 *    - Icons use adaptive variants from useIconVariants()
 * 
 * 5. Stagger container uses reduced delays on mobile
 */


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
  ChevronDown,
} from "lucide-react";
import { m as motion } from "framer-motion";

import Tooltip from "@/components/Tooltip";
import TypewriterText from "@/components/TypewriterText";
import CursorGlowCard from "@/components/CursorGlowCard";
import {
  useBentoCardVariants,
  useHowItWorksCardVariants,
  useIconVariants,
  useBadgePopVariants,
  useStaggerContainerVariants,
  useHoverLift,
  getDuration,
  eases,
  prefersReducedMotion,
} from "@/lib/useDeviceAwareAnimation";

export default function Home() {
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* ----------------------------- MEMOIZED DATA ---------------------------- */

  const howItWorksSteps = useMemo(
    () => [
      {
        step: "01",
        icon: PenLine,
        title: "Write",
        desc: "Put into words what you've been holding back. It's just you and the blank page.",
      },
      {
        step: "02",
        icon: MessageSquare,
        title: "Submit",
        desc: "Hit send. Our team reviews every confession before it goes anywhere.",
      },
      {
        step: "03",
        icon: Send,
        title: "Published",
        desc: "Your words go live — completely anonymous — for thousands to read and relate to.",
      },
    ],
    []
  );

  // DEPRECATED: use useStaggerContainerVariants and useBentoCardVariants instead
  // Keeping for reference - removed from usage below

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
        {/* Animated beams of light sweeping across */}
        <div className="hero-beam" />
        <div className="hero-beam-extra" />
        {/* Fourth orb — mid-page anchor so bento section glows too */}
        <div
          className="hero-gradient absolute top-[60%] left-[25%] h-125 w-125 bg-[radial-gradient(circle,hsl(338_78%_52%/0.07)_0%,hsl(350_70%_55%/0.03)_50%,transparent_70%)]"
          style={{
            animation: 'gradient-shift 28s ease-in-out infinite reverse, beam-pulse 11s ease-in-out infinite',
            animationDelay: '-18s',
          }}
        />
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
        <section className="flex min-h-[calc(100svh-var(--header-height)-var(--announcement-height,0px))] flex-col justify-center gap-10 py-12 xs:gap-12 xs:py-14 sm:gap-16 sm:py-20 md:gap-20 md:py-28">
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
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/5 px-3 py-1 xs:gap-2 xs:px-4 xs:py-1.5 backdrop-blur-sm"
            >
              <span className="relative flex h-1.5 w-1.5 xs:h-2 xs:w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[hsl(var(--accent))]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] xs:h-2 xs:w-2" />
              </span>
              <span className="text-[10px] font-semibold text-[hsl(var(--accent))] xs:text-xs">
                Thousands sharing anonymously
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex max-w-4xl flex-col gap-4"
            >
              <h1 className="text-[1.8rem] font-black leading-[1.1] tracking-tight text-[hsl(var(--foreground))] xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block">Say what you can&apos;t.</span>
                <span className="block bg-linear-to-r from-[hsl(var(--accent))] via-[hsl(var(--accent))]/80 to-[hsl(var(--accent))]/60 bg-clip-text text-transparent">
                  <TypewriterText
                    phrases={[
                      "Stay anonymous.",
                      "Be heard.",
                      "No judgment.",
                      "Speak freely.",
                      "It stays here.",
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
                className="mx-auto max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))] xs:text-base sm:text-lg md:text-xl"
              >
                A place for things you can't say out loud. Fully anonymous, human-moderated, and judgment-free. No account. No trace. Just honesty.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex w-full flex-col items-center gap-3 xs:w-auto xs:flex-row sm:gap-4"
            >
              <Link
                href="/submit"
                className="btn-primary btn-lg w-full xs:w-auto"
              >
                <PenLine className="h-5 w-5 shrink-0" />
                <span>Start writing</span>
              </Link>

              <Tooltip content="See how it works" side="bottom">
                <a
                  href="#how-it-works"
                  className="btn-secondary btn-lg group w-full xs:w-auto"
                >
                  Learn more
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Tooltip>
            </motion.div>

            {/* Mobile scroll hint — fades in after 1.2s, only on touch devices */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="flex items-center justify-center sm:hidden"
              aria-hidden
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-1 text-[hsl(var(--muted-foreground))]/50"
              >
                <span className="text-[10px] font-medium uppercase tracking-widest">Scroll</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ─── BENTO GRID ─── mobile 1-col · tablet 2×2 · desktop 12-col asymmetric ─── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px", amount: 0.08 }}
            variants={useStaggerContainerVariants(0.13)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12 lg:gap-4 lg:grid-rows-[minmax(14rem,1fr)_minmax(14rem,1fr)]"
          >

            {/* ── Card 1 ── Anonymous · tall featured (mob: 1col · sm: 2col · lg: 5col 2rows) */}
            <CursorGlowCard
              variants={useBentoCardVariants(0)}
              whileHover={useHoverLift()}
              className="card-glass border-shine group relative overflow-hidden sm:col-span-2 lg:col-span-5 lg:row-span-2"
            >
              {/* Oversized watermark icon */}
              <div className="pointer-events-none absolute -bottom-10 -right-10 select-none opacity-[0.035] transition-opacity duration-700 group-hover:opacity-[0.07]">
                <Lock className="h-56 w-56 text-[hsl(var(--foreground))]" />
              </div>
              {/* Hover accent wash */}
              <div className="absolute inset-0 rounded-[inherit] bg-linear-to-br from-[hsl(var(--accent))]/8 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-5 sm:p-7 lg:p-8">
                <div>
                  <motion.div
                    {...useIconVariants(0)}
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 ring-1 ring-[hsl(var(--accent))]/15 sm:h-14 sm:w-14"
                  >
                    <Lock className="h-6 w-6 text-[hsl(var(--accent))] sm:h-7 sm:w-7" />
                  </motion.div>

                  <Tooltip content="No account, email, or phone needed" side="right">
                    <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-xl font-black text-[hsl(var(--foreground))] sm:text-2xl lg:text-3xl">
                      100% Anonymous
                    </h3>
                  </Tooltip>

                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
                    No email. No name. No trace. Your words exist on their own — untraceable from the moment you hit send.
                  </p>

                  {/* Trust checklist */}
                  <ul className="mt-5 space-y-2.5">
                    {[
                      "No email or account needed",
                      "No IP address logged",
                      "No tracking cookies",
                    ].map((point) => (
                      <li key={point} className="flex items-center gap-2.5 text-xs font-medium text-[hsl(var(--muted-foreground))] sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--accent))]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  className="flex flex-wrap gap-2"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } } }}
                >
                  {[
                    { text: "No account" },
                    { text: "Untraceable" },
                  ].map(({ text }, idx) => (
                    <motion.span
                      key={text}
                      className="badge badge-accent"
                      variants={useBadgePopVariants(idx)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {text}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </CursorGlowCard>

            {/* ── Card 2 ── Human Reviewed · wide with stat (sm: 1col · lg: 7col row-1) */}
            <CursorGlowCard
              variants={useBentoCardVariants(1)}
              whileHover={useHoverLift()}
              className="card-glass border-shine group relative overflow-hidden sm:col-span-1 lg:col-span-7"
            >
              <div className="absolute inset-0 rounded-[inherit] bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-8">
                {/* Left: icon + text */}
                <div className="flex-1">
                  <motion.div
                    {...useIconVariants(1)}
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
                  >
                    <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
                  </motion.div>
                  <Tooltip content="Every post is read before going live">
                    <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-black text-[hsl(var(--foreground))] sm:text-xl">
                      Human Reviewed
                    </h3>
                  </Tooltip>
                  <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    Every submission is read by a real person before it reaches the community. Nothing automated. Nothing missed.
                  </p>
                </div>

                {/* Right: big stat pill */}
                <div className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/60 px-6 py-4 text-center lg:min-w-[8.5rem]">
                  <motion.span
                    className="text-4xl font-black tabular-nums leading-none text-[hsl(var(--accent))] lg:text-5xl"
                    initial={{ scale: 0.75, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: prefersReducedMotion() ? 0 : 0.3, duration: getDuration(0.55), ease: "backOut" }}
                    viewport={{ once: true }}
                  >
                    100%
                  </motion.span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    posts reviewed
                  </span>
                </div>
              </div>
            </CursorGlowCard>

            {/* ── Card 3 ── Instant Submit · stat card (sm: 1col · lg: 3col row-2) */}
            <CursorGlowCard
              variants={useBentoCardVariants(2)}
              whileHover={useHoverLift()}
              className="card-glass border-shine group relative overflow-hidden sm:col-span-1 lg:col-span-3"
            >
              {/* Subtle radial glow behind stat */}
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_55%,hsl(var(--accent)/0.08),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1 p-5 text-center sm:p-7">
                <motion.div
                    {...useIconVariants(2)}
                  className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5"
                >
                  <Zap className="h-5 w-5 text-[hsl(var(--accent))]" />
                </motion.div>

                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-[hsl(var(--muted-foreground))]/60">&lt;</span>
                  <motion.span
                    className="text-6xl font-black tabular-nums leading-none text-[hsl(var(--foreground))] sm:text-7xl"
                    initial={{ scale: 0.7, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.55, ease: "backOut" }}
                    viewport={{ once: true }}
                  >
                    60
                  </motion.span>
                  <span className="text-3xl font-black text-[hsl(var(--foreground))]">s</span>
                </div>

                <p className="mt-0.5 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                  to write &amp; submit
                </p>
                <motion.span
                  className="badge badge-accent mt-2"
                  variants={useBadgePopVariants(0)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Zap className="h-3 w-3" />
                  Instant
                </motion.span>
              </div>
            </CursorGlowCard>

            {/* ── Card 4 ── Safe Space · mini list (sm: 1col · lg: 4col row-2) */}
            <CursorGlowCard
              variants={useBentoCardVariants(3)}
              whileHover={useHoverLift()}
              className="card-glass border-shine group relative overflow-hidden sm:col-span-1 lg:col-span-4"
            >
              <div className="absolute inset-0 rounded-[inherit] bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col p-5 sm:p-7">
                <motion.div
                  {...useIconVariants(3)}
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 sm:h-12 sm:w-12"
                >
                  <Heart className="h-5 w-5 text-[hsl(var(--accent))] sm:h-6 sm:w-6" />
                </motion.div>

                <Tooltip content="Moderated around the clock">
                  <h3 className="inline-block cursor-help border-b border-dashed border-[hsl(var(--accent))]/30 text-base font-black text-[hsl(var(--foreground))] sm:text-xl">
                    Safe Space
                  </h3>
                </Tooltip>

                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Real humans keep this space kind and safe around the clock — community first, always.
                </p>

                {/* Mini trust list */}
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Human moderators only",
                    "Harmful content never published",
                    "Always 100% anonymous",
                  ].map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-xs font-medium text-[hsl(var(--muted-foreground))] sm:text-sm">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
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
          className="py-12 xs:py-16 sm:py-24 md:py-28"
        >
          {/* Section Header */}
          <motion.section
            variants={itemVariants}
            id="how-it-works"
            className="mb-10 xs:mb-12 sm:mb-16 md:mb-20"
          >
            <div className="max-w-3xl">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--accent))] xs:text-xs sm:text-sm">
                How it works
              </span>
              <h2 className="mt-2 text-2xl font-black text-[hsl(var(--foreground))] xs:text-3xl sm:text-4xl md:text-5xl">
                Done in three steps
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] xs:text-base sm:text-lg">
                No account. No email. No verification. Just say what&apos;s on your mind.
              </p>
            </div>
          </motion.section>

          {/* Steps Grid */}
          <motion.div variants={{ hidden: {}, visible: {} }} className="grid gap-5 sm:grid-cols-3 md:gap-6">
            {howItWorksSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <CursorGlowCard
                  key={item.step}
                  initial={{ opacity: 0, y: 36, scale: 0.92 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: prefersReducedMotion() ? 0 : index * 0.12, duration: getDuration(0.65), ease: eases.smooth }}
                  viewport={{ once: true, margin: "-30px", amount: 0.3 }}
                  whileHover={useHoverLift()}
                  className="card-glass border-shine group relative overflow-hidden p-5 sm:p-7 md:p-8"
                >
                  <div className="absolute inset-0 rounded-[inherit] bg-linear-to-br from-[hsl(var(--accent))]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Number badge */}
                  <motion.div
                    className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-[hsl(var(--accent))]/10 to-transparent text-lg font-black text-[hsl(var(--accent))]/15 transition-all duration-500 group-hover:scale-110 group-hover:text-[hsl(var(--accent))]/30 xs:h-14 xs:w-14 xs:text-xl sm:right-3 sm:top-3 sm:h-16 sm:w-16 sm:text-2xl"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.12 + 0.3, duration: 0.6, ease: "backOut" }}
                    viewport={{ once: true }}
                  >
                    {item.step}
                  </motion.div>

                  <div className="relative z-10">
                    <motion.div
                      {...useIconVariants(index)}
                      className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 transition-all duration-500 group-hover:from-[hsl(var(--accent))]/30 group-hover:to-[hsl(var(--accent))]/10 group-hover:shadow-lg group-hover:shadow-[hsl(var(--accent))]/20 xs:mb-5 xs:h-12 xs:w-12 sm:h-14 sm:w-14"
                    >
                      <Icon className="h-5 w-5 text-[hsl(var(--accent))] xs:h-6 xs:w-6 sm:h-7 sm:w-7" />
                    </motion.div>
                    <h3 className="text-[15px] font-black text-[hsl(var(--foreground))] xs:text-base sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))] xs:text-sm sm:mt-3">
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
            className="card-glass border-shine group relative mt-12 overflow-hidden p-6 xs:p-8 sm:mt-16 sm:p-12 md:mt-20 md:p-16 lg:mt-24 lg:p-20"
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
                <h3 className="text-xl font-black text-[hsl(var(--foreground))] xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                  Your secret is safe here.
                </h3>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
                className="max-w-xl text-[13px] text-[hsl(var(--muted-foreground))] xs:text-sm xs:max-w-2xl sm:text-base md:text-lg"
              >
                Thousands of people have already shared what they couldn't say out loud. Whatever it is — big, small, silly, or serious — it deserves to be heard.
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
