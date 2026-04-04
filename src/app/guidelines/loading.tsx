import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GuidelinesLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-9"
      role="status"
      aria-live="polite"
      aria-label="Loading privacy and guidelines"
    >
      <Skeleton className="mb-5 h-9 w-32 rounded-xl" />
      <div className="mb-8 space-y-3">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-5 w-full max-w-xl rounded-lg" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border/70 bg-card/70 shadow-none">
            <CardHeader className="space-y-3 pb-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-36 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((line) => (
                <Skeleton key={line} className="h-4 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border/70 bg-card/70 shadow-none">
            <CardHeader className="space-y-3 pb-4">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-lg" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((line) => (
                <Skeleton key={line} className="h-4 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
