"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/Reveal";
import TypewriterText from "@/components/TypewriterText";
import { useMotionRuntime } from "@/components/MotionProvider";
import { cn } from "@/lib/cn";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const highlights = [
  {
    title: "100% Anonymous",
    description: "No account, no email, no identity tracking.",
    icon: Lock,
    tone: "bg-violet-500/10 text-violet-500 dark:text-violet-300",
  },
  {
    title: "Human Moderated",
    description: "Every confession is reviewed by a real person.",
    icon: ShieldCheck,
    tone: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-300",
  },
  {
    title: "Fast Submission",
    description: "Share what you feel in under a minute.",
    icon: Zap,
    tone: "bg-amber-500/10 text-amber-500 dark:text-amber-300",
  },
];

const steps = [
  {
    step: "01",
    title: "Write",
    description: "Type what is on your mind. Keep it clear and respectful.",
    icon: PenLine,
  },
  {
    step: "02",
    title: "Submit",
    description: "Send anonymously. No sign-up needed.",
    icon: MessageSquare,
  },
  {
    step: "03",
    title: "Published",
    description: "Approved confessions are shared with the community.",
    icon: Send,
  },
];

const heroTypingPhrases = ["Speak the truth.", "Share your story.", "Be heard.", "You are not alone."];

const mockConfessions = [
  "I still hum the song you used to sing when you thought no one was listening.",
  "Sometimes I reread our old messages just to feel close to you again.",
  "I got the scholarship but never told anyone because I feared expectations.",
  "I cry in the shower so nobody hears how much I am struggling.",
];

function TiltCard3D({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 240,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), {
    stiffness: 240,
    damping: 24,
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
        transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-accent/25 bg-card/75 p-6 shadow-[0_24px_70px_-12px_hsl(var(--accent)/0.22)] backdrop-blur-xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent" />

        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15">
            <Heart className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
          </span>
          <span className="text-xs font-medium text-muted-foreground">Anonymous confession</span>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success)/0.65)]" />
        </div>

        <div className="relative min-h-24">
          <Quote className="absolute -left-0.5 -top-0.5 h-4 w-4 text-accent/20" />
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="pl-5 text-sm leading-relaxed text-foreground/80"
            >
              {mockConfessions[idx]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {mockConfessions.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "block h-1 rounded-full transition-all duration-400",
                  i === idx ? "w-5 bg-accent" : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">GCK</span>
        </div>
      </motion.div>

      <div aria-hidden className="pointer-events-none absolute inset-x-5 bottom-0 h-12 rounded-full bg-accent/20 blur-xl" />
    </TiltCard3D>
  );
}

function StatChip({ icon: Icon, label, delay = 0 }: { icon: React.ElementType; label: string; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -7, 0] }}
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

export default function HomePage() {
  const { isAppReady, shouldReduceMotion } = useMotionRuntime();
  const canStartMotion = isAppReady || shouldReduceMotion;
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    setIsDesktop(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
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
      hidden: { opacity: 0, y: isDesktop ? 26 : 18 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: isDesktop ? 0.6 : 0.52, ease: EASE_OUT },
      },
    }),
    [isDesktop]
  );

  return (
    <main className="flex-1 bg-background">
      <section className="relative flex min-h-[calc(100dvh-var(--header-height))] flex-col overflow-hidden border-b border-border/50">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-24 -top-32 h-128 w-lg rounded-full bg-accent/10 blur-[130px]" />
          <div className="absolute -bottom-20 -left-20 h-112 w-md rounded-full bg-sky-500/8 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.32)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.32)_1px,transparent_1px)] bg-size-[52px_52px] mask-[radial-gradient(ellipse_78%_62%_at_50%_40%,black,transparent)]" />
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
            <motion.div variants={heroStaggerContainer} initial="hidden" animate={canStartMotion ? "show" : "hidden"}>
              <motion.div variants={heroFadeUp}>
                <Badge className="gap-1.5 bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/10">
                  <Sparkles className="h-3 w-3" />
                  Anonymous Space
                </Badge>
              </motion.div>

              <motion.div variants={heroFadeUp} className="mt-5">
                <h1 className="text-[clamp(2rem,8vw,4.4rem)] font-black leading-[1.06] tracking-tight text-balance">
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

              <motion.p variants={heroFadeUp} className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                GCK Confessions is a quiet space for honest thoughts. Write what you feel,
                submit anonymously, and let your words reach people who understand.
              </motion.p>

              <motion.div variants={heroFadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
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
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36, scale: 0.95, rotateY: -6 }}
              animate={canStartMotion ? { opacity: 1, x: 0, scale: 1, rotateY: 0 } : { opacity: 0, x: 36, scale: 0.95, rotateY: -6 }}
              transition={{ duration: 0.82, delay: 0.46, ease: EASE_OUT }}
              className="relative hidden lg:flex lg:items-center lg:justify-center"
              style={{ perspective: "1200px" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                aria-hidden
                className="absolute h-84 w-84 rounded-full border border-accent/10"
                style={{ borderStyle: "dashed" }}
              />

              <div className="absolute -left-14 top-10 z-10">
                <StatChip icon={Lock} label="100% Anonymous" />
              </div>
              <div className="absolute -right-14 bottom-10 z-10">
                <StatChip icon={ShieldCheck} label="Human Reviewed" delay={0.8} />
              </div>
              <div className="absolute -right-8 top-4 z-10">
                <StatChip icon={Zap} label="<60s Submit" delay={0.4} />
              </div>

              <FloatingConfessionCard />
            </motion.div>
          </div>
        </div>

        <motion.a
          href="#highlights"
          initial={{ opacity: 0, y: 10 }}
          animate={canStartMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.55, delay: 1.05, ease: "easeOut" }}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/65 transition-colors hover:text-muted-foreground/85 lg:flex"
          aria-label="Scroll to next section"
        >
          <span className="flex items-center gap-1">
            Scroll
            <ChevronDown className="h-3 w-3" />
          </span>
          <span className="h-6 w-px rounded-full bg-linear-to-b from-muted-foreground/60 to-transparent" />
        </motion.a>
      </section>

      <section id="highlights" className="mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3 gap-1.5 border-accent/30 bg-accent/5 text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Why this works
            </Badge>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Minimal by design</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Fewer distractions, clearer intent, and a more thoughtful experience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ title, description, icon: Icon, tone }, index) => (
              <ScrollReveal key={title} delay={index * 0.06} y={16} duration={0.4}>
                <Card className="group h-full border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/35 hover:shadow-lg hover:shadow-accent/5">
                  <CardHeader>
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-base font-bold">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3 uppercase tracking-wider">
              Workflow
            </Badge>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Three simple steps</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">From thought to community in seconds.</p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-3">
            <div aria-hidden className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-linear-to-r from-transparent via-accent/25 to-transparent sm:block" />
            {steps.map(({ step, title, description, icon: Icon }, index) => (
              <ScrollReveal key={step} delay={index * 0.08} y={16} duration={0.4}>
                <Card className="group h-full overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20 transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
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
        </div>
      </section>
    </main>
  );
}
