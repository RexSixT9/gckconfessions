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
      <div className="font-mono">
      <section className="grid gap-10 border-b border-border/60 pb-14 pt-2 sm:pb-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end max-[430px]:gap-7 max-[430px]:pb-10 max-[430px]:pt-1 max-[359px]:gap-6 max-[359px]:pb-8">
        <div className="space-y-6 max-[430px]:space-y-5 max-[359px]:space-y-4">
          <Badge variant="secondary" className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] max-[359px]:px-2.5 max-[359px]:text-[0.56rem]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Live Moderation
          </Badge>
          <h1 className="max-w-[17ch] text-[clamp(1.65rem,8.3vw,5rem)] font-semibold leading-[0.92] tracking-[0.03em] max-[430px]:leading-[0.96] max-[359px]:text-[1.52rem] max-[359px]:leading-none">
            Student confessions shared safely and anonymously.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base max-[430px]:text-[0.92rem] max-[359px]:text-[0.84rem]">
            Share what matters without exposing your identity. Every submission is reviewed before posting to keep the space respectful and useful.
          </p>
          <div className="flex flex-wrap gap-3 max-[430px]:flex-col max-[430px]:gap-2.5 max-[359px]:gap-2">
            <Button size="touch" variant="brand" className="w-full rounded-xl bg-[#FD105E] text-white hover:bg-[#E20E55] max-[359px]:h-10 max-[359px]:text-[0.67rem]" render={<Link href="/submit" />}>
              <>
                <Send className="h-4 w-4" />
                Submit Now
                <ArrowRight className="h-4 w-4" />
              </>
            </Button>
            <Button size="touch" variant="ghost" className="w-full rounded-xl border border-border bg-card/70 text-foreground hover:bg-card max-[359px]:h-10 max-[359px]:text-[0.67rem]" render={<Link href="/guidelines" />}>
              Rules & Safety
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border-border/70 bg-card/70 shadow-none">
          <CardHeader className="space-y-3 max-[359px]:space-y-2.5 max-[359px]:p-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.13em] text-muted-foreground max-[359px]:text-[0.7rem] max-[359px]:tracking-widest">System Status</CardTitle>
            <CardDescription className="text-sm text-foreground max-[359px]:text-[0.8rem]">Anonymous posting pipeline is active.</CardDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.58rem] uppercase tracking-widest">
                <Lock className="h-3 w-3" />
                Anonymous
              </Badge>
              <Badge variant="outline" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.58rem] uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3" />
                Human Review
              </Badge>
              <Badge variant="outline" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.58rem] uppercase tracking-widest">
                <Grid2X2 className="h-3 w-3" />
                Fast Queue
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs uppercase tracking-[0.12em] text-muted-foreground max-[359px]:space-y-2.5 max-[359px]:p-4 max-[359px]:pt-0 max-[359px]:text-[0.62rem]">
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 max-[359px]:px-2.5 max-[359px]:py-1.5">
              <span>Auth</span>
              <span className="text-foreground">Not Required</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 max-[359px]:px-2.5 max-[359px]:py-1.5">
              <span>Review</span>
              <span className="text-foreground">Human</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 max-[359px]:px-2.5 max-[359px]:py-1.5">
              <span>Publishing</span>
              <span className="text-foreground">Queued</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="py-12 sm:py-16 max-[430px]:py-10 max-[359px]:py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 max-[430px]:mb-6 max-[359px]:mb-5">
          <h2 className="text-[clamp(1.4rem,4vw,2.25rem)] font-semibold tracking-[0.04em]">Core Principles</h2>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-[0.12em]">Trusted Student Space</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3 max-[430px]:gap-3">
          {corePillars.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="rounded-2xl border-border/70 bg-card/65 shadow-none">
              <CardHeader className="space-y-4 max-[359px]:space-y-3 max-[359px]:p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent max-[359px]:h-8 max-[359px]:w-8">
                  <Icon className="h-5 w-5 max-[359px]:h-4 max-[359px]:w-4" />
                </span>
                <CardTitle className="text-[0.82rem] font-semibold uppercase tracking-[0.11em] max-[359px]:text-[0.72rem] max-[359px]:tracking-[0.08em]">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground max-[359px]:text-[0.82rem]">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 py-12 sm:py-16 max-[430px]:py-10 max-[359px]:py-8">
        <h2 className="mb-8 text-[clamp(1.4rem,4vw,2.25rem)] font-semibold tracking-[0.04em] max-[430px]:mb-6 max-[359px]:mb-5">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3 max-[430px]:gap-3">
          {processSteps.map(({ step, icon: Icon, title, description }) => (
            <Card key={step} className="rounded-2xl border-border/70 bg-card/70 shadow-none">
              <CardHeader className="space-y-3 max-[359px]:space-y-2.5 max-[359px]:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-semibold tabular-nums text-muted-foreground/45 max-[359px]:text-[1.45rem]">{step}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground/80 max-[359px]:h-8 max-[359px]:w-8">
                    <Icon className="h-4 w-4 max-[359px]:h-3.5 max-[359px]:w-3.5" />
                  </span>
                </div>
                <CardTitle className="text-[0.82rem] font-semibold uppercase tracking-[0.11em] max-[359px]:text-[0.72rem] max-[359px]:tracking-[0.08em]">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground max-[359px]:text-[0.82rem]">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 max-[430px]:py-10 max-[359px]:py-8">
        <Card className="rounded-2xl border-border/70 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between max-[430px]:gap-4 max-[430px]:p-4">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">Ready To Post</p>
              <h2 className="text-[clamp(1.5rem,4vw,2.4rem)] font-semibold tracking-[0.04em] max-[359px]:text-[1.25rem]">Say It Clearly. Stay Anonymous.</h2>
              <p className="max-w-2xl text-sm text-muted-foreground max-[359px]:text-[0.82rem]">Open the submit form and share your thought in one pass.</p>
            </div>
            <Button size="touch" variant="brand" className="w-full rounded-xl bg-[#FD105E] text-white hover:bg-[#E20E55] max-[359px]:h-10 max-[359px]:text-[0.67rem]" render={<Link href="/submit" />}>
              <>
                <Send className="h-4 w-4" />
                Open Submit Form
                <ArrowRight className="h-4 w-4" />
              </>
            </Button>
          </CardContent>
        </Card>
      </section>
      </div>
    </PageShell>
  );
}
