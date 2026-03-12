import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import AdminList from "@/components/admin/AdminList";
import SignOutButton from "@/components/admin/SignOutButton";
import { connectToDatabase } from "@/lib/mongodb";
import Confession from "@/models/Confession";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getStats() {
  try {
    await connectToDatabase();
    const [pending, approved, rejected] = await Promise.all([
      Confession.countDocuments({ status: "pending" }),
      Confession.countDocuments({ status: "approved" }),
      Confession.countDocuments({ status: "rejected" }),
    ]);
    return { pending, approved, rejected, total: pending + approved + rejected };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/adminlogin");

  try {
    const payload = await verifyAdminToken(token);
    if (!payload.sub) redirect("/adminlogin");
  } catch {
    redirect("/adminlogin");
  }

  const stats = await getStats();

  return (
    <main className="flex-1 bg-[hsl(var(--background))]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">

        {/*  Page header  */}
        <div className="mb-8 flex animate-slide-down flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 uppercase tracking-wider">
              Admin Panel
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Confession Review
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review, approve, reject, and manage submissions.
            </p>
          </div>
          <SignOutButton />
        </div>

        {/*  Stats bar  */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { label: "Total",    value: stats.total,    cls: "text-foreground",               dot: "bg-muted-foreground",      delay: "" },
              { label: "Pending",  value: stats.pending,  cls: "text-[hsl(var(--warning))]",    dot: "bg-[hsl(var(--warning))]", delay: "animation-delay-100" },
              { label: "Approved", value: stats.approved, cls: "text-green-600 dark:text-green-400", dot: "bg-green-500",        delay: "animation-delay-200" },
              { label: "Rejected", value: stats.rejected, cls: "text-muted-foreground",          dot: "bg-muted-foreground/40",   delay: "animation-delay-300" },
            ].map(({ label, value, cls, dot, delay }) => (
              <Card
                key={label}
                className={`border-shine animate-slide-up ${delay}`}
              >
                <CardContent className="flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                  </div>
                  <span className={`text-3xl font-black tabular-nums ${cls}`}>{value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/*  Main list  */}
        <Card className="animate-blur-in border-shine animation-delay-400">
          <CardContent className="p-6 sm:p-8">
            <AdminList />
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
