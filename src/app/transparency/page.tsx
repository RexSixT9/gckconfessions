import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageIntro, PageShell } from "@/components/PageScaffold";

type TransparencyData = {
  queue: { pending: number; approved: number; rejected: number; published: number };
  moderationActions: number;
  totalAuditEvents: number;
  generatedAt: string;
};

async function getData(): Promise<TransparencyData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/transparency`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as TransparencyData;
  } catch {
    return null;
  }
}

export default async function TransparencyPage() {
  const data = await getData();

  return (
    <PageShell>
      <PageIntro
        badge="Transparency"
        title="Moderation Snapshot"
        description="Live aggregate counters from the moderation pipeline."
      />

      {!data ? (
        <Card className="mt-6 rounded-2xl border-border/70 bg-card shadow-none">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Stats are unavailable right now. Please try again shortly.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Pending review", data.queue.pending],
            ["Approved", data.queue.approved],
            ["Rejected", data.queue.rejected],
            ["Published", data.queue.published],
            ["Moderator actions", data.moderationActions],
            ["Audit log entries", data.totalAuditEvents],
          ].map(([label, value]) => (
            <Card key={label as string} className="rounded-2xl border-border/70 bg-card shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[clamp(1.6rem,5vw,2rem)] font-semibold tabular-nums tracking-[0.03em]">{value as number}</p>
              </CardContent>
            </Card>
          ))}
          <p className="col-span-full text-xs text-muted-foreground lg:col-span-3">
            Last refreshed: {new Date(data.generatedAt).toLocaleString()}
          </p>
          <p className="col-span-full text-xs text-muted-foreground lg:col-span-3">
            These are aggregate counts only and do not expose user identity.
          </p>
        </div>
      )}
    </PageShell>
  );
}
