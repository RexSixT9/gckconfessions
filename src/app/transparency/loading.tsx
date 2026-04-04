import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransparencyLoading() {
  return (
    <main
      className="mx-auto w-full max-w-5xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-9"
      role="status"
      aria-live="polite"
      aria-label="Loading transparency metrics"
    >
      <div className="mb-8 space-y-3">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-5 w-full max-w-xl rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/70 bg-card/70 shadow-none">
            <CardHeader>
              <Skeleton className="h-4 w-32 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-64 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
      </div>
    </main>
  );
}
