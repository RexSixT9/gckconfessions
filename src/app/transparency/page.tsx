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
        title="Safety and moderation stats"
        description="We publish queue and moderation activity to increase trust."
      />

      {!data ? (
        <Card className="mt-6 border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Stats are temporarily unavailable. Please try again later.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Pending", data.queue.pending],
            ["Approved", data.queue.approved],
            ["Rejected", data.queue.rejected],
            ["Published", data.queue.published],
            ["Moderation actions", data.moderationActions],
            ["Audit events", data.totalAuditEvents],
          ].map(([label, value]) => (
            <Card key={label as string} className="border-border/70 bg-card/70 shadow-none backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[clamp(1.5rem,5vw,1.85rem)] font-black tabular-nums">{value as number}</p>
              </CardContent>
            </Card>
          ))}
          <p className="col-span-full text-xs text-muted-foreground lg:col-span-3">
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </PageShell>
  );
}
