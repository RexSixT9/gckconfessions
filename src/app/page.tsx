"use client";

import { useRef, useState, useEffect } from "react";
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
  "Your secret is safe here.",
  "Speak without fear.",
  "Every confession is heard.",
  "No identity. Just truth.",
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
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-accent/25 bg-background/85 p-6 shadow-[0_20px_60px_-10px_hsl(var(--accent)/0.25)] backdrop-blur-xl"
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

export default function HomePage() {
  return (
    <main className="flex-1 bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-32 -top-48 h-160 w-160 rounded-full bg-accent/8 blur-[130px] animate-float" />
          <div className="absolute -bottom-32 -left-32 h-130 w-130 rounded-full bg-accent/8 blur-[110px] animate-float animation-delay-500" />
          <div className="absolute left-1/3 top-1/2 h-95 w-95 -translate-y-1/2 rounded-full bg-violet-500/4 blur-[90px] animate-float animation-delay-300" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:pb-28 lg:pt-28">
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

            {/* Headline */}
            <motion.div variants={fadeUp} className="mt-5">
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.5rem]">
                <span className="block">Drop the mask.</span>
                <span className="grad-text-accent block">Speak the truth.</span>
              </h1>
            </motion.div>

            {/* Typewriter sub-heading */}
            <motion.div
              variants={fadeUp}
              className="mt-5 h-7 text-base text-muted-foreground sm:text-lg"
            >
              <TypewriterText
                phrases={heroTypingPhrases}
                className="text-muted-foreground"
                startDelay={700}
              />
            </motion.div>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              GCK Confessions is a private wall for honest thoughts. Write what
              you cannot say out loud, submit anonymously, and let your words
              reach people who truly understand.
            </motion.p>

            {/* Pill tags */}
            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2">
              {["No login required", "Human moderated", "Anonymous by default"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
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
              <Button
                size="lg"
                className="btn-glow h-auto w-full rounded-full px-8 py-4 text-sm font-semibold sm:w-auto"
                render={<Link href="/submit" />}
              >
                <>
                  <PenLine className="h-4 w-4" />
                  Write a confession
                </>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto w-full rounded-full px-8 py-4 text-sm sm:w-auto"
                render={<a href="#how-it-works" />}
              >
                <>
                  How it works
                  <ArrowRight className="h-4 w-4" />
                </>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="mt-12 flex flex-wrap gap-8 border-t border-border/40 pt-8"
            >
              {[
                { value: "100%", label: "Human reviewed", color: "text-accent" },
                { value: "<60s", label: "Typical submit", color: "" },
                { value: "Zero", label: "Data collected", color: "text-success" },
              ].map(({ value, label, color }) => (
                <div key={label}>
                  <p className={`text-2xl font-black sm:text-3xl ${color}`}>{value}</p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: 3D floating card (desktop) ── */}
          <motion.div
            initial={{ opacity: 0, x: 36, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:items-center lg:justify-center"
            style={{ perspective: "1000px" }}
          >
            <FloatingConfessionCard />
          </motion.div>
        </div>
      </section>

      {/* ── Highlights ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-linear-to-br from-accent/8 via-accent/5 to-transparent px-6 py-14 text-center sm:px-10 sm:py-20"
        >
          {/* Decorative orbs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -right-16 top-0 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />
          </div>
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />

          <Badge className="mb-4 gap-1.5 bg-accent/15 text-accent hover:bg-accent/15">
            <Sparkles className="h-3 w-3" />
            Community Wall
          </Badge>
          <h3 className="text-2xl font-black sm:text-4xl">
            Your secret is safe here.
          </h3>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            Thousands have already shared their untold stories. If you have
            something to say, this is your place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="btn-glow h-auto w-full rounded-full px-8 py-4 text-sm font-semibold sm:w-auto"
              render={<Link href="/submit" />}
            >
              <>
                <Heart className="h-4 w-4" />
                Submit now
              </>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-auto w-full rounded-full px-8 py-4 text-sm sm:w-auto"
              render={<Link href="/guidelines" />}
            >
              <>
                <CheckCircle2 className="h-4 w-4" />
                Read guidelines
              </>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

