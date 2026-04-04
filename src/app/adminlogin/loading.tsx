import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoginLoading() {
  return (
    <main
      className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-live="polite"
      aria-label="Loading admin login"
    >
      <div className="w-full max-w-sm">
        <Card className="border-border/70 bg-card/75 shadow-none">
          <CardHeader className="space-y-3 pb-2 text-center">
            <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
            <Skeleton className="mx-auto h-8 w-40 rounded-lg" />
            <Skeleton className="mx-auto h-4 w-64 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-4 sm:p-8 sm:pt-5">
            <Skeleton className="h-4 w-16 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="mt-2 h-11 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
