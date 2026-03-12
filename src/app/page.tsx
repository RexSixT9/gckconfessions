"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TypewriterText from "@/components/TypewriterText";

/* ─── Animation variants ─────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

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

/* ─── Scroll progress bar ────────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-200 h-0.5 origin-left bg-accent"
      style={{ scaleX }}
      aria-hidden
    />
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
  return (
    <main className="flex-1 bg-background">
      <ScrollProgress />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col overflow-hidden"
        style={{ minHeight: "calc(100dvh - var(--header-height) - var(--announcement-height))" }}
      >
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
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-28">
          {/* ── Left: text ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Eyebrow */}
            <motion.div variants={fadeUp}>
              <Badge className="gap-1.5 bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/10">
                <Sparkles className="h-3 w-3" />
                Anonymous Space
              </Badge>
            </motion.div>

            {/* Headline with typewriter second line */}
            <motion.div variants={fadeUp} className="mt-5">
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-[4.5rem]">
                <span className="block text-foreground">Drop the mask.</span>
                <span className="block text-accent">
                  <TypewriterText
                    phrases={heroTypingPhrases}
                    typingSpeed={55}
                    deletingSpeed={28}
                    pauseAfterType={2600}
                    startDelay={900}
                    cursorClassName="bg-accent"
                  />
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              GCK Confessions is a private wall for honest thoughts. Write what
              you feel, submit anonymously, and let your words reach people who
              truly understand.
            </motion.p>

            {/* Pill tags */}
            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2">
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
              variants={fadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Magnetic strength={0.25}>
                <Button
                  size="lg"
                  className="btn-glow group relative h-auto w-full overflow-hidden rounded-full px-8 py-4 text-sm font-semibold shadow-lg shadow-accent/20 transition-shadow hover:shadow-accent/35 hover:shadow-xl sm:w-auto"
                  render={<Link href="/submit" />}
                >
                  <>
                    <PenLine className="h-4 w-4" />
                    Write a confession
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
                    />
                  </>
                </Button>
              </Magnetic>
              <Magnetic strength={0.25}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto w-full rounded-full border-border/60 px-8 py-4 text-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
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
            initial={{ opacity: 0, x: 36, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
          className="flex justify-center pb-7 pt-2"
          aria-hidden
        >
          <a
            href="#highlights"
            className="group flex flex-col items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/50 transition-colors hover:text-muted-foreground/80"
          >
            <span>scroll</span>
            <motion.div
              animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-9 w-px origin-top rounded-full bg-linear-to-b from-muted-foreground/60 to-transparent"
            />
          </a>
        </motion.div>
      </section>

      {/* ── Highlights ──────────────────────────────────────────────── */}
      <section id="highlights" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon, iconBg, iconColor }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.48, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
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
            </motion.div>
          ))}
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
          <Badge variant="outline" className="mb-3 text-accent">
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
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.48, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="group relative h-full overflow-hidden border-border/50 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground group-hover:shadow-[0_0_16px_hsl(var(--accent)/0.4)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-3xl font-black tabular-nums text-border/60 transition-colors duration-300 group-hover:text-accent/30">
                      {step}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
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
          <div className="relative z-10 px-8 py-16 text-center sm:py-24">
            {/* Animated badge */}
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Join the community
            </motion.span>

            {/* Headline */}
            <h3 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl leading-[1.08]">
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
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Magnetic strength={0.3}>
                <Button
                  size="lg"
                  className="group relative h-auto w-full overflow-hidden rounded-full bg-accent px-10 py-5 text-sm font-semibold text-accent-foreground shadow-2xl shadow-accent/30 transition-all hover:bg-accent/90 hover:shadow-accent/50 sm:w-auto"
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
                  className="h-auto w-full rounded-full border-white/20 bg-white/5 px-10 py-5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/35 hover:bg-white/10 sm:w-auto"
                  render={<Link href="/guidelines" />}
                >
                  <>
                    <CheckCircle2 className="h-4 w-4" />
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

