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
  "No account, username, or public profile is required to submit.",
  "We store your message, optional music tag, moderation status, and anti-abuse security signals.",
  "Only authorized moderators can access the review queue and moderation tools.",
  "Rate limits and abuse checks protect the form from spam and automated misuse.",
];

const allowed = [
  "Personal reflections, honest experiences, and thoughtful stories.",
  "Supportive, respectful, and constructive messages.",
  "Emotional confessions shared without targeting or exposing others.",
];

const disallowed = [
  "Hate speech, slurs, harassment, or degrading language.",
  "Threats, doxxing, blackmail, or sharing private identifying information.",
  "Sexual exploitation, explicit violence, illegal content, or spam.",
];

const privacyNotes = [
  "If auto-save is enabled, drafts stay only on your device and can be removed anytime.",
  "Published posts do not show your identity.",
  "Security events and moderation records are retained only for operational and safety windows.",
];

export default function GuidelinesClient() {
  return (
    <PageShell containerClassName="max-w-4xl">
      <PageReveal>
      <PageBackLink className="mb-5" />
      <PageIntro
        badge="Privacy and Guidelines"
        title="Simple rules, safer sharing"
        description="How we protect anonymity, what we review, and what content can be published."
      />

      <section className="mt-8 grid gap-6 md:grid-cols-2" aria-labelledby="privacy-heading">
        <Card className="border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <CardTitle id="privacy-heading" className="text-lg font-bold">Privacy</CardTitle>
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

        <Card className="border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-lg font-bold">Data and safety notes</CardTitle>
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
          <Card className="border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-4">
            <Badge variant="outline" className="w-fit gap-1.5 border-action-accept/30 bg-action-accept/5 text-action-accept">
              <ShieldCheck className="h-3.5 w-3.5" />
              Allowed
            </Badge>
            <CardTitle id="allowed-heading" className="text-lg font-bold">What we welcome</CardTitle>
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

          <Card className="border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-4">
            <Badge variant="outline" className="w-fit gap-1.5 border-destructive/30 bg-destructive/5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Not Allowed
            </Badge>
            <CardTitle id="disallowed-heading" className="text-lg font-bold">What we remove</CardTitle>
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
