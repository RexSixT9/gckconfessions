"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Activity,
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
  Users,
} from "lucide-react";

import TypewriterText from "@/components/TypewriterText";
import { ScrollReveal } from "@/components/Reveal";
import { useMotionRuntime } from "@/components/MotionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { isLowEndDevice } from "@/lib/motionConfig";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const sectionReveal = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const highlights = [
  {
    icon: Users,
    title: "Safe Space",
    description: "A calm place to share without pressure.",
  },
  {
    icon: ShieldCheck,
    title: "Human Review",
    description: "Every post is checked before it goes live.",
  },
  {
    icon: Lock,
    title: "Anonymous",
    description: "No account and no public identity.",
  },
];

const steps = [
  {
    step: "01",
    icon: PenLine,
    title: "Write",
    description: "Share your message in your own words.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Submit",
    description: "Send it privately with no sign-up.",
  },
  {
    step: "03",
    icon: Send,
    title: "Get Reviewed",
    description: "If approved, it is published for others to read.",
  },
];

const heroTypingPhrases = ["Speak freely.", "Stay anonymous.", "Be heard."];

const mockConfessions = [
  "I still hum the song you used to sing when you thought no one could hear you.",
  "I reread our old chats sometimes just to feel close to you again.",
  "I got the scholarship and stayed quiet because I was scared of the pressure.",
  "Some nights I cry in the shower so nobody has to hear me break down.",
];

const testimonials = [
  {
    quote: "I shared once and felt lighter.",
    meta: "Anonymous student",
  },
  {
    quote: "Simple, safe, and easy to use.",
    meta: "Student confession",
  },
  {
    quote: "I could be honest without sharing my name.",
    meta: "Community member",
  },
];

function OrbitRing({ radius, duration, reverse = false }: { radius: number; duration: number; reverse?: boolean }) {
  return (
    <motion.div
      aria-hidden
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      className="pointer-events-none absolute rounded-full border border-accent/15"
      style={{ width: radius * 2, height: radius * 2 }}
    />
  );
}

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

function FloatingConfessionCard({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % mockConfessions.length), 4200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <TiltCard3D className="relative w-full max-w-sm cursor-default select-none">
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={reduceMotion ? undefined : { duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-6 shadow-[0_22px_64px_-10px_hsl(var(--foreground)/0.16)] backdrop-blur-xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/35 to-transparent" />

        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/8">
            <Heart className="h-3.5 w-3.5 text-foreground" strokeWidth={2.5} />
          </span>
          <span className="text-xs font-medium text-muted-foreground">Anonymous confession</span>
          <span className="ml-auto flex h-2 w-2 rounded-full bg-foreground/70" />
        </div>

        <div className="relative min-h-24">
          <Quote className="absolute -left-0.5 -top-0.5 h-4 w-4 text-foreground/20" />
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="pl-5 text-sm leading-relaxed text-foreground/85"
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
                  i === idx ? "w-5 bg-foreground/70" : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">GCK</span>
        </div>
      </motion.div>

      <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-0 h-12 rounded-full bg-foreground/12 blur-xl" />
    </TiltCard3D>
  );
}

function StatChip({
  icon: Icon,
  label,
  delay = 0,
  reduceMotion = false,
}: {
  icon: React.ElementType;
  label: string;
  delay?: number;
  reduceMotion?: boolean;
}) {
  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
      transition={reduceMotion ? undefined : { duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className="pointer-events-none select-none"
    >
      <div className="flex items-center gap-2 rounded-xl border border-border/65 bg-card/85 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-lg">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10">
          <Icon className="h-3 w-3 text-foreground/80" />
        </span>
        <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
      </div>
    </motion.div>
  );
}

function MiniTestimonialSlider({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 3600);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <Card className="border-border/60 bg-card/65 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">What students say</CardTitle>
        <CardDescription>Real feedback.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-24" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="space-y-2"
            >
              <p className="text-sm leading-relaxed text-foreground/85">
                &ldquo;{testimonials[idx].quote}&rdquo;
              </p>
              <p className="text-xs font-medium text-muted-foreground">{testimonials[idx].meta}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-4 flex gap-1.5">
          {testimonials.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === idx ? "w-5 bg-foreground/70" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { isAppReady, shouldReduceMotion } = useMotionRuntime();
  const canStartMotion = isAppReady || shouldReduceMotion;
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false
  );
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : false
  );
  const [isLowEnd] = useState(() => (typeof window !== "undefined" ? isLowEndDevice() : false));
  const heroRef = useRef<HTMLElement | null>(null);
  const highlightsRef = useRef<HTMLElement | null>(null);
  const stepsRef = useRef<HTMLElement | null>(null);
  const reduceHeavyMotion = shouldReduceMotion || isLowEnd;
  const enableSnap = isDesktop && !reduceHeavyMotion;

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: highlightsProgress } = useScroll({
    target: highlightsRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsRef,
    offset: ["start end", "end start"],
  });

  const highlightsParallax = useSpring(useTransform(highlightsProgress, [0, 1], [16, -16]), {
    stiffness: 120,
    damping: 24,
  });

  const heroParallaxY = useSpring(useTransform(heroProgress, [0, 1], [0, 44]), {
    stiffness: 110,
    damping: 24,
  });
  const heroParallaxOpacity = useTransform(heroProgress, [0, 0.85, 1], [1, 1, 0.7]);

  const stepsParallax = useSpring(useTransform(stepsProgress, [0, 1], [14, -14]), {
    stiffness: 120,
    damping: 24,
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const tabletMedia = window.matchMedia("(min-width: 768px)");

    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    const onTabletChange = (event: MediaQueryListEvent) => setIsTablet(event.matches);

    media.addEventListener("change", onChange);
    tabletMedia.addEventListener("change", onTabletChange);

    return () => {
      media.removeEventListener("change", onChange);
      tabletMedia.removeEventListener("change", onTabletChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("home-snap", enableSnap);
    return () => {
      root.classList.remove("home-snap");
    };
  }, [enableSnap]);

  const heroStaggerContainer = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: isDesktop ? 0.11 : isTablet ? 0.085 : 0.065,
          delayChildren: isDesktop ? 0.11 : isTablet ? 0.08 : 0.05,
        },
      },
    }),
    [isDesktop, isTablet]
  );

  const heroFadeUp = useMemo(
    () => ({
      hidden: { opacity: 0, y: isDesktop ? 26 : 18, filter: "blur(4px)" },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: isDesktop ? 0.6 : 0.52, ease: EASE_OUT },
      },
    }),
    [isDesktop]
  );

  function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.scrollIntoView({
      behavior: reduceHeavyMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <main className="flex-1 overflow-x-clip bg-background">
      <section
        id="home-hero"
        ref={heroRef}
        aria-labelledby="hero-title"
        className="snap-section relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden border-b border-border/50 py-14 md:min-h-[calc(100dvh-var(--header-height))] md:py-0"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-24 -top-32 h-128 w-lg rounded-full bg-foreground/8 blur-[130px]" />
          <div className="absolute -bottom-20 -left-20 h-112 w-md rounded-full bg-foreground/8 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-size-[52px_52px] mask-[radial-gradient(ellipse_80%_64%_at_50%_40%,black,transparent)]" />
          <div className="hero-beam opacity-65" />
          <div className="hero-beam-extra opacity-45" />
        </div>

        <motion.div
          style={
            reduceHeavyMotion
              ? undefined
              : {
                  y: heroParallaxY,
                  opacity: heroParallaxOpacity,
                }
          }
          className="flex flex-1 items-center"
        >
          <div className="min-w-0-children mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <motion.div
              variants={heroStaggerContainer}
              initial="hidden"
              animate={canStartMotion ? "show" : "hidden"}
              className="space-y-6 text-center md:text-left"
            >
              <motion.div variants={heroFadeUp}>
                <Badge className="inline-flex h-8 gap-1.5 border border-border/60 bg-card/65 px-4 text-xs font-medium text-foreground hover:bg-card">
                  <Activity className="h-3 w-3" />
                  Anonymous space
                </Badge>
              </motion.div>

              <motion.div variants={heroFadeUp} className="mt-5">
                <h1
                  id="hero-title"
                  className="mx-auto max-w-[16ch] text-[clamp(2rem,8vw,4.4rem)] font-black leading-[1.03] tracking-tight text-balance md:mx-0 md:max-w-[15ch]"
                >
                  <span className="block text-foreground">Speak freely here.</span>
                  <span className="block max-w-[22ch] text-foreground/75">
                    <TypewriterText
                      phrases={heroTypingPhrases}
                      typingSpeed={isDesktop ? 50 : 55}
                      deletingSpeed={isDesktop ? 24 : 28}
                      pauseAfterType={isDesktop ? 3000 : 2600}
                      startDelay={isDesktop ? 1000 : 850}
                      forceAnimate
                      cursorClassName="bg-foreground"
                    />
                  </span>
                </h1>
              </motion.div>

              <motion.p variants={heroFadeUp} className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:mx-0">
                Share your thoughts anonymously.
                Every post is reviewed before publishing.
              </motion.p>

              <motion.div variants={heroFadeUp} className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {["No sign-up", "Human review", "Anonymous"].map((item) => (
                  <motion.span
                    key={item}
                    initial={reduceHeavyMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={
                      canStartMotion
                        ? { opacity: 1, y: 0 }
                        : reduceHeavyMotion
                          ? undefined
                          : { opacity: 0, y: 8 }
                    }
                    transition={reduceHeavyMotion ? undefined : { duration: 0.35, ease: EASE_OUT }}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-foreground/85 backdrop-blur-sm"
                  >
                    {item}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div variants={heroFadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <motion.div whileHover={reduceHeavyMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="brand"
                    className="group h-auto gap-2 rounded-full px-8 py-4 text-sm font-semibold shadow-none"
                    render={<Link href="/submit" />}
                  >
                    <>
                      <PenLine className="h-4 w-4" />
                      Share confession
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  </Button>
                </motion.div>

                <motion.div whileHover={reduceHeavyMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto gap-2 rounded-full border-border/60 px-8 py-4 text-sm backdrop-blur-sm transition-all hover:border-foreground/35 hover:bg-card/60"
                    render={<Link href="#how-it-works" />}
                  >
                    <>
                      How it works
                      <ArrowRight className="h-4 w-4" />
                    </>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36, scale: 0.95, rotateY: -6 }}
              animate={
                canStartMotion
                  ? { opacity: 1, x: 0, scale: 1, rotateY: 0 }
                  : { opacity: 0, x: 36, scale: 0.95, rotateY: -6 }
              }
              transition={{ duration: 0.82, delay: 0.46, ease: EASE_OUT }}
              className="relative hidden lg:flex lg:items-center lg:justify-center"
              style={{ perspective: "1200px" }}
            >
              {!reduceHeavyMotion ? <OrbitRing radius={158} duration={18} /> : null}
              {!reduceHeavyMotion ? <OrbitRing radius={118} duration={12} reverse /> : null}

              <div className="absolute -left-14 top-10 z-10">
                <StatChip icon={Lock} label="Anonymous" reduceMotion={reduceHeavyMotion} />
              </div>
              <div className="absolute -right-14 bottom-10 z-10">
                <StatChip icon={ShieldCheck} label="Human review" delay={0.8} reduceMotion={reduceHeavyMotion} />
              </div>
              <div className="absolute -right-8 top-4 z-10">
                <StatChip icon={Sparkles} label="Simple flow" delay={0.4} reduceMotion={reduceHeavyMotion} />
              </div>

              <FloatingConfessionCard reduceMotion={reduceHeavyMotion} />
            </motion.div>
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={() => scrollToSection("highlights")}
          initial={{ opacity: 0, y: 10 }}
          animate={canStartMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.55, delay: 1.05, ease: "easeOut" }}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/55 transition-colors hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:flex"
          aria-label="Scroll to next section"
          aria-controls="highlights"
        >
          <span>Scroll down</span>
          <motion.span
            aria-hidden
            animate={reduceHeavyMotion ? { opacity: 0.7 } : { opacity: [0.35, 0.75, 0.35] }}
            transition={reduceHeavyMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-6 w-px bg-border/80"
          />
          <motion.span
            aria-hidden
            animate={reduceHeavyMotion ? { y: 0, opacity: 0.75 } : { y: [0, 5, 0], opacity: [0.55, 1, 0.55] }}
            transition={reduceHeavyMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
        </motion.button>
      </section>

      <motion.section
        initial={reduceHeavyMotion ? undefined : "hidden"}
        whileInView={reduceHeavyMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.22 }}
        variants={sectionReveal}
        className="snap-section mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"
        aria-labelledby="community-pulse-heading"
      >
        <ScrollReveal y={12} duration={0.36}>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60 bg-card/65 backdrop-blur-sm">
              <CardHeader>
                <CardTitle id="community-pulse-heading" className="text-lg font-bold tracking-tight">At a glance</CardTitle>
                <CardDescription>
                  Anonymous sharing, reviewed by people.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Submissions", value: "Open daily" },
                    { label: "Review", value: "Human checked" },
                    { label: "Identity", value: "Anonymous" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/70 bg-background/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <MiniTestimonialSlider reduceMotion={reduceHeavyMotion} />
          </div>
        </ScrollReveal>
      </motion.section>

      <motion.section
        initial={reduceHeavyMotion ? undefined : "hidden"}
        whileInView={reduceHeavyMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.25 }}
        variants={sectionReveal}
        className="snap-section mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8"
        aria-labelledby="explore-heading"
      >
        <ScrollReveal y={12} duration={0.38}>
          <div className="rounded-2xl border border-border/60 bg-card/55 p-5 backdrop-blur-sm sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="explore-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explore</h2>
              <Badge variant="outline" className="h-8 border-border/70 px-3">Reviewed posts</Badge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Read approved posts and share when ready.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Button size="sm" variant="brand" className="h-9 rounded-full px-4" render={<Link href="/submit" />}>
                <>
                  Share now
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </>
              </Button>
              <Button size="sm" variant="outline" className="h-9 rounded-full border-border/70 px-4" render={<Link href="/transparency" />}>
                View transparency
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>

      <Separator className="mx-auto w-full max-w-7xl opacity-55" />

      <motion.section
        id="highlights"
        aria-labelledby="highlights-heading"
        ref={highlightsRef}
        style={{ y: reduceHeavyMotion || enableSnap ? 0 : highlightsParallax }}
        className="snap-section mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="w-full">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3 h-8 gap-1.5 border-border/70 bg-card/60 px-3.5 text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Why this works
            </Badge>
            <h2 id="highlights-heading" className="mx-auto max-w-[18ch] text-2xl font-black leading-[1.08] tracking-tight sm:text-3xl">Simple, clear, and safe</h2>
            <p className="mx-auto mt-2 max-w-[54ch] text-sm text-muted-foreground sm:text-base">
              Minimal design with clear safety rules.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ title, description, icon: Icon }, index) => (
              <ScrollReveal key={title} delay={index * 0.06} y={16} duration={0.4}>
                <motion.div
                  whileHover={reduceHeavyMotion ? undefined : { y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.22 }}
                >
                  <Card className="group h-full border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:border-foreground/35 hover:shadow-lg hover:shadow-black/10">
                    <CardHeader>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-foreground/80">
                        <Icon className="h-5 w-5" />
                      </span>
                      <CardTitle className="text-base font-bold">{title}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </motion.section>

      <Separator className="mx-auto w-full max-w-7xl opacity-55" />

      <motion.section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        ref={stepsRef}
        style={{ y: reduceHeavyMotion || enableSnap ? 0 : stepsParallax }}
        className="snap-section mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="w-full">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3 h-8 px-3.5 uppercase tracking-wider">
              How it works
            </Badge>
            <h2 id="how-it-works-heading" className="mx-auto max-w-[18ch] text-2xl font-black leading-[1.08] tracking-tight sm:text-3xl">Three simple steps</h2>
            <p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted-foreground">
              Write, submit, and wait for review.
            </p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-linear-to-r from-transparent via-foreground/25 to-transparent sm:block"
            />
            {steps.map(({ step, title, description, icon: Icon }, index) => (
              <ScrollReveal key={step} delay={index * 0.08} y={16} duration={0.4}>
                <motion.div whileHover={reduceHeavyMotion ? undefined : { y: -3 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
                  <Card className="group h-full overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-foreground/35 hover:shadow-lg hover:shadow-black/10">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-foreground/80 transition-all duration-300 group-hover:bg-foreground group-hover:text-background">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-3xl font-black tabular-nums text-border transition-colors duration-300 group-hover:text-foreground/40">
                          {step}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={reduceHeavyMotion ? undefined : "hidden"}
        whileInView={reduceHeavyMotion ? undefined : "show"}
        viewport={{ once: true, amount: 0.25 }}
        variants={sectionReveal}
        className="snap-section mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8"
      >
        <ScrollReveal y={16} duration={0.45}>
          <div className="relative overflow-hidden rounded-3xl border border-border/60">
            <div className="absolute inset-0 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 dark:from-zinc-900 dark:via-zinc-950 dark:to-black" />
            <div className="absolute inset-0 hidden opacity-[0.03] md:block [background-image:url('data:image/svg+xml,%3Csvg viewBox%3D%220 0 256 256%22 xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cfilter id%3D%22n%22%3E%3CfeTurbulence type%3D%22fractalNoise%22 baseFrequency%3D%220.9%22 numOctaves%3D%224%22 stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect width%3D%22100%25%22 height%3D%22100%25%22 filter%3D%22url(%23n)%22/%3E%3C/svg%3E') ]" />
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/8 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-white/8 blur-3xl" />

            <div className="relative z-10 px-4 py-14 text-center sm:px-8 sm:py-24">
              <Badge className="mb-6 h-8 border border-white/20 bg-white/10 px-3.5 text-white hover:bg-white/10">You can start now</Badge>
              <h2 className="mx-auto max-w-[16ch] text-[clamp(2rem,6vw,3.8rem)] font-black leading-[1.04] tracking-tight text-white">
                Share what you want to say.
                <span className="block text-zinc-300">Keep it simple. Keep it anonymous.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[56ch] text-sm leading-relaxed text-zinc-400 sm:text-base">
                A simple space for honest student confessions.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <motion.div whileHover={reduceHeavyMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="group h-auto w-full rounded-full bg-white px-7 py-4 text-sm font-semibold text-black shadow-xl transition-all hover:bg-zinc-200 sm:w-auto sm:px-9"
                    render={<Link href="/submit" />}
                  >
                    <>
                      Share confession
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  </Button>
                </motion.div>

                <motion.div whileHover={reduceHeavyMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto w-full rounded-full border-white/30 bg-white/5 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm hover:border-white/45 hover:bg-white/10 sm:w-auto sm:px-9"
                    render={<Link href="/guidelines" />}
                  >
                    Read the guidelines
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </motion.section>
    </main>
  );
}
