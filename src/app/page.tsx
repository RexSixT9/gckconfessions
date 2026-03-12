"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Heart,
  Lock,
  MessageSquare,
  PenLine,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TypewriterText from "@/components/TypewriterText";
import { ScrollReveal } from "@/components/Reveal";
import { useMotionRuntime } from "@/components/MotionProvider";
import { cn } from "@/lib/cn";

/* ─── Animation variants ─────────────────────────────────────────── */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Data ───────────────────────────────────────────────────────── */
const highlights = [
  {
    title: "100% Anonymous",
    description: "No account, no email, no identity tracking.",
    icon: Lock,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400 dark:text-violet-300",
  },
  {
    title: "Human Moderated",
    description: "Every confession is reviewed by a real person.",
    icon: ShieldCheck,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  {
    title: "Fast Submission",
    description: "Share what you feel in under a minute.",
    icon: Zap,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
];

const steps = [
  {
    step: "01",
    title: "Write",
    description: "Type what is on your mind. Keep it real and respectful.",
    icon: PenLine,
  },
  {
    step: "02",
    title: "Submit",
    description: "Send anonymously. We do not require sign-up.",
    icon: MessageSquare,
  },
  {
    step: "03",
    title: "Published",
    description: "Approved confessions are published for the community.",
    icon: Send,
  },
];

const heroTypingPhrases = [
  "Speak the truth.",
  "Share your story.",
  "Be heard.",
  "You are not alone.",
];

const mockConfessions = [
  "I still hum the song you used to sing when you thought no one was listening.",
  "Sometimes I reread our old messages just to feel close to you again.",
  "I got the scholarship but never told anyone — I was afraid of expectations.",
  "I cry in the shower so nobody hears how much I'm struggling.",
];

const principles = [
  {
    title: "Private By Default",
    description: "No signup flow, no public profile, no social exposure.",
    icon: Lock,
  },
  {
    title: "Moderation With Care",
    description: "Posts are reviewed to protect the community from harm.",
    icon: ShieldCheck,
  },
  {
    title: "Built For Clarity",
    description: "Minimal UI, fast interactions, and focus on your words.",
    icon: Sparkles,
  },
];

const quickFacts = [
  { label: "No account needed", value: "Always" },
  { label: "Submission speed", value: "< 60s" },
  { label: "Review model", value: "Human" },
  { label: "Visibility", value: "Anonymous" },
];

/* ─── 3D tilt card wrapper ───────────────────────────────────────── */
function TiltCard3D({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), {
    stiffness: 280,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), {
    stiffness: 280,
    damping: 28,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Floating confession preview card ──────────────────────────── */
function FloatingConfessionCard() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % mockConfessions.length), 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <TiltCard3D className="relative w-full max-w-sm cursor-default select-none">
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-accent/25 bg-background/85 p-6 shadow-[0_24px_70px_-10px_hsl(var(--accent)/0.28)] backdrop-blur-xl"
        style={{ transform: "translateZ(20px)" }}
      >
        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent" />

        {/* Card header */}
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15">
            <Heart className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Anonymous confession
          </span>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success)/0.7)]" />
        </div>

        {/* Confession text with cycling animation */}
        <div className="relative min-h-22">
          <Quote className="absolute -left-0.5 -top-0.5 h-4 w-4 text-accent/20" />
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="pl-5 text-sm leading-relaxed text-foreground/80"
            >
              {mockConfessions[idx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {mockConfessions.map((_, i) => (
              <span
                key={i}
                className={`block h-1 rounded-full transition-all duration-400 ${
                  i === idx ? "w-5 bg-accent" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            GCK
          </span>
        </div>
      </motion.div>

      {/* Glow shadow beneath */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 bottom-0 h-12 rounded-full bg-accent/20 blur-xl"
      />
    </TiltCard3D>
  );
}

/* ─── Floating stat chip ─────────────────────────────────────────── */
function StatChip({
  icon: Icon,
  label,
  delay = 0,
  offsetY = [0, -8, 0],
}: {
  icon: React.ElementType;
  label: string;
  delay?: number;
  offsetY?: number[];
}) {
  return (
    <motion.div
      animate={{ y: offsetY }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className="pointer-events-none select-none"
    >
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-lg">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15">
          <Icon className="h-3 w-3 text-accent" />
        </span>
        <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
      </div>
    </motion.div>
  );
}

/* ─── Magnetic hover wrapper ─────────────────────────────────────── */
function Magnetic({
  children,
  strength = 0.3,
}: {
  children: React.ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { isAppReady, shouldReduceMotion } = useMotionRuntime();
  const canStartMotion = isAppReady || shouldReduceMotion;
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCompactHeight, setIsCompactHeight] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const compactMedia = window.matchMedia("(max-height: 760px)");
    const onCompactChange = (event: MediaQueryListEvent) => setIsCompactHeight(event.matches);
    setIsCompactHeight(compactMedia.matches);
    compactMedia.addEventListener("change", onCompactChange);
    return () => compactMedia.removeEventListener("change", onCompactChange);
  }, []);

  const heroStaggerContainer = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: isDesktop ? 0.12 : 0.1,
          delayChildren: isDesktop ? 0.1 : 0.05,
        },
      },
    }),
    [isDesktop]
  );

  const heroFadeUp = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        y: isDesktop ? 28 : 22,
        filter: isDesktop ? "blur(5px)" : "blur(0px)",
      },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
          duration: isDesktop ? 0.62 : 0.55,
          ease: EASE_OUT,
        },
      },
    }),
    [isDesktop]
  );

  return (
    <main className="flex-1 bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100svh-var(--header-height))] flex-col overflow-hidden sm:min-h-[calc(100dvh-var(--header-height))]">
        {/* Mesh gradient orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Primary large orb — top-right */}
          <div className="absolute -right-24 -top-36 h-130 w-130 rounded-full bg-accent/9 blur-[140px] animate-float" />
          {/* Secondary — bottom-left */}
          <div className="absolute -bottom-24 -left-24 h-110 w-110 rounded-full bg-violet-500/8 blur-[120px] animate-float animation-delay-500" />
          {/* Tertiary — center */}
          <div className="absolute left-1/3 top-1/2 h-85 w-85 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px] animate-float animation-delay-300" />
          {/* Accent blue — far right */}
          <div className="absolute right-1/4 top-[60%] h-65 w-65 rounded-full bg-sky-500/5 blur-[90px] animate-float animation-delay-700" />
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--accent-rgb,220,40,120),0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--accent-rgb,220,40,120),0.04)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_80%_60%_at_50%_40%,black,transparent)]" />
        </div>

        {/* Content — grows to fill remaining space */}
        <div className="flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          {/* ── Left: text ── */}
          <motion.div
            variants={heroStaggerContainer}
            initial="hidden"
            animate={canStartMotion ? "show" : "hidden"}
          >
            {/* Eyebrow */}
            <motion.div variants={heroFadeUp}>
              <Badge className="gap-1.5 bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/10">
                <Sparkles className="h-3 w-3" />
                Anonymous Space
              </Badge>
            </motion.div>

            {/* Headline with typewriter second line */}
            <motion.div variants={heroFadeUp} className="mt-5">
              <h1 className="text-[clamp(2rem,8vw,4.5rem)] font-black leading-[1.08] tracking-tight text-balance">
                <span className="block text-foreground">Drop the mask.</span>
                <span className="block max-w-[22ch] text-accent">
                  <TypewriterText
                    phrases={heroTypingPhrases}
                    typingSpeed={isDesktop ? 50 : 55}
                    deletingSpeed={isDesktop ? 24 : 28}
                    pauseAfterType={isDesktop ? 3000 : 2600}
                    startDelay={isDesktop ? 1050 : 900}
                    forceAnimate
                    cursorClassName="bg-accent"
                    responsiveMaxChars={{ mobile: 14, tablet: 20, desktop: 28 }}
                  />
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={heroFadeUp}
              className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              GCK Confessions is a private wall for honest thoughts. Write what
              you feel, submit anonymously, and let your words reach people who
              truly understand.
            </motion.p>

            {/* Pill tags */}
            <motion.div variants={heroFadeUp} className="mt-5 flex flex-wrap gap-2">
              {[
                { tag: "No login required", color: "text-success" },
                { tag: "Human moderated", color: "text-accent" },
                { tag: "Anonymous by default", color: "text-muted-foreground" },
              ].map(({ tag, color }) => (
                <span
                  key={tag}
                  className={`rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur-sm ${color}`}
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              variants={heroFadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Magnetic strength={0.25}>
                <Button
                  size="lg"
                  variant="brand"
                  className="group h-auto w-full gap-2 rounded-full px-8 py-4 text-sm font-semibold shadow-none sm:w-auto"
                  render={<Link href="/submit" />}
                >
                  <>
                    <PenLine className="h-4 w-4" />
                    Write your confession
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                </Button>
              </Magnetic>
              <Magnetic strength={0.25}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto w-full gap-2 rounded-full border-border/60 px-8 py-4 text-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
                  render={<a href="#how-it-works" />}
                >
                  <>
                    How it works
                    <ArrowRight className="h-4 w-4" />
                  </>
                </Button>
              </Magnetic>
            </motion.div>
          </motion.div>

          {/* ── Right: 3D floating scene (desktop) ── */}
          <motion.div
            initial={{ opacity: 0, x: 42, scale: 0.94, rotateY: -7 }}
            animate={canStartMotion ? { opacity: 1, x: 0, scale: 1, rotateY: 0 } : { opacity: 0, x: 42, scale: 0.94, rotateY: -7 }}
            transition={{ duration: 0.82, delay: 0.52, ease: EASE_OUT }}
            className="relative hidden lg:flex lg:items-center lg:justify-center"
            style={{ perspective: "1200px" }}
          >
            {/* Decorative orbiting ring behind card */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              aria-hidden
              className="absolute h-85 w-85 rounded-full border border-accent/10"
              style={{ borderStyle: "dashed" }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              aria-hidden
              className="absolute h-70 w-70 rounded-full border border-accent/8"
            />

            {/* Stat chip — top left */}
            <div className="absolute -left-14 top-12 z-10">
              <StatChip icon={Lock} label="100% Anonymous" delay={0} offsetY={[0, -8, 0]} />
            </div>

            {/* Stat chip — bottom right */}
            <div className="absolute -right-14 bottom-12 z-10">
              <StatChip icon={ShieldCheck} label="Human Reviewed" delay={1} offsetY={[-6, 2, -6]} />
            </div>

            {/* Stat chip — top right */}
            <div className="absolute -right-8 top-4 z-10">
              <StatChip icon={Zap} label="&lt;60s Review" delay={0.5} offsetY={[0, -6, 0]} />
            </div>

            {/* Main confession card */}
            <FloatingConfessionCard />
          </motion.div>
          </div>
        </div>

        {/* ── Scroll hint ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={canStartMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.6, delay: isDesktop ? 1.25 : 1.1, ease: "easeOut" }}
          className={cn(
            "pointer-events-none absolute inset-x-0 z-10 flex justify-center",
            isCompactHeight
              ? "bottom-[max(0.25rem,env(safe-area-inset-bottom))]"
              : "bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
          )}
          aria-hidden
        >
          <a
            href="#highlights"
            className="pointer-events-auto group flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/65 transition-colors hover:text-muted-foreground/85"
          >
            <motion.div
              animate={{ y: [0, 2, 0], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-1"
            >
              <span>Scroll</span>
              <ChevronDown className="h-3 w-3" />
            </motion.div>
            <motion.div
              animate={{ scaleY: [0.55, 1, 0.55], opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}
              className="h-6 w-px origin-top rounded-full bg-linear-to-b from-muted-foreground/60 to-transparent"
            />
          </a>
        </motion.div>
      </section>

      {/* ── Highlights ──────────────────────────────────────────────── */}
      <section id="highlights" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon, iconBg, iconColor }, index) => (
            <ScrollReveal
              key={title}
              delay={index * 0.06}
              y={16}
              duration={0.4}
            >
              <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition-colors duration-200`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base font-bold">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Principles + Quick Facts ───────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4">
            {principles.map(({ title, description, icon: Icon }, index) => (
              <ScrollReveal key={title} delay={index * 0.05} y={14} duration={0.36}>
                <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/80">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm font-semibold sm:text-base">{title}</CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm">{description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal y={14} duration={0.38}>
            <Card className="h-full border-border/60 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <Badge variant="outline" className="w-fit">Quick facts</Badge>
                <CardTitle className="text-lg font-bold tracking-tight">Simple, clear, and safe.</CardTitle>
                <CardDescription>
                  Everything is designed to keep the experience quiet, fast, and anonymous.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="rounded-xl border border-border/70 bg-background/70 p-3"
                    >
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {fact.label}
                      </p>
                      <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <Badge variant="outline" className="mb-3 gap-1.5 border-accent/30 bg-accent/5 text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow
          </Badge>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Three simple steps
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            From thought to community — it only takes seconds.
          </p>
        </motion.div>

        <div className="relative grid gap-4 sm:grid-cols-3">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-linear-to-r from-transparent via-accent/25 to-transparent sm:block"
          />

          {steps.map(({ step, title, description, icon: Icon }, index) => (
            <ScrollReveal
              key={step}
              delay={index * 0.08}
              y={16}
              duration={0.4}
            >
              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20 transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground group-hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)] group-hover:ring-accent/40">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-3xl font-black tabular-nums text-border transition-colors duration-300 group-hover:text-accent/40">
                      {step}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
                </CardHeader>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-18 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Dark gradient base */}
          <div className="absolute inset-0 bg-linear-to-br from-zinc-950 via-accent/20 to-zinc-950 dark:from-zinc-900 dark:via-accent/15 dark:to-zinc-900" />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.025] [background-image:url('data:image/svg+xml,%3Csvg viewBox%3D%220 0 256 256%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter id%3D%22n%22%3E%3CfeTurbulence type%3D%22fractalNoise%22 baseFrequency%3D%220.9%22 numOctaves%3D%224%22 stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]" />

          {/* Glow blobs */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

          {/* Grid dots */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(220,38,120,0.07)_1px,transparent_1px)] bg-size-[28px_28px]" />

          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent" />

          {/* Content */}
          <div className="relative z-10 px-5 py-14 text-center sm:px-8 sm:py-20">
            {/* Animated badge */}
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_6px_currentColor]" />
              Join the community
            </motion.span>

            {/* Headline */}
            <h3 className="mx-auto mt-4 max-w-2xl text-[clamp(1.85rem,7vw,3.2rem)] font-black leading-[1.08] tracking-tight text-white text-balance">
              Your secret is{" "}
              <span className="relative inline-block text-accent">
                safe here.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2 6 C40 2 100 2 198 4"
                    stroke="currentColor"
                    strokeOpacity="0.5"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h3>

            {/* Subtext */}
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
              Thousands have already shared their untold stories. If you have
              something to say, this is your place.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic strength={0.3}>
                <Button
                  size="lg"
                  className="group relative h-auto w-full gap-2 overflow-hidden rounded-full bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground shadow-2xl shadow-accent/30 transition-all hover:bg-accent/90 hover:shadow-accent/50 sm:w-auto"
                  render={<Link href="/submit" />}
                >
                  <>
                    <Heart className="h-4 w-4" />
                    Submit now
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    />
                  </>
                </Button>
              </Magnetic>
              <Magnetic strength={0.3}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto w-full gap-2 rounded-full border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/35 hover:bg-white/10 sm:w-auto"
                  render={<Link href="/guidelines" />}
                >
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Read guidelines
                  </>
                </Button>
              </Magnetic>
            </div>

            {/* Trust line */}
            <p className="mt-8 text-xs text-zinc-600">
              No account needed&nbsp;·&nbsp;Always anonymous&nbsp;·&nbsp;100% free
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

