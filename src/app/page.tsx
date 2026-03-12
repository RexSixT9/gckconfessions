"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Lock,
  MessageSquare,
  PenLine,
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

const highlights = [
  {
    title: "100% Anonymous",
    description: "No account, no email, no identity tracking.",
    icon: Lock,
  },
  {
    title: "Human Moderated",
    description: "Every confession is reviewed by a real person.",
    icon: ShieldCheck,
  },
  {
    title: "Fast Submission",
    description: "Share what you feel in under a minute.",
    icon: Zap,
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

export default function HomePage() {
  return (
    <main className="flex-1 bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative floating blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 h-130 w-130 translate-x-1/3 rounded-full bg-accent/10 blur-[110px] animate-float" />
          <div className="absolute -bottom-20 -left-24 h-95 w-95 rounded-full bg-accent/8 blur-[90px] animate-float animation-delay-500" />
          <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[60px] animate-float animation-delay-300" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-32">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge className="gap-1.5 bg-accent/10 px-3 py-1 text-xs text-accent hover:bg-accent/10">
              <Sparkles className="h-3 w-3" />
              Anonymous Space
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-5 max-w-3xl"
          >
            <h1 className="text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="block">A safe space</span>
              <span className="block text-accent">to speak freely.</span>
            </h1>
          </motion.div>

          {/* Typewriter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            GCK Confessions is a private wall for honest thoughts. Submit freely,
            stay anonymous, and let your words be heard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="w-full rounded-full font-semibold sm:w-auto"
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
              className="w-full rounded-full sm:w-auto"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12 flex flex-wrap gap-8 border-t border-border/40 pt-8"
          >
            <div>
              <p className="text-2xl font-black text-accent sm:text-3xl">100%</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Human&nbsp;reviewed
              </p>
            </div>
            <div>
              <p className="text-2xl font-black sm:text-3xl">&lt;60s</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Typical&nbsp;submit
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-success sm:text-3xl">Zero</p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Data&nbsp;collected
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Highlights ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card className="group h-full border-border/50 bg-card/50 transition-all duration-300 hover:border-accent/30 hover:shadow-md">
                <CardHeader>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-200 group-hover:bg-accent/15">
                    <Icon className="h-4 w-4" />
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
        className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Badge variant="outline" className="mb-3 text-accent">
            Workflow
          </Badge>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Three simple steps
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ step, title, description, icon: Icon }, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.42, delay: index * 0.1 }}
            >
              <Card className="group relative h-full overflow-hidden border-border/50 transition-all duration-300 hover:border-accent/30 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-black tabular-nums text-border transition-colors duration-300 group-hover:text-accent/25">
                      {step}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
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

      {/* ── CTA banner ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-accent/5 px-6 py-12 text-center sm:px-10 sm:py-16"
        >
          {/* Decorative blur orb */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl"
          >
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl" />
          </div>

          <h3 className="text-2xl font-black sm:text-3xl">
            Your secret is safe here.
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Thousands have already shared their untold stories. If you have
            something to say, this is your place.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full rounded-full font-semibold sm:w-auto"
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
              className="w-full rounded-full sm:w-auto"
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

