import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Badge variant="secondary" className="mb-3 uppercase tracking-wider">
        Transparency
      </Badge>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Safety and moderation stats</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We publish queue and moderation activity to increase trust.
      </p>

      {!data ? (
        <Card className="mt-6 border-border/70">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Stats are temporarily unavailable. Please try again later.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Pending", data.queue.pending],
            ["Approved", data.queue.approved],
            ["Rejected", data.queue.rejected],
            ["Published", data.queue.published],
            ["Moderation actions", data.moderationActions],
            ["Audit events", data.totalAuditEvents],
          ].map(([label, value]) => (
            <Card key={label as string} className="border-border/70">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black tabular-nums">{value as number}</p>
              </CardContent>
            </Card>
          ))}
          <p className="col-span-full text-xs text-muted-foreground">
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </main>
  );
}
