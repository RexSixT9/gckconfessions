"use client";

import {
  AlertTriangle,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageReveal } from "@/components/Reveal";
import { PageBackLink, PageIntro, PageShell } from "@/components/PageScaffold";

const privacyPoints = [
  "No account is required to submit.",
  "We store your message, optional music tag, and moderation logs.",
  "Only moderators can access the review queue.",
  "Rate limits and abuse checks help protect the form.",
];

const allowed = [
  "Personal reflections and honest experiences.",
  "Supportive, respectful messages.",
  "Light and harmless confessions.",
];

const disallowed = [
  "Hate speech, slurs, or harassment.",
  "Threats, doxxing, or private information.",
  "Violent, sexual, illegal, or spam content.",
];

const privacyNotes = [
  "If autosave is on, drafts stay on your device.",
  "Published posts do not include your identity.",
  "Repeated abuse may trigger temporary limits.",
];

export default function GuidelinesClient() {
  return (
    <PageShell containerClassName="max-w-4xl">
      <PageReveal>
      <PageBackLink className="mb-5" />
      <PageIntro
        badge="Privacy and Guidelines"
        title="Rules For Safe Anonymous Posting"
        description="Minimal policy set. Clear moderation boundaries."
      />

      <section className="mt-8 grid gap-6 md:grid-cols-2" aria-labelledby="privacy-heading">
        <Card className="rounded-2xl border-border/70 bg-card shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <CardTitle id="privacy-heading" className="text-[0.82rem] font-semibold uppercase tracking-[0.11em]">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {privacyPoints.map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <p>{point}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-[0.82rem] font-semibold uppercase tracking-[0.11em]">Good to know</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {privacyNotes.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2" aria-labelledby="allowed-heading">
          <Card className="rounded-2xl border-border/70 bg-card shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <Badge variant="outline" className="w-fit rounded-full gap-1.5 border-action-accept/30 bg-action-accept/5 text-action-accept">
              <ShieldCheck className="h-3.5 w-3.5" />
              Allowed
            </Badge>
            <CardTitle id="allowed-heading" className="text-[0.82rem] font-semibold uppercase tracking-[0.11em]">What we welcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {allowed.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-action-accept" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card shadow-none">
          <CardHeader className="space-y-3 pb-4">
            <Badge variant="outline" className="w-fit rounded-full gap-1.5 border-destructive/30 bg-destructive/5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Not Allowed
            </Badge>
            <CardTitle id="disallowed-heading" className="text-[0.82rem] font-semibold uppercase tracking-[0.11em]">What we remove</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {disallowed.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
          </Card>
      </section>

      </PageReveal>
    </PageShell>
  );
}
