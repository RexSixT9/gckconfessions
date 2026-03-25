import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock, Send, ScanEye, Grid2X2 } from "lucide-react";
import { PageShell } from "@/components/PageScaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const corePillars = [
  {
    icon: Lock,
    title: "Anonymous By Design",
    description: "No public profile, no social graph, no performative pressure.",
  },
  {
    icon: ShieldCheck,
    title: "Human Moderation",
    description: "Every submission is reviewed before publication.",
  },
  {
    icon: ScanEye,
    title: "Clear Community Rules",
    description: "Direct boundaries keep the platform safer and easier to trust.",
  },
];

const processSteps = [
  {
    step: "01",
    icon: Grid2X2,
    title: "Write",
    description: "Capture what you need to say in plain language.",
  },
  {
    step: "02",
    icon: Send,
    title: "Submit",
    description: "Send privately without signing up.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Review",
    description: "Moderators approve or reject based on guidelines.",
  },
];

export default function HomePage() {
  return (
    <PageShell containerClassName="max-w-6xl">
      <section className="grid gap-10 border-b border-border/60 pb-14 pt-2 sm:pb-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end max-[430px]:gap-7 max-[430px]:pb-10 max-[430px]:pt-1">
        <div className="space-y-6 max-[430px]:space-y-5">
          <Badge variant="secondary" className="w-fit rounded-sm px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]">
            Private | Minimal | Moderated
          </Badge>
          <h1 className="max-w-[16ch] text-[clamp(1.85rem,8vw,5rem)] font-semibold leading-[0.9] tracking-[0.04em] max-[430px]:leading-[0.94]">
            STUDENT CONFESSIONS, BUILT LIKE A CLEAN TERMINAL.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base max-[430px]:text-[0.92rem]">
            A minimalist space for honest campus thoughts. Submit anonymously, get reviewed by humans, and keep the conversation focused.
          </p>
          <div className="flex flex-wrap gap-3 max-[430px]:flex-col max-[430px]:gap-2.5">
            <Button size="touch" variant="brand" className="max-[430px]:w-full" render={<Link href="/submit" />}>
              <>
                Submit Now
                <ArrowRight className="h-4 w-4" />
              </>
            </Button>
            <Button size="touch" variant="ghost" className="max-[430px]:w-full" render={<Link href="/guidelines" />}>
              Community Rules
            </Button>
          </div>
        </div>

        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.13em] text-muted-foreground">System Status</CardTitle>
            <CardDescription className="text-sm text-foreground">Anonymous posting pipeline is active.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <span>Auth</span>
              <span className="text-foreground">Not Required</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <span>Review</span>
              <span className="text-foreground">Human</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <span>Publishing</span>
              <span className="text-foreground">Queued</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="py-12 sm:py-16 max-[430px]:py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 max-[430px]:mb-6">
          <h2 className="text-[clamp(1.4rem,4vw,2.25rem)] font-semibold tracking-[0.04em]">Core Principles</h2>
          <Badge variant="outline" className="rounded-sm px-3 py-1 text-[0.62rem] uppercase tracking-[0.14em]">Dark Tech Minimalism</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3 max-[430px]:gap-3">
          {corePillars.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/70 bg-card/65 shadow-none">
              <CardHeader className="space-y-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="text-[0.82rem] font-semibold uppercase tracking-[0.11em]">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 py-12 sm:py-16 max-[430px]:py-10">
        <h2 className="mb-8 text-[clamp(1.4rem,4vw,2.25rem)] font-semibold tracking-[0.04em] max-[430px]:mb-6">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3 max-[430px]:gap-3">
          {processSteps.map(({ step, icon: Icon, title, description }) => (
            <Card key={step} className="border-border/70 bg-card/70 shadow-none">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-semibold tabular-nums text-muted-foreground/45">{step}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground/80">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <CardTitle className="text-[0.82rem] font-semibold uppercase tracking-[0.11em]">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 max-[430px]:py-10">
        <Card className="border-border/70 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between max-[430px]:gap-4 max-[430px]:p-4">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">Ready To Post</p>
              <h2 className="text-[clamp(1.5rem,4vw,2.4rem)] font-semibold tracking-[0.04em]">Say It Clearly. Stay Anonymous.</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">Open the submit form and share your thought in one pass.</p>
            </div>
            <Button size="touch" variant="brand" className="max-[430px]:w-full" render={<Link href="/submit" />}>
              <>
                Open Submit Form
                <ArrowRight className="h-4 w-4" />
              </>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
