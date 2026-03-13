import Link from "next/link";
import {
  ArrowRight,
  Check,
  Lock,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PageReveal, ScrollReveal } from "@/components/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pillars = [
  {
    title: "Anonymous by default",
    description: "No account and no public profile.",
    icon: Lock,
  },
  {
    title: "Human moderated",
    description: "Every confession is reviewed before publishing.",
    icon: ShieldCheck,
  },
  {
    title: "Fast to submit",
    description: "Write and send in under a minute.",
    icon: Sparkles,
  },
];

const steps = [
  {
    number: "01",
    title: "Write what you feel",
    description: "Share your thoughts clearly and avoid personal identifiers.",
    icon: PenLine,
  },
  {
    number: "02",
    title: "Submit privately",
    description: "Send your confession without creating an account.",
    icon: MessageSquareText,
  },
  {
    number: "03",
    title: "Reviewed with care",
    description: "Moderators review every post for safety before it goes live.",
    icon: Check,
  },
];

const facts = [
  ["Signup required", "No"],
  ["Review process", "Human"],
  ["Typical submit time", "< 60 seconds"],
  ["Identity shown publicly", "Never"],
];

export default function HomePage() {
  return (
    <main className="flex-1 bg-background">
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-14 top-8 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-size-[42px_42px] mask-[radial-gradient(ellipse_at_center,black_46%,transparent_82%)]" />
        </div>

        <PageReveal className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="w-fit gap-1.5 bg-accent/10 text-accent hover:bg-accent/10">
              <Sparkles className="h-3.5 w-3.5" />
              GCK Confessions
            </Badge>

            <div className="space-y-4">
              <h1 className="text-[clamp(2.1rem,8vw,4.1rem)] font-black leading-[1.05] tracking-tight">
                A clean, quiet place
                <span className="block text-accent">to speak honestly.</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Share what is on your mind anonymously. The experience is simple,
                moderated, and built to keep focus on your words.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-foreground/90">
                No account needed
              </span>
              <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-foreground/90">
                Human reviewed
              </span>
              <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-foreground/90">
                Anonymous always
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-auto gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                render={<Link href="/submit" />}
              >
                <>
                  Write a confession
                  <ArrowRight className="h-4 w-4" />
                </>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto rounded-full border-border/70 px-7 py-3.5 text-sm"
                render={<Link href="/guidelines" />}
              >
                Read guidelines
              </Button>
            </div>
          </div>

          <ScrollReveal y={12} className="lg:justify-self-end">
            <Card className="border-border/70 bg-card/75 shadow-none backdrop-blur-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-semibold tracking-tight">Why this works</CardTitle>
                <CardDescription>
                  Designed with restraint: less noise, clearer intent, safer sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pillars.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-border/70 bg-background/70 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold tracking-tight">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </ScrollReveal>
        </PageReveal>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 space-y-2">
          <Badge variant="secondary" className="uppercase tracking-wider">
            How It Works
          </Badge>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Three simple steps</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ number, title, description, icon: Icon }, index) => (
            <ScrollReveal key={number} delay={index * 0.05} y={12}>
              <Card className="h-full border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-2xl font-black text-border">{number}</span>
                  </div>
                  <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <ScrollReveal y={12}>
            <Card className="h-full border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  Trust Snapshot
                </Badge>
                <CardTitle className="text-xl font-semibold tracking-tight">Built for thoughtful sharing</CardTitle>
                <CardDescription>
                  Confessions stay anonymous, while moderation keeps the space safe and usable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {facts.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border/70 bg-background/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-semibold tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal y={12} delay={0.04}>
            <Card className="h-full border-border/70 bg-foreground text-background shadow-none">
              <CardHeader>
                <Badge className="w-fit bg-background/15 text-background hover:bg-background/15">
                  Start now
                </Badge>
                <CardTitle className="text-2xl font-black tracking-tight">Your words deserve clarity.</CardTitle>
                <CardDescription className="text-background/75">
                  Say what matters without noise, pressure, or exposure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-auto w-full justify-center rounded-full px-7 py-3.5 text-sm font-semibold"
                  render={<Link href="/submit" />}
                >
                  <>
                    Submit confession
                    <ArrowRight className="h-4 w-4" />
                  </>
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
