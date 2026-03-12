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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

export default function HomePage() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <Card className="border-border/70">
            <CardHeader className="gap-4">
              <Badge className="w-fit gap-1 bg-accent/10 text-accent hover:bg-accent/10">
                <Sparkles className="h-3.5 w-3.5" />
                Anonymous Space
              </Badge>
              <CardTitle className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Say what you cannot say out loud.
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm sm:text-base">
                GCK Confessions is a private wall for honest thoughts. Submit freely,
                stay anonymous, and let your words be heard.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-start">
              <Button size="lg" className="w-full sm:w-auto" render={<Link href="/submit" />}>
                <>
                  <PenLine className="h-4 w-4" />
                  Write a confession
                </>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" render={<a href="#how-it-works" />}>
                <>
                  How it works
                  <ArrowRight className="h-4 w-4" />
                </>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Trust Snapshot</CardTitle>
              <CardDescription>Built for privacy and emotional safety.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-3xl font-black text-accent">100%</p>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  human-reviewed posts
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-3xl font-black text-foreground">&lt;60s</p>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  typical submit time
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <Card className="h-full border-border/70">
                <CardHeader>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-base font-bold">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </section>

        <section id="how-it-works" className="mt-12 sm:mt-16">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Badge variant="outline" className="mb-2 text-accent">
                Workflow
              </Badge>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Three simple steps
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(({ step, title, description, icon: Icon }, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <Card className="h-full border-border/70">
                  <CardHeader>
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant="secondary">{step}</Badge>
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <CardTitle className="text-base font-bold">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border/70 bg-muted/30 p-6 text-center sm:p-8"
        >
          <h3 className="text-xl font-black sm:text-2xl">Your secret is safe here.</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Thousands have already shared their untold stories. If you have something to say,
            this is your place.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button render={<Link href="/submit" />}>
              <>
                <Heart className="h-4 w-4" />
                Submit now
              </>
            </Button>
            <Button variant="outline" render={<Link href="/guidelines" />}>
              <>
                <CheckCircle2 className="h-4 w-4" />
                Read guidelines
              </>
            </Button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
